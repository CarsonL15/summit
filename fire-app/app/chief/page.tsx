'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AnimatedCard, AnimatedCardContent, AnimatedCardHeader, AnimatedCardTitle } from '@/components/ui/animated-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ProgressBar } from '@/components/ui/progress-bar'
import {
  Flame, Users, Trophy, Activity, TrendingUp, Award,
  FileText, Plus, LogOut, Shield, ChevronRight, Clock,
  Target, Zap, Star, AlertTriangle, User, Building2, ChevronDown
} from 'lucide-react'
import { Database } from '@/types/database'
import { getRiskLevel, getRiskTextColor, getRiskLabel } from '@/lib/utils/fms'

type UserData = Database['public']['Tables']['users']['Row']
type StationData = Database['public']['Tables']['stations']['Row']
type FMSScoreData = Database['public']['Tables']['fms_scores']['Row']
type SeriesAssignmentData = Database['public']['Tables']['series_assignments']['Row']

interface FirefighterWithStats extends UserData {
  last_fms_score?: number
  active_series?: boolean
  station_name?: string
}

interface StationStats {
  total_firefighters: number
  high_risk_count: number
  avg_fms_score: number
  avg_completion_rate: number
  total_stations: number
}

export default function ChiefDashboard() {
  const [user, setUser] = useState<UserData | null>(null)
  const [stations, setStations] = useState<StationData[]>([])
  const [selectedStation, setSelectedStation] = useState<string>('all')
  const [showStationDropdown, setShowStationDropdown] = useState(false)
  const [stats, setStats] = useState<StationStats>({
    total_firefighters: 0,
    high_risk_count: 0,
    avg_fms_score: 0,
    avg_completion_rate: 0,
    total_stations: 0
  })
  const [leaderboard, setLeaderboard] = useState<FirefighterWithStats[]>([])
  const [recentAssessments, setRecentAssessments] = useState<FMSScoreData[]>([])
  const [allFirefighters, setAllFirefighters] = useState<FirefighterWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    if (allFirefighters.length > 0) {
      filterDataByStation()
    }
  }, [selectedStation, allFirefighters])

  const loadDashboardData = async () => {
    try {
      // Get current auth user
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      // Get user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, role, station_id, points, current_streak, longest_streak, last_activity_date, badge_number, email, created_at, updated_at')
        .eq('id', authUser.id)
        .single()

      if (userError || !userData) {
        router.push('/auth/login')
        return
      }

      // Check role - redirect if not a chief or admin
      if (userData.role !== 'chief' && userData.role !== 'admin') {
        router.push('/firefighter')
        return
      }

      setUser(userData)

      // Get ALL stations (department-wide view)
      const { data: stationsData } = await supabase
        .from('stations')
        .select('id, name, department, location, city, state, created_at, updated_at')
        .order('name')

      if (stationsData) {
        setStations(stationsData)
      }

      // Get ALL firefighters across all stations
      const { data: firefighters } = await supabase
        .from('users')
        .select('id, name, role, station_id, points, current_streak, longest_streak, last_activity_date, badge_number, email, created_at, updated_at')
        .eq('role', 'firefighter')
        .order('points', { ascending: false })
        .limit(500)

      if (firefighters && stationsData) {
        const today = new Date().toISOString().split('T')[0]

        // Get latest FMS scores for all firefighters
        const { data: latestFMS } = await supabase
          .from('fms_scores')
          .select('user_id, total_score')
          .in('user_id', firefighters.map(f => f.id))
          .order('assessed_date', { ascending: false })

        // Get active series for all firefighters
        const { data: activeSeries } = await supabase
          .from('series_assignments')
          .select('user_id')
          .in('user_id', firefighters.map(f => f.id))
          .eq('completed', false)
          .gte('end_date', today)

        // Build maps
        const fmsMap = new Map<string, number>()
        latestFMS?.forEach(score => {
          if (!fmsMap.has(score.user_id)) {
            fmsMap.set(score.user_id, score.total_score)
          }
        })

        const activeSeriesUsers = new Set(activeSeries?.map(a => a.user_id))
        const stationMap = new Map(stationsData.map(s => [s.id, s.name]))

        // Enrich firefighters with stats
        const enrichedFirefighters = firefighters.map(f => ({
          ...f,
          last_fms_score: fmsMap.get(f.id),
          active_series: activeSeriesUsers.has(f.id),
          station_name: f.station_id ? stationMap.get(f.station_id) : undefined
        }))

        setAllFirefighters(enrichedFirefighters)
      }

      // Get recent FMS assessments (all assessments for department chief)
      const { data: recentFMS } = await supabase
        .from('fms_scores')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentFMS) {
        setRecentAssessments(recentFMS)
      }

    } catch (error) {
      // Error loading dashboard
    } finally {
      setLoading(false)
    }
  }

  const filterDataByStation = async () => {
    let filtered = allFirefighters

    if (selectedStation !== 'all') {
      filtered = allFirefighters.filter(f => f.station_id === selectedStation)
    }

    // Calculate stats for filtered data
    const allScores = filtered
      .filter(f => f.last_fms_score !== undefined)
      .map(f => f.last_fms_score!)

    const highRiskCount = allScores.filter(score => getRiskLevel(score) === 'high').length
    const avgFmsScore = allScores.length > 0
      ? Math.round((allScores.reduce((sum, s) => sum + s, 0) / allScores.length) * 10) / 10
      : 0

    // Get completion rates for filtered users
    const { data: assignments } = await supabase
      .from('series_assignments')
      .select('completion_percentage')
      .in('user_id', filtered.map(f => f.id))
      .eq('completed', false)

    const avgCompletion = assignments && assignments.length > 0
      ? assignments.reduce((sum, a) => sum + (a.completion_percentage || 0), 0) / assignments.length
      : 0

    setStats({
      total_firefighters: filtered.length,
      high_risk_count: highRiskCount,
      avg_fms_score: avgFmsScore,
      avg_completion_rate: Math.round(avgCompletion),
      total_stations: stations.length
    })

    // Set leaderboard (top 10)
    setLeaderboard(filtered.slice(0, 10))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const getSelectedStationName = () => {
    if (selectedStation === 'all') return 'All Stations'
    const station = stations.find(s => s.id === selectedStation)
    return station?.name || 'Select Station'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-fire-gold animate-pulse mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Command Center...</h2>
          <div className="space-y-2">
            <Skeleton className="h-4 w-48 mx-auto" />
            <Skeleton className="h-4 w-36 mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">Access denied</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-fire-gold" />
              <div>
                <h1 className="text-base sm:text-xl font-bold text-white">Department Command Center</h1>
                <p className="text-xs sm:text-sm text-gray-400">Spokane Valley Fire Department</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-400">Department Chief</p>
              </div>
              <Link href="/profile">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-black/30 p-2"
                >
                  <User className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-400 hover:text-white hover:bg-black/30 p-2"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Station Selector */}
        <div className="mb-6">
          <div className="relative inline-block">
            <button
              onClick={() => setShowStationDropdown(!showStationDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-black/40 transition-colors"
            >
              <Building2 className="h-4 w-4 text-fire-gold" />
              <span>{getSelectedStationName()}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showStationDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showStationDropdown && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-slate-800 border border-white/20 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedStation('all')
                    setShowStationDropdown(false)
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-black/30 transition-colors ${
                    selectedStation === 'all' ? 'text-fire-gold bg-white/5' : 'text-white'
                  }`}
                >
                  All Stations ({stats.total_stations})
                </button>
                <div className="border-t border-white/10" />
                {stations.map(station => (
                  <button
                    key={station.id}
                    onClick={() => {
                      setSelectedStation(station.id)
                      setShowStationDropdown(false)
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-black/30 transition-colors ${
                      selectedStation === station.id ? 'text-fire-gold bg-white/5' : 'text-white'
                    }`}
                  >
                    {station.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link href="/chief/analytics">
            <Button className="w-full h-auto py-4 sm:py-5 bg-gradient-to-r from-fire-red to-fire-gold hover:from-red-700 hover:to-yellow-600 text-white flex flex-col sm:flex-row items-center justify-center sm:justify-start">
              <TrendingUp className="mb-1 sm:mb-0 sm:mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              <div className="text-center sm:text-left">
                <p className="font-semibold text-sm sm:text-base">Analytics</p>
                <p className="text-xs opacity-90 hidden sm:block">Team, Reports & Performance</p>
              </div>
            </Button>
          </Link>
          <Link href="/chief/injuries">
            <Button className="w-full h-auto py-4 sm:py-5 bg-orange-600 hover:bg-orange-700 text-white flex flex-col sm:flex-row items-center justify-center sm:justify-start">
              <AlertTriangle className="mb-1 sm:mb-0 sm:mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              <div className="text-center sm:text-left">
                <p className="font-semibold text-sm sm:text-base">Injuries</p>
                <p className="text-xs opacity-90 hidden sm:block">Track & prevent</p>
              </div>
            </Button>
          </Link>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-4 gap-3 sm:gap-4 mb-8">
          <AnimatedCard className="bg-purple-500/10 border-purple-500/30" delay={0}>
            <AnimatedCardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-4 w-4 sm:h-6 sm:w-6 text-purple-400" />
                <span className="text-xl sm:text-3xl font-bold text-white">{stats.total_firefighters}</span>
              </div>
              <p className="text-xs sm:text-base text-gray-300">Personnel</p>
            </AnimatedCardContent>
          </AnimatedCard>

          <AnimatedCard className="bg-red-500/10 border-red-500/30" delay={0.05}>
            <AnimatedCardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6 text-red-400" />
                <span className="text-xl sm:text-3xl font-bold text-white">{stats.high_risk_count}</span>
              </div>
              <p className="text-xs sm:text-base text-gray-300">High Risk</p>
            </AnimatedCardContent>
          </AnimatedCard>

          <AnimatedCard className="bg-blue-500/10 border-blue-500/30" delay={0.1}>
            <AnimatedCardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-4 w-4 sm:h-6 sm:w-6 text-blue-400" />
                <span className={`text-xl sm:text-3xl font-bold ${stats.avg_fms_score > 0 ? getRiskTextColor(stats.avg_fms_score) : 'text-white'}`}>{stats.avg_fms_score}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-base text-gray-300">Avg FMS</p>
                {stats.avg_fms_score > 0 && (
                  <span className={`text-xs ${getRiskTextColor(stats.avg_fms_score)}`}>
                    {getRiskLabel(stats.avg_fms_score)}
                  </span>
                )}
              </div>
            </AnimatedCardContent>
          </AnimatedCard>

          <AnimatedCard className="bg-green-500/10 border-green-500/30" delay={0.15}>
            <AnimatedCardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <Target className="h-4 w-4 sm:h-6 sm:w-6 text-green-400" />
                <span className="text-xl sm:text-3xl font-bold text-white">{stats.avg_completion_rate}%</span>
              </div>
              <p className="text-xs sm:text-base text-gray-300">Compliance</p>
            </AnimatedCardContent>
          </AnimatedCard>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Leaderboard */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-fire-gold" />
                {selectedStation === 'all' ? 'Department' : getSelectedStationName()} Leaderboard
              </CardTitle>
              <CardDescription className="text-gray-400">
                Top performers {selectedStation === 'all' ? 'across all stations' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((firefighter, index) => (
                    <div
                      key={firefighter.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        index === 0 ? 'bg-gradient-to-r from-fire-gold/20 to-fire-red/20 border border-fire-gold/30' :
                        index === 1 ? 'bg-gradient-to-r from-gray-400/10 to-gray-500/10 border border-gray-400/20' :
                        index === 2 ? 'bg-gradient-to-r from-orange-700/10 to-orange-800/10 border border-orange-700/20' :
                        'bg-white/5 border border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`text-lg font-bold ${
                          index === 0 ? 'text-fire-gold' :
                          index === 1 ? 'text-gray-300' :
                          index === 2 ? 'text-orange-500' :
                          'text-gray-400'
                        }`}>
                          #{index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {selectedStation === 'all' && firefighter.station_name && (
                              <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
                                {firefighter.station_name}
                              </Badge>
                            )}
                            {firefighter.last_fms_score && (
                              <Badge variant="outline" className={`text-xs ${getRiskTextColor(firefighter.last_fms_score)} border-current/30`}>
                                FMS: {firefighter.last_fms_score}
                              </Badge>
                            )}
                            {firefighter.active_series && (
                              <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                                Active
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">{firefighter.points}</p>
                        <p className="text-xs text-gray-400">
                          <Flame className="inline h-3 w-3 mr-0.5" />
                          {firefighter.current_streak} day streak
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-8">No firefighters found</p>
              )}

              {leaderboard.length > 0 && (
                <Link href="/chief/analytics">
                  <Button variant="ghost" className="w-full mt-4 text-white/80 hover:text-white hover:bg-black/30">
                    View Full Analytics
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Recent Assessments */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-400" />
                Recent FMS Assessments
              </CardTitle>
              <CardDescription className="text-gray-400">
                Latest movement screenings across department
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentAssessments.length > 0 ? (
                <div className="space-y-3">
                  {recentAssessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-medium ${getRiskTextColor(assessment.total_score)}`}>
                            Score: {assessment.total_score}/21
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {assessment.assessed_date && new Date(assessment.assessed_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className={`text-2xl font-bold ${getRiskTextColor(assessment.total_score)}`}>
                          {getRiskLevel(assessment.total_score) === 'low' ? '✓' :
                           getRiskLevel(assessment.total_score) === 'moderate' ? '⚠' : '✗'}
                        </div>
                      </div>
                      {assessment.notes && (
                        <p className="text-xs text-gray-500 mt-2 italic">{assessment.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 mb-4">No assessments yet</p>
                  <p className="text-xs text-gray-500">Contact clinic to schedule assessments</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom CTA */}
        <Card className="bg-gradient-to-r from-fire-red/20 to-fire-gold/20 border-fire-red/30 mt-8">
          <CardContent className="p-8">
            <div className="text-center">
              <Flame className="h-12 w-12 text-fire-gold mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-3">
                Keep Your Department Ready
              </h3>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Regular FMS assessments and targeted training programs help prevent injuries
                and maintain peak performance across all {stations.length} stations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/chief/analytics">
                  <Button size="lg" className="bg-fire-gold text-black hover:bg-yellow-500">
                    View Department Analytics
                  </Button>
                </Link>
                <Link href="/chief/injuries">
                  <Button size="lg" className="bg-white/10 text-white border border-white/20 hover:bg-black/40">
                    Injury Prevention
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
