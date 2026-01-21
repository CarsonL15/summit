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
  Target, Zap, Star, AlertTriangle, User
} from 'lucide-react'
import { Database } from '@/types/database'
import { getRiskLevel, getRiskTextColor } from '@/lib/utils/fms'

type UserData = Database['public']['Tables']['users']['Row']
type StationData = Database['public']['Tables']['stations']['Row']
type FMSScoreData = Database['public']['Tables']['fms_scores']['Row']
type SeriesAssignmentData = Database['public']['Tables']['series_assignments']['Row']

interface FirefighterWithStats extends UserData {
  last_fms_score?: number
  active_series?: boolean
}

interface StationStats {
  total_firefighters: number
  high_risk_count: number
  avg_fms_score: number
  avg_completion_rate: number
}

export default function ChiefDashboard() {
  const [user, setUser] = useState<UserData | null>(null)
  const [station, setStation] = useState<StationData | null>(null)
  const [stats, setStats] = useState<StationStats>({
    total_firefighters: 0,
    high_risk_count: 0,
    avg_fms_score: 0,
    avg_completion_rate: 0
  })
  const [leaderboard, setLeaderboard] = useState<FirefighterWithStats[]>([])
  const [recentAssessments, setRecentAssessments] = useState<FMSScoreData[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadDashboardData()
  }, [])

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
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userError || !userData) {
        console.error('Error fetching user:', userError)
        router.push('/auth/login')
        return
      }

      // Check role - redirect if not a chief
      if (userData.role !== 'chief' && userData.role !== 'admin') {
        router.push('/firefighter')
        return
      }

      setUser(userData)

      // Get station info
      if (userData.station_id) {
        const { data: stationData } = await supabase
          .from('stations')
          .select('*')
          .eq('id', userData.station_id)
          .single()

        if (stationData) {
          setStation(stationData)
        }

        // Get all firefighters in station
        const { data: firefighters } = await supabase
          .from('users')
          .select('*')
          .eq('station_id', userData.station_id)
          .eq('role', 'firefighter')
          .order('points', { ascending: false })

        if (firefighters) {
          const today = new Date().toISOString().split('T')[0]

          // Get average completion rate
          const { data: assignments } = await supabase
            .from('series_assignments')
            .select('completion_percentage')
            .in('user_id', firefighters.map(f => f.id))
            .eq('completed', false)

          const avgCompletion = assignments && assignments.length > 0
            ? assignments.reduce((sum, a) => sum + (a.completion_percentage || 0), 0) / assignments.length
            : 0

          // Get latest FMS scores for high-risk count and avg FMS
          const { data: latestFMS } = await supabase
            .from('fms_scores')
            .select('user_id, total_score')
            .in('user_id', firefighters.map(f => f.id))
            .order('assessed_date', { ascending: false })

          // Get unique users and their latest scores
          const latestScoreMap = new Map<string, number>()
          latestFMS?.forEach(score => {
            if (!latestScoreMap.has(score.user_id)) {
              latestScoreMap.set(score.user_id, score.total_score)
            }
          })

          const allScores = Array.from(latestScoreMap.values())
          const highRiskCount = allScores.filter(score => getRiskLevel(score) === 'high').length
          const avgFmsScore = allScores.length > 0
            ? Math.round((allScores.reduce((sum, s) => sum + s, 0) / allScores.length) * 10) / 10
            : 0

          setStats({
            total_firefighters: firefighters.length,
            high_risk_count: highRiskCount,
            avg_fms_score: avgFmsScore,
            avg_completion_rate: Math.round(avgCompletion)
          })

          // Get top 10 for leaderboard with additional info
          const top10 = firefighters.slice(0, 10)

          // Get FMS scores and active series for top 10
          const { data: fmsScores } = await supabase
            .from('fms_scores')
            .select('user_id, total_score')
            .in('user_id', top10.map(f => f.id))
            .order('created_at', { ascending: false })

          const { data: activeSeries2 } = await supabase
            .from('series_assignments')
            .select('user_id')
            .in('user_id', top10.map(f => f.id))
            .eq('completed', false)
            .gte('end_date', today)

          const fmsMap = new Map()
          fmsScores?.forEach(score => {
            if (!fmsMap.has(score.user_id)) {
              fmsMap.set(score.user_id, score.total_score)
            }
          })

          const activeSeriesUsers = new Set(activeSeries2?.map(a => a.user_id))

          const leaderboardWithStats = top10.map(f => ({
            ...f,
            last_fms_score: fmsMap.get(f.id),
            active_series: activeSeriesUsers.has(f.id)
          }))

          setLeaderboard(leaderboardWithStats)
        }

        // Get recent FMS assessments
        const { data: recentFMS } = await supabase
          .from('fms_scores')
          .select('*')
          .eq('assessed_by', authUser.id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (recentFMS) {
          setRecentAssessments(recentFMS)
        }
      }

    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
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

  if (!user || !station) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">Access denied or station not found</div>
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
                <h1 className="text-base sm:text-xl font-bold text-white">Command Center</h1>
                <p className="text-xs sm:text-sm text-gray-400">{station.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-400">Badge #{user.badge_number}</p>
              </div>
              <Link href="/profile">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white p-2"
                >
                  <User className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-400 hover:text-white p-2"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
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

        {/* Key Stats - 3 most important metrics */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <AnimatedCard className="bg-red-500/10 border-red-500/30" delay={0}>
            <AnimatedCardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
                <span className="text-2xl sm:text-3xl font-bold text-white">{stats.high_risk_count}</span>
              </div>
              <p className="text-sm sm:text-base text-gray-300">High Risk</p>
              <p className="text-xs text-red-400">FMS &lt;15</p>
            </AnimatedCardContent>
          </AnimatedCard>

          <AnimatedCard className="bg-blue-500/10 border-blue-500/30" delay={0.05}>
            <AnimatedCardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
                <span className="text-2xl sm:text-3xl font-bold text-white">{stats.avg_fms_score}</span>
              </div>
              <p className="text-sm sm:text-base text-gray-300">Avg FMS</p>
              <p className="text-xs text-blue-400">out of 21</p>
            </AnimatedCardContent>
          </AnimatedCard>

          <AnimatedCard className="bg-green-500/10 border-green-500/30" delay={0.1}>
            <AnimatedCardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <Target className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
                <span className="text-2xl sm:text-3xl font-bold text-white">{stats.avg_completion_rate}%</span>
              </div>
              <p className="text-sm sm:text-base text-gray-300">Compliance</p>
              <p className="text-xs text-green-400">Program completion</p>
            </AnimatedCardContent>
          </AnimatedCard>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Station Leaderboard */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-fire-gold" />
                Station Leaderboard
              </CardTitle>
              <CardDescription className="text-gray-400">
                Top performers in {station.name}
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
                          <p className="text-sm font-medium text-white">{firefighter.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-gray-400">Badge #{firefighter.badge_number}</p>
                            {firefighter.last_fms_score && (
                              <Badge variant="outline" className="text-xs border-white/20">
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
                <Link href="/chief/leaderboard">
                  <Button variant="ghost" className="w-full mt-4 text-white/80 hover:text-white hover:bg-white/10">
                    View Full Leaderboard
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
                Latest movement screenings
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
                          <p className="text-sm font-medium text-white">
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
                  <p className="text-xs text-gray-500">Contact your PT to schedule assessments</p>
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
                Keep Your Team Ready
              </h3>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Regular FMS assessments and targeted training programs help prevent injuries
                and maintain peak performance for your firefighters.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/chief/series">
                  <Button size="lg" className="bg-fire-gold text-black hover:bg-yellow-500">
                    Manage Training Programs
                  </Button>
                </Link>
                <Link href="/chief/analytics">
                  <Button size="lg" className="bg-white/10 text-white border border-white/20 hover:bg-white/20">
                    View Analytics
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