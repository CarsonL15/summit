'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { AnimatedCard, AnimatedCardContent } from '@/components/ui/animated-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  complianceRate: number
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
    avgFmsScore: 0,
    avgCompliance: 0
  })

  // Station detail data (when drilled down)
  const [selectedStation, setSelectedStation] = useState<StationWithStats | null>(null)
  const [firefighters, setFirefighters] = useState<FirefighterWithDetails[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'high' | 'moderate' | 'low' | 'needs-assessment'>('all')

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

      // Get ALL stations for department-wide view
      const { data: stationsData } = await supabase
        .from('stations')
        .select('*')
        .order('name')

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
        .select('user_id, completion_percentage')
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
        const stationUserIds = stationFirefighters.map(f => f.id)

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

        // Calculate station compliance
        const stationAssignments = allAssignments?.filter(a =>
          stationUserIds.includes((a as any).user_id)
        ) || []
        const stationCompliance = stationAssignments.length > 0
          ? Math.round(stationAssignments.reduce((sum, a) => sum + (a.completion_percentage || 0), 0) / stationAssignments.length)
          : 0

        return {
          ...station,
          personnelCount: stationFirefighters.length,
          highRiskCount: highRisk,
          avgFmsScore: fmsCount > 0 ? Math.round((totalFms / fmsCount) * 10) / 10 : 0,
          needsAssessmentCount: needsAssessment,
          complianceRate: stationCompliance
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

      // Calculate department avg FMS
      const allFmsScores = Array.from(fmsMap.values())
      const avgFmsScore = allFmsScores.length > 0
        ? Math.round((allFmsScores.reduce((sum, fms) => sum + fms.total_score, 0) / allFmsScores.length) * 10) / 10
        : 0

      setDepartmentStats({
        totalPersonnel,
        highRiskCount: totalHighRisk,
        needsAssessmentCount: totalNeedsAssessment,
        avgFmsScore,
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
    const matchesSearch = true // Search disabled for privacy

    if (!matchesSearch) return false

    // Status filter
    if (filter === 'high') {
      return ff.lastFMS && getRiskLevel(ff.lastFMS.total_score) === 'high'
    }
    if (filter === 'moderate') {
      return ff.lastFMS && getRiskLevel(ff.lastFMS.total_score) === 'moderate'
    }
    if (filter === 'low') {
      return ff.lastFMS && getRiskLevel(ff.lastFMS.total_score) === 'low'
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
    return (a.last_activity_date || '').localeCompare(b.last_activity_date || '')
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
              <Button variant="ghost" size="sm" onClick={handleBackClick} className="text-gray-400 hover:text-white hover:bg-black/30">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            ) : (
              <Link href="/chief">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-black/30">
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
                <div className="grid grid-cols-4 gap-4 mt-6">
                  <div className="bg-black/20 rounded-lg p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-red-400">{departmentStats.highRiskCount}</p>
                    <p className="text-xs sm:text-sm text-gray-400">High Risk</p>
                  </div>
                  <div className="bg-black/20 rounded-lg p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-orange-400">{departmentStats.needsAssessmentCount}</p>
                    <p className="text-xs sm:text-sm text-gray-400">Need Assessment</p>
                  </div>
                  <div className="bg-black/20 rounded-lg p-4 text-center">
                    <p className={`text-2xl sm:text-3xl font-bold ${getRiskTextColor(departmentStats.avgFmsScore)}`}>{departmentStats.avgFmsScore}</p>
                    <p className="text-xs sm:text-sm text-gray-400">Avg FMS</p>
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
              {[...stations].sort((a, b) => {
                // Extract numbers from station names for proper numeric sorting
                const numA = parseInt(a.name.match(/\d+/)?.[0] || '0')
                const numB = parseInt(b.name.match(/\d+/)?.[0] || '0')
                return numA - numB
              }).map((station, idx) => (
                <AnimatedCard
                  key={station.id}
                  className="bg-white/5 border-white/10 hover:border-white/20 cursor-pointer transition-all"
                  delay={idx * 0.05}
                  onClick={() => handleStationClick(station.id)}
                >
                  <AnimatedCardContent className="p-6">
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-fire-red/20 rounded-lg">
                          <Flame className="h-6 w-6 text-fire-red" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{station.name}</h3>
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
                      <div className="bg-orange-500/10 rounded-lg p-3">
                        <p className="text-xl font-bold text-orange-400">{station.needsAssessmentCount}</p>
                        <p className="text-xs text-gray-400">Need Assessment</p>
                      </div>
                      <div className="bg-blue-500/10 rounded-lg p-3">
                        <p className={`text-xl font-bold ${getRiskTextColor(station.avgFmsScore)}`}>{station.avgFmsScore}</p>
                        <p className="text-xs text-gray-400">Avg FMS</p>
                      </div>
                      <div className="bg-green-500/10 rounded-lg p-3">
                        <p className="text-xl font-bold text-green-400">{station.complianceRate}%</p>
                        <p className="text-xs text-gray-400">Compliance</p>
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
            {/* Per-Station Stats Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <AnimatedCard className="bg-white/5 border-white/10" delay={0}>
                <AnimatedCardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Users className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{firefighters.length}</p>
                      <p className="text-xs text-gray-400">Active Personnel</p>
                    </div>
                  </div>
                </AnimatedCardContent>
              </AnimatedCard>

              <AnimatedCard className="bg-white/5 border-white/10" delay={0.05}>
                <AnimatedCardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-fire-gold/20 rounded-lg">
                      <Target className="h-5 w-5 text-fire-gold" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {firefighters.length > 0
                          ? Math.round(firefighters.reduce((sum, f) => sum + (f.points || 0), 0) / firefighters.length)
                          : 0}
                      </p>
                      <p className="text-xs text-gray-400">Avg Points</p>
                    </div>
                  </div>
                </AnimatedCardContent>
              </AnimatedCard>

              <AnimatedCard className="bg-white/5 border-white/10" delay={0.1}>
                <AnimatedCardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <Flame className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {firefighters.length > 0
                          ? Math.round(firefighters.reduce((sum, f) => sum + (f.current_streak || 0), 0) / firefighters.length)
                          : 0}
                      </p>
                      <p className="text-xs text-gray-400">Avg Streak (days)</p>
                    </div>
                  </div>
                </AnimatedCardContent>
              </AnimatedCard>

              <AnimatedCard className="bg-white/5 border-white/10" delay={0.15}>
                <AnimatedCardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Activity className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${selectedStation.avgFmsScore >= 18 ? 'text-green-400' : selectedStation.avgFmsScore >= 15 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {selectedStation.avgFmsScore}/21
                      </p>
                      <p className="text-xs text-gray-400">Avg FMS Score</p>
                    </div>
                  </div>
                </AnimatedCardContent>
              </AnimatedCard>
            </div>

            {/* Distribution Charts */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Streak Distribution */}
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold text-white mb-3">Streak Distribution</h4>
                  <div className="space-y-2">
                    {[
                      { label: '0 days', min: 0, max: 0, color: 'bg-gray-500' },
                      { label: '1-7 days', min: 1, max: 7, color: 'bg-yellow-500' },
                      { label: '8-14 days', min: 8, max: 14, color: 'bg-orange-500' },
                      { label: '15-30 days', min: 15, max: 30, color: 'bg-green-500' },
                      { label: '30+ days', min: 31, max: Infinity, color: 'bg-blue-500' }
                    ].map(bucket => {
                      const count = firefighters.filter(f => {
                        const streak = f.current_streak || 0
                        return streak >= bucket.min && streak <= bucket.max
                      }).length
                      const percentage = firefighters.length > 0 ? (count / firefighters.length) * 100 : 0
                      return (
                        <div key={bucket.label} className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-20">{bucket.label}</span>
                          <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-full ${bucket.color} transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-white w-8 text-right">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* FMS Score Distribution */}
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold text-white mb-3">FMS Score Distribution</h4>
                  <div className="space-y-2">
                    {[
                      { label: '0-10 (Critical)', min: 0, max: 10, color: 'bg-red-600' },
                      { label: '11-14 (High Risk)', min: 11, max: 14, color: 'bg-red-400' },
                      { label: '15-17 (Moderate)', min: 15, max: 17, color: 'bg-yellow-500' },
                      { label: '18-21 (Low Risk)', min: 18, max: 21, color: 'bg-green-500' }
                    ].map(bucket => {
                      const count = firefighters.filter(f => {
                        if (!f.lastFMS) return bucket.label.includes('Critical')
                        const score = f.lastFMS.total_score
                        return score >= bucket.min && score <= bucket.max
                      }).length
                      const percentage = firefighters.length > 0 ? (count / firefighters.length) * 100 : 0
                      return (
                        <div key={bucket.label} className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-28">{bucket.label}</span>
                          <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-full ${bucket.color} transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-white w-8 text-right">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* High Risk Warning Banner */}
            {selectedStation.highRiskCount > 0 && (
              <Card className="bg-red-500/10 border-red-500/30 mb-6">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-400">
                      {selectedStation.highRiskCount} personnel at high injury risk
                    </p>
                    <p className="text-xs text-gray-400">
                      Consider prioritizing FMS-based corrective exercises for these individuals
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filters */}
            <Card className="bg-white/5 border-white/10 mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => setFilter('all')}
                      className={filter === 'all' ? 'bg-fire-gold text-black' : 'bg-white/5 text-white border border-white/20'}
                    >
                      All ({firefighters.length})
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setFilter('high')}
                      className={filter === 'high' ? 'bg-red-600 text-white' : 'bg-white/5 text-white border border-white/20'}
                    >
                      High ({firefighters.filter(f => f.lastFMS && getRiskLevel(f.lastFMS.total_score) === 'high').length})
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setFilter('moderate')}
                      className={filter === 'moderate' ? 'bg-yellow-600 text-white' : 'bg-white/5 text-white border border-white/20'}
                    >
                      Moderate ({firefighters.filter(f => f.lastFMS && getRiskLevel(f.lastFMS.total_score) === 'moderate').length})
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setFilter('low')}
                      className={filter === 'low' ? 'bg-green-600 text-white' : 'bg-white/5 text-white border border-white/20'}
                    >
                      Low ({firefighters.filter(f => f.lastFMS && getRiskLevel(f.lastFMS.total_score) === 'low').length})
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

                // Determine click destination
                const handleCardClick = () => {
                  if (ff.lastFMS) {
                    router.push(`/chief/assessment/review/${ff.lastFMS.id}`)
                  } else {
                    // No FMS - go to assessment page to create one
                    router.push(`/chief/assessment?user=${ff.id}`)
                  }
                }

                return (
                  <Card
                    key={ff.id}
                    className="bg-white/5 border-white/10 hover:bg-black/30 transition-colors cursor-pointer"
                    onClick={handleCardClick}
                  >
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
                              <p className="font-semibold text-white truncate">
                                {ff.role === 'chief' ? 'Chief' : 'Firefighter'}
                              </p>
                              {ff.lastFMS && (
                                <Badge className={`text-xs ${
                                  getRiskLevel(ff.lastFMS.total_score) === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                  getRiskLevel(ff.lastFMS.total_score) === 'moderate' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                  'bg-green-500/20 text-green-400 border-green-500/30'
                                }`}>
                                  {getRiskLevel(ff.lastFMS.total_score) === 'high' ? 'High Risk' :
                                   getRiskLevel(ff.lastFMS.total_score) === 'moderate' ? 'Moderate' : 'Low Risk'}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-400 flex-wrap">
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

                        {/* Program Status & Arrow */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {ff.activeSeries ? (
                            <div className="text-right hidden sm:block">
                              <p className="text-xs text-green-400">Active Program</p>
                              <p className="text-xs text-gray-400">
                                Week {ff.activeSeries.current_week} • {ff.activeSeries.completion_percentage}%
                              </p>
                            </div>
                          ) : !ff.lastFMS ? (
                            <span className="text-xs text-orange-400 hidden sm:block">Needs Assessment</span>
                          ) : (
                            <span className="text-xs text-gray-400 hidden sm:block">No Program</span>
                          )}
                          <ChevronRight className="h-5 w-5 text-gray-500" />
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
