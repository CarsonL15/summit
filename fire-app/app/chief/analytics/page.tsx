'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { AnimatedCard, AnimatedCardContent } from '@/components/ui/animated-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Shield, Users, Activity, ChevronLeft, ChevronRight, Target,
  AlertTriangle, Search, Clock, Flame
} from 'lucide-react'
import { Database } from '@/types/database'
import { getRiskLevel, getRiskTextColor } from '@/lib/utils/fms'

type UserData = Database['public']['Tables']['users']['Row']
type StationData = Database['public']['Tables']['stations']['Row']
type FMSScoreData = Database['public']['Tables']['fms_scores']['Row']
type SeriesAssignmentData = Database['public']['Tables']['series_assignments']['Row']

interface FirefighterWithDetails extends UserData {
  lastFMS?: FMSScoreData
  lastAssessedDate?: string
  activeSeries?: SeriesAssignmentData & {
    series: Database['public']['Tables']['series']['Row'] | null
  }
}

interface StationWithStats extends StationData {
  personnelCount: number
  highRiskCount: number
  avgFmsScore: number
  needsAssessmentCount: number
}

function AnalyticsContent() {
  const searchParams = useSearchParams()
  const stationParam = searchParams.get('station')

  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  // Department level data
  const [stations, setStations] = useState<StationWithStats[]>([])
  const [departmentStats, setDepartmentStats] = useState({
    totalPersonnel: 0,
    highRiskCount: 0,
    needsAssessmentCount: 0,
    avgCompliance: 0
  })

  // Station detail data (when drilled down)
  const [selectedStation, setSelectedStation] = useState<StationWithStats | null>(null)
  const [firefighters, setFirefighters] = useState<FirefighterWithDetails[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'high-risk' | 'needs-assessment'>('all')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [stationParam])

  const loadData = async () => {
    try {
      setLoading(true)

      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (!userData || (userData.role !== 'chief' && userData.role !== 'admin')) {
        router.push('/firefighter')
        return
      }

      setUser(userData)

      // Get all stations (for now just the user's station, but ready for multi-station)
      const { data: stationsData } = await supabase
        .from('stations')
        .select('*')
        .eq('id', userData.station_id)

      if (!stationsData) return

      // Get all firefighters across stations
      const { data: allFirefighters } = await supabase
        .from('users')
        .select('*')
        .in('station_id', stationsData.map(s => s.id))
        .in('role', ['firefighter', 'chief'])
        .neq('id', authUser.id)

      if (!allFirefighters) return

      // Get latest FMS scores
      const { data: fmsScores } = await supabase
        .from('fms_scores')
        .select('*')
        .in('user_id', allFirefighters.map(f => f.id))
        .order('assessed_date', { ascending: false })

      // Get active series
      const today = new Date().toISOString().split('T')[0]
      const { data: activeSeries } = await supabase
        .from('series_assignments')
        .select('*, series(*)')
        .in('user_id', allFirefighters.map(f => f.id))
        .eq('completed', false)
        .gte('end_date', today)

      // Get completion rates for compliance
      const { data: allAssignments } = await supabase
        .from('series_assignments')
        .select('completion_percentage')
        .in('user_id', allFirefighters.map(f => f.id))

      // Build maps
      const fmsMap = new Map<string, FMSScoreData>()
      fmsScores?.forEach(score => {
        if (!fmsMap.has(score.user_id)) {
          fmsMap.set(score.user_id, score)
        }
      })

      const seriesMap = new Map<string, typeof activeSeries[0]>()
      activeSeries?.forEach(assignment => {
        seriesMap.set(assignment.user_id, assignment)
      })

      // Calculate 90 days ago for "needs assessment"
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

      // Build station stats
      const stationsWithStats: StationWithStats[] = stationsData.map(station => {
        const stationFirefighters = allFirefighters.filter(f => f.station_id === station.id)

        let highRisk = 0
        let needsAssessment = 0
        let totalFms = 0
        let fmsCount = 0

        stationFirefighters.forEach(ff => {
          const fms = fmsMap.get(ff.id)
          if (fms) {
            if (getRiskLevel(fms.total_score) === 'high') highRisk++
            totalFms += fms.total_score
            fmsCount++
            if (new Date(fms.assessed_date) < ninetyDaysAgo) needsAssessment++
          } else {
            needsAssessment++ // Never assessed
          }
        })

        return {
          ...station,
          personnelCount: stationFirefighters.length,
          highRiskCount: highRisk,
          avgFmsScore: fmsCount > 0 ? Math.round((totalFms / fmsCount) * 10) / 10 : 0,
          needsAssessmentCount: needsAssessment
        }
      })

      setStations(stationsWithStats)

      // Calculate department totals
      const totalPersonnel = stationsWithStats.reduce((sum, s) => sum + s.personnelCount, 0)
      const totalHighRisk = stationsWithStats.reduce((sum, s) => sum + s.highRiskCount, 0)
      const totalNeedsAssessment = stationsWithStats.reduce((sum, s) => sum + s.needsAssessmentCount, 0)
      const avgCompliance = allAssignments && allAssignments.length > 0
        ? Math.round(allAssignments.reduce((sum, a) => sum + (a.completion_percentage || 0), 0) / allAssignments.length)
        : 0

      setDepartmentStats({
        totalPersonnel,
        highRiskCount: totalHighRisk,
        needsAssessmentCount: totalNeedsAssessment,
        avgCompliance
      })

      // If station is selected, load firefighter details
      if (stationParam) {
        const station = stationsWithStats.find(s => s.id === stationParam)
        if (station) {
          setSelectedStation(station)

          const stationFirefighters = allFirefighters
            .filter(f => f.station_id === stationParam)
            .map(ff => ({
              ...ff,
              lastFMS: fmsMap.get(ff.id),
              lastAssessedDate: fmsMap.get(ff.id)?.assessed_date,
              activeSeries: seriesMap.get(ff.id)
            }))

          setFirefighters(stationFirefighters)
        }
      } else {
        setSelectedStation(null)
        setFirefighters([])
      }

    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStationClick = (stationId: string) => {
    router.push(`/chief/analytics?station=${stationId}`)
  }

  const handleBackClick = () => {
    router.push('/chief/analytics')
  }

  // Filter firefighters
  const filteredFirefighters = firefighters.filter(ff => {
    // Search filter
    const matchesSearch = !searchTerm ||
      ff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ff.badge_number?.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    // Status filter
    if (filter === 'high-risk') {
      return ff.lastFMS && getRiskLevel(ff.lastFMS.total_score) === 'high'
    }
    if (filter === 'needs-assessment') {
      if (!ff.lastFMS) return true
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
      return new Date(ff.lastFMS.assessed_date) < ninetyDaysAgo
    }
    return true
  })

  // Sort: high risk first, then by name
  const sortedFirefighters = [...filteredFirefighters].sort((a, b) => {
    const aRisk = a.lastFMS ? getRiskLevel(a.lastFMS.total_score) : 'high'
    const bRisk = b.lastFMS ? getRiskLevel(b.lastFMS.total_score) : 'high'
    const riskOrder = { high: 0, moderate: 1, low: 2 }
    if (riskOrder[aRisk] !== riskOrder[bRisk]) {
      return riskOrder[aRisk] - riskOrder[bRisk]
    }
    return a.name.localeCompare(b.name)
  })

  const getRiskIndicator = (fms?: FMSScoreData) => {
    if (!fms) return { color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'No FMS' }
    const risk = getRiskLevel(fms.total_score)
    if (risk === 'high') return { color: 'text-red-400', bg: 'bg-red-500/20', label: '●' }
    if (risk === 'moderate') return { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: '●' }
    return { color: 'text-green-400', bg: 'bg-green-500/20', label: '●' }
  }

  const getDaysSinceAssessment = (date?: string) => {
    if (!date) return null
    return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-16 w-16 text-fire-gold animate-pulse mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Analytics...</h2>
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center gap-4">
            {selectedStation ? (
              <Button variant="ghost" size="sm" onClick={handleBackClick} className="text-gray-400 hover:text-white">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            ) : (
              <Link href="/chief">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Dashboard
                </Button>
              </Link>
            )}
            <div>
              <h1 className="text-base sm:text-xl font-bold text-white">
                {selectedStation ? selectedStation.name : 'Analytics'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-400">
                {selectedStation
                  ? `${selectedStation.personnelCount} Personnel`
                  : 'Spokane Valley Fire Department'
                }
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Level 1: Department Overview */}
        {!selectedStation && (
          <>
            {/* Department Header */}
            <Card className="bg-gradient-to-r from-fire-gold/20 to-fire-red/20 border-fire-gold/30 mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-fire-gold/20 rounded-xl">
                      <Shield className="h-8 w-8 text-fire-gold" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white">Spokane Valley Fire Department</h2>
                      <p className="text-gray-400">SVFD • {departmentStats.totalPersonnel} Personnel across {stations.length} station{stations.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-black/20 rounded-lg p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-red-400">{departmentStats.highRiskCount}</p>
                    <p className="text-xs sm:text-sm text-gray-400">High Risk</p>
                  </div>
                  <div className="bg-black/20 rounded-lg p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-orange-400">{departmentStats.needsAssessmentCount}</p>
                    <p className="text-xs sm:text-sm text-gray-400">Need Assessment</p>
                  </div>
                  <div className="bg-black/20 rounded-lg p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-green-400">{departmentStats.avgCompliance}%</p>
                    <p className="text-xs sm:text-sm text-gray-400">Compliance</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Station Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stations.map((station, idx) => (
                <AnimatedCard
                  key={station.id}
                  className="bg-white/5 border-white/10 hover:border-white/20 cursor-pointer transition-all"
                  delay={idx * 0.05}
                  onClick={() => handleStationClick(station.id)}
                >
                  <AnimatedCardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-fire-red/20 rounded-lg">
                          <Flame className="h-5 w-5 text-fire-red" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{station.name}</h3>
                          <p className="text-sm text-gray-400">{station.personnelCount} personnel</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className={`rounded-lg p-3 ${station.highRiskCount > 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                        <p className={`text-xl font-bold ${station.highRiskCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {station.highRiskCount}
                        </p>
                        <p className="text-xs text-gray-400">High Risk</p>
                      </div>
                      <div className="bg-blue-500/10 rounded-lg p-3">
                        <p className="text-xl font-bold text-blue-400">{station.avgFmsScore}</p>
                        <p className="text-xs text-gray-400">Avg FMS</p>
                      </div>
                    </div>
                  </AnimatedCardContent>
                </AnimatedCard>
              ))}
            </div>
          </>
        )}

        {/* Level 2: Station Detail */}
        {selectedStation && (
          <>
            {/* Search and Filters */}
            <Card className="bg-white/5 border-white/10 mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search by name or badge..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setFilter('all')}
                      className={filter === 'all' ? 'bg-fire-gold text-black' : 'bg-white/5 text-white border border-white/20'}
                    >
                      All ({firefighters.length})
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setFilter('high-risk')}
                      className={filter === 'high-risk' ? 'bg-red-600 text-white' : 'bg-white/5 text-white border border-white/20'}
                    >
                      High Risk ({firefighters.filter(f => f.lastFMS && getRiskLevel(f.lastFMS.total_score) === 'high').length})
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setFilter('needs-assessment')}
                      className={filter === 'needs-assessment' ? 'bg-orange-600 text-white' : 'bg-white/5 text-white border border-white/20'}
                    >
                      Needs Assessment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Firefighter List */}
            <div className="space-y-3">
              {sortedFirefighters.map((ff) => {
                const risk = getRiskIndicator(ff.lastFMS)
                const daysSince = getDaysSinceAssessment(ff.lastAssessedDate)
                const needsAssessment = !ff.lastFMS || (daysSince !== null && daysSince > 90)

                return (
                  <Card key={ff.id} className="bg-white/5 border-white/10 hover:bg-white/[0.07] transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Risk Indicator */}
                          <div className={`w-3 h-3 rounded-full ${risk.bg} flex items-center justify-center`}>
                            <span className={`text-lg ${risk.color}`}>{risk.label}</span>
                          </div>

                          {/* Name and Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-white truncate">{ff.name}</p>
                              {ff.role === 'chief' && (
                                <Badge className="text-xs bg-fire-gold/20 text-fire-gold border-fire-gold/30">Chief</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-400 flex-wrap">
                              <span>Badge #{ff.badge_number}</span>
                              <span className={ff.lastFMS ? getRiskTextColor(ff.lastFMS.total_score) : 'text-gray-500'}>
                                FMS: {ff.lastFMS ? `${ff.lastFMS.total_score}/21` : 'N/A'}
                              </span>
                              {daysSince !== null ? (
                                <span className={`flex items-center gap-1 ${needsAssessment ? 'text-orange-400' : ''}`}>
                                  <Clock className="h-3 w-3" />
                                  {daysSince}d ago
                                </span>
                              ) : (
                                <span className="text-orange-400">Never assessed</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Program Status & Action */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {ff.activeSeries ? (
                            <div className="text-right hidden sm:block">
                              <p className="text-xs text-green-400">Active Program</p>
                              <p className="text-xs text-gray-400">
                                Week {ff.activeSeries.current_week} • {ff.activeSeries.completion_percentage}%
                              </p>
                            </div>
                          ) : (
                            <Link href={`/chief/series/assign?user=${ff.id}`}>
                              <Button size="sm" className="bg-fire-red hover:bg-red-700 text-white">
                                Assign
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {sortedFirefighters.length === 0 && (
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">
                      {searchTerm || filter !== 'all' ? 'No personnel match your filters' : 'No personnel in this station'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="text-center">
        <Activity className="h-16 w-16 text-fire-gold animate-pulse mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Loading Analytics...</h2>
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsLoading />}>
      <AnalyticsContent />
    </Suspense>
  )
}
