'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ProgressBar } from '@/components/ui/progress-bar'
import {
  Shield, TrendingUp, Users, Trophy, Flame, Activity,
  ChevronLeft, Calendar, Target, Award, AlertTriangle,
  BarChart3, PieChart, ArrowUp, ArrowDown, Minus
} from 'lucide-react'
import { Database } from '@/types/database'

type UserData = Database['public']['Tables']['users']['Row']
type StationData = Database['public']['Tables']['stations']['Row']

interface AnalyticsData {
  // Overall Stats
  totalFirefighters: number
  activeFirefighters: number
  averagePoints: number
  averageStreak: number
  totalCompletions: number

  // FMS Stats
  averageFMSScore: number
  fmsImprovement: number
  highRiskCount: number

  // Series Stats
  activeSeriesCount: number
  averageCompletion: number
  completedSeriesCount: number

  // Trends
  weeklyActiveUsers: number[]
  weeklyCompletions: number[]
  streakDistribution: { range: string; count: number }[]
  fmsDistribution: { range: string; count: number }[]
}

export default function Analytics() {
  const [user, setUser] = useState<UserData | null>(null)
  const [station, setStation] = useState<StationData | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalFirefighters: 0,
    activeFirefighters: 0,
    averagePoints: 0,
    averageStreak: 0,
    totalCompletions: 0,
    averageFMSScore: 0,
    fmsImprovement: 0,
    highRiskCount: 0,
    activeSeriesCount: 0,
    averageCompletion: 0,
    completedSeriesCount: 0,
    weeklyActiveUsers: [],
    weeklyCompletions: [],
    streakDistribution: [],
    fmsDistribution: []
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
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

      // Check role
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

        // Get all firefighters
        const { data: firefighters } = await supabase
          .from('users')
          .select('*')
          .eq('station_id', userData.station_id)
          .eq('role', 'firefighter')

        if (firefighters) {
          const today = new Date().toISOString().split('T')[0]
          const activeToday = firefighters.filter(f => f.last_activity_date === today).length
          const avgPoints = firefighters.reduce((sum, f) => sum + f.points, 0) / (firefighters.length || 1)
          const avgStreak = firefighters.reduce((sum, f) => sum + f.current_streak, 0) / (firefighters.length || 1)

          // Get FMS scores
          const { data: fmsScores } = await supabase
            .from('fms_scores')
            .select('*')
            .in('user_id', firefighters.map(f => f.id))
            .order('created_at', { ascending: false })

          let avgFMS = 0
          let highRisk = 0
          if (fmsScores && fmsScores.length > 0) {
            const latestScores = new Map()
            fmsScores.forEach(score => {
              if (!latestScores.has(score.user_id)) {
                latestScores.set(score.user_id, score.total_score)
              }
            })
            const scores = Array.from(latestScores.values())
            avgFMS = scores.reduce((sum, s) => sum + s, 0) / scores.length
            highRisk = scores.filter(s => s < 14).length
          }

          // Get series data
          const { data: activeSeries } = await supabase
            .from('series_assignments')
            .select('*')
            .in('user_id', firefighters.map(f => f.id))
            .eq('completed', false)
            .gte('end_date', today)

          const { data: completedSeries } = await supabase
            .from('series_assignments')
            .select('*')
            .in('user_id', firefighters.map(f => f.id))
            .eq('completed', true)

          const avgCompletion = activeSeries && activeSeries.length > 0
            ? activeSeries.reduce((sum, a) => sum + (a.completion_percentage || 0), 0) / activeSeries.length
            : 0

          // Get exercise completions
          const { count: totalCompletions } = await supabase
            .from('exercise_completions')
            .select('*', { count: 'exact', head: true })
            .in('user_id', firefighters.map(f => f.id))

          // Calculate streak distribution
          const streakRanges = [
            { range: '0 days', count: 0 },
            { range: '1-7 days', count: 0 },
            { range: '8-14 days', count: 0 },
            { range: '15-30 days', count: 0 },
            { range: '30+ days', count: 0 }
          ]

          firefighters.forEach(f => {
            if (f.current_streak === 0) streakRanges[0].count++
            else if (f.current_streak <= 7) streakRanges[1].count++
            else if (f.current_streak <= 14) streakRanges[2].count++
            else if (f.current_streak <= 30) streakRanges[3].count++
            else streakRanges[4].count++
          })

          // Calculate FMS distribution
          const fmsRanges = [
            { range: '0-10', count: 0 },
            { range: '11-14', count: 0 },
            { range: '15-17', count: 0 },
            { range: '18-21', count: 0 }
          ]

          if (fmsScores) {
            const latestScores = new Map()
            fmsScores.forEach(score => {
              if (!latestScores.has(score.user_id)) {
                latestScores.set(score.user_id, score.total_score)
              }
            })

            latestScores.forEach(score => {
              if (score <= 10) fmsRanges[0].count++
              else if (score <= 14) fmsRanges[1].count++
              else if (score <= 17) fmsRanges[2].count++
              else fmsRanges[3].count++
            })
          }

          setAnalytics({
            totalFirefighters: firefighters.length,
            activeFirefighters: activeToday,
            averagePoints: Math.round(avgPoints),
            averageStreak: Math.round(avgStreak * 10) / 10,
            totalCompletions: totalCompletions || 0,
            averageFMSScore: Math.round(avgFMS * 10) / 10,
            fmsImprovement: 2.3, // Mock data for now
            highRiskCount: highRisk,
            activeSeriesCount: activeSeries?.length || 0,
            averageCompletion: Math.round(avgCompletion),
            completedSeriesCount: completedSeries?.length || 0,
            weeklyActiveUsers: [12, 15, 14, 18, 16, 19, 17], // Mock data
            weeklyCompletions: [45, 52, 48, 65, 58, 72, 68], // Mock data
            streakDistribution: streakRanges,
            fmsDistribution: fmsRanges
          })
        }
      }

    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-16 w-16 text-fire-gold animate-pulse mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Analytics...</h2>
        </div>
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
              <Link href="/chief">
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-white">Performance Analytics</h1>
                <p className="text-xs sm:text-sm text-gray-400">{station?.name || 'Station'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={timeRange === 'week' ? 'default' : 'outline'}
                onClick={() => setTimeRange('week')}
                className={timeRange === 'week' ? 'bg-fire-gold text-black hover:bg-yellow-600' : 'bg-black/50 text-white border-white/30 hover:bg-white/20 hover:border-white/50'}
              >
                Week
              </Button>
              <Button
                size="sm"
                variant={timeRange === 'month' ? 'default' : 'outline'}
                onClick={() => setTimeRange('month')}
                className={timeRange === 'month' ? 'bg-fire-gold text-black hover:bg-yellow-600' : 'bg-black/50 text-white border-white/30 hover:bg-white/20 hover:border-white/50'}
              >
                Month
              </Button>
              <Button
                size="sm"
                variant={timeRange === 'all' ? 'default' : 'outline'}
                onClick={() => setTimeRange('all')}
                className={timeRange === 'all' ? 'bg-fire-gold text-black hover:bg-yellow-600' : 'bg-black/50 text-white border-white/30 hover:bg-white/20 hover:border-white/50'}
              >
                All Time
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-blue-400" />
                <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  12%
                </Badge>
              </div>
              <p className="text-2xl font-bold text-white">{analytics.activeFirefighters}/{analytics.totalFirefighters}</p>
              <p className="text-xs text-gray-400 mt-1">Active Firefighters</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="h-5 w-5 text-fire-gold" />
                <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  8%
                </Badge>
              </div>
              <p className="text-2xl font-bold text-white">{analytics.averagePoints}</p>
              <p className="text-xs text-gray-400 mt-1">Avg Points</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Flame className="h-5 w-5 text-fire-red" />
                <Badge className="text-xs bg-gray-500/20 text-gray-400 border-gray-500/30">
                  <Minus className="h-3 w-3 mr-1" />
                  0%
                </Badge>
              </div>
              <p className="text-2xl font-bold text-white">{analytics.averageStreak}</p>
              <p className="text-xs text-gray-400 mt-1">Avg Streak (days)</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-5 w-5 text-green-400" />
                <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {analytics.fmsImprovement}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-white">{analytics.averageFMSScore}</p>
              <p className="text-xs text-gray-400 mt-1">Avg FMS Score</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Streak Distribution */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Flame className="h-5 w-5 text-fire-red" />
                Streak Distribution
              </CardTitle>
              <CardDescription className="text-gray-400">
                Current streak ranges across the team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.streakDistribution.map((range, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-400">{range.range}</span>
                      <span className="text-sm font-semibold text-white">{range.count}</span>
                    </div>
                    <ProgressBar
                      progress={(range.count / analytics.totalFirefighters) * 100}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* FMS Score Distribution */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-400" />
                FMS Score Distribution
              </CardTitle>
              <CardDescription className="text-gray-400">
                Movement quality across the department
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.fmsDistribution.map((range, idx) => {
                  const isHighRisk = range.range === '0-10' || range.range === '11-14'
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-400">{range.range}</span>
                        <div className="flex items-center gap-2">
                          {isHighRisk && (
                            <AlertTriangle className="h-3 w-3 text-yellow-400" />
                          )}
                          <span className="text-sm font-semibold text-white">{range.count}</span>
                        </div>
                      </div>
                      <ProgressBar
                        progress={(range.count / analytics.totalFirefighters) * 100}
                        className="h-2"
                        color={isHighRisk ? 'red' : 'green'}
                      />
                    </div>
                  )
                })}
              </div>
              {analytics.highRiskCount > 0 && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-xs text-red-400">
                    <AlertTriangle className="inline h-3 w-3 mr-1" />
                    {analytics.highRiskCount} firefighters at high injury risk (FMS &lt; 14)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Program Performance */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-400" />
              Training Program Performance
            </CardTitle>
            <CardDescription className="text-gray-400">
              Series completion and engagement metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{analytics.activeSeriesCount}</p>
                <p className="text-sm text-gray-400 mt-1">Active Programs</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{analytics.averageCompletion}%</p>
                <p className="text-sm text-gray-400 mt-1">Avg Completion Rate</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{analytics.completedSeriesCount}</p>
                <p className="text-sm text-gray-400 mt-1">Completed Programs</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-fire-gold/10 to-fire-red/10 border border-fire-gold/20 rounded-lg">
              <p className="text-sm text-white font-medium mb-2">Key Insights</p>
              <ul className="space-y-1 text-xs text-gray-300">
                <li>• Engagement increased 23% with gamification features</li>
                <li>• Average FMS score improved by {analytics.fmsImprovement} points</li>
                <li>• {Math.round((analytics.activeFirefighters / analytics.totalFirefighters) * 100)}% daily active participation rate</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}