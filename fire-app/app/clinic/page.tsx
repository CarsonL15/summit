'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AnimatedCard, AnimatedCardContent } from '@/components/ui/animated-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Activity, Users, ClipboardCheck, LogOut, Target, UserPlus,
  ChevronRight, Search, AlertCircle, CheckCircle, Clock, Layers
} from 'lucide-react'
import { Database } from '@/types/database'
import { getRiskLevel, getRiskTextColor } from '@/lib/utils/fms'

type UserData = Database['public']['Tables']['users']['Row']
type StationData = Database['public']['Tables']['stations']['Row']
type FMSScoreData = Database['public']['Tables']['fms_scores']['Row']

interface UserWithFMS extends UserData {
  last_fms_score?: number
  last_fms_date?: string
  has_active_series?: boolean
  station_name?: string
}

interface ClinicStats {
  total_users: number
  assessments_today: number
  pending_assessments: number
  average_fms_score: number
}

export default function ClinicDashboard() {
  const [user, setUser] = useState<UserData | null>(null)
  const [station, setStation] = useState<StationData | null>(null)
  const [stationUsers, setStationUsers] = useState<UserWithFMS[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserWithFMS[]>([])
  const [recentAssessments, setRecentAssessments] = useState<FMSScoreData[]>([])
  const [stats, setStats] = useState<ClinicStats>({
    total_users: 0,
    assessments_today: 0,
    pending_assessments: 0,
    average_fms_score: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'needs_assessment' | 'active'>('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [searchQuery, filter, stationUsers])

  const filterUsers = () => {
    let filtered = [...stationUsers]

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.badge_number?.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      )
    }

    // Apply filter
    if (filter === 'needs_assessment') {
      filtered = filtered.filter(u => {
        if (!u.last_fms_date) return true
        const daysSince = Math.floor((Date.now() - new Date(u.last_fms_date).getTime()) / (1000 * 60 * 60 * 24))
        return daysSince > 90
      })
    } else if (filter === 'active') {
      filtered = filtered.filter(u => u.has_active_series)
    }

    setFilteredUsers(filtered)
  }

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
        router.push('/auth/login')
        return
      }

      // Check role - redirect if not clinic
      if (userData.role !== 'clinic' && userData.role !== 'admin') {
        if (userData.role === 'chief') {
          router.push('/chief')
        } else {
          router.push('/firefighter')
        }
        return
      }

      setUser(userData)

      // Get ALL stations for department-wide view
      const { data: allStations } = await supabase
        .from('stations')
        .select('*')
        .order('name')

      // Use first station for display purposes (department view)
      if (allStations && allStations.length > 0) {
        setStation(allStations[0])
      }

      // Build station name map for display
      const stationMap = new Map<string, string>()
      allStations?.forEach(s => stationMap.set(s.id, s.name))

      // Get ALL users across ALL stations (firefighters AND chiefs)
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .in('role', ['firefighter', 'chief'])
        .order('name')
        .limit(500)

      if (users) {
        const today = new Date().toISOString().split('T')[0]

        // Get latest FMS scores for all users
        const { data: fmsScores } = await supabase
          .from('fms_scores')
          .select('user_id, total_score, assessed_date')
          .in('user_id', users.map(u => u.id))
          .order('assessed_date', { ascending: false })

        // Get active series
        const { data: activeSeries } = await supabase
          .from('series_assignments')
          .select('user_id')
          .in('user_id', users.map(u => u.id))
          .eq('completed', false)
          .gte('end_date', today)

        // Build maps for quick lookups
        const fmsMap = new Map<string, { score: number; date: string }>()
        fmsScores?.forEach(score => {
          if (!fmsMap.has(score.user_id)) {
            fmsMap.set(score.user_id, { score: score.total_score, date: score.assessed_date })
          }
        })

        const activeSeriesSet = new Set(activeSeries?.map(a => a.user_id))

        // Enhance users with FMS data and station name
        const usersWithFMS: UserWithFMS[] = users.map(u => ({
          ...u,
          last_fms_score: fmsMap.get(u.id)?.score,
          last_fms_date: fmsMap.get(u.id)?.date,
          has_active_series: activeSeriesSet.has(u.id),
          station_name: u.station_id ? stationMap.get(u.station_id) : undefined
        }))

        setStationUsers(usersWithFMS)
        setFilteredUsers(usersWithFMS)

        // Calculate stats
        const assessedToday = fmsScores?.filter(s => s.assessed_date === today).length || 0
        const neverAssessed = usersWithFMS.filter(u => !u.last_fms_date).length
        const needsReassessment = usersWithFMS.filter(u => {
          if (!u.last_fms_date) return false
          const daysSince = Math.floor((Date.now() - new Date(u.last_fms_date).getTime()) / (1000 * 60 * 60 * 24))
          return daysSince > 90
        }).length

        const scoresArray = Array.from(fmsMap.values()).map(v => v.score)
        const avgScore = scoresArray.length > 0
          ? Math.round(scoresArray.reduce((a, b) => a + b, 0) / scoresArray.length * 10) / 10
          : 0

        setStats({
          total_users: users.length,
          assessments_today: assessedToday,
          pending_assessments: neverAssessed + needsReassessment,
          average_fms_score: avgScore
        })
      }

      // Get recent assessments conducted by this clinic user
      const { data: recentFMS } = await supabase
        .from('fms_scores')
        .select('*')
        .eq('assessed_by', authUser.id)
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const getDaysSinceAssessment = (date?: string) => {
    if (!date) return null
    return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-16 w-16 text-blue-400 animate-pulse mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Clinic Dashboard...</h2>
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
              <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
              <div>
                <h1 className="text-base sm:text-xl font-bold text-white">Clinic Dashboard</h1>
                <p className="text-xs sm:text-sm text-gray-400">Spokane Valley Fire Department</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-400">Clinic Staff</p>
              </div>
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
        {/* Primary CTA - New Assessment */}
        <Link href="/clinic/assessment">
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-blue-500/50 mb-6 hover:from-blue-700 hover:to-blue-800 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-full">
                    <ClipboardCheck className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">New FMS Assessment</h2>
                    <p className="text-blue-100">Conduct a movement screening</p>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-white" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <AnimatedCard className="bg-white/5 border-white/10" delay={0}>
            <AnimatedCardContent className="p-4">
              <div className="flex items-center justify-between">
                <Users className="h-4 w-4 text-blue-400" />
                <span className="text-xl font-bold text-white">{stats.total_users}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Total Personnel</p>
            </AnimatedCardContent>
          </AnimatedCard>

          <AnimatedCard className="bg-white/5 border-white/10" delay={0.05}>
            <AnimatedCardContent className="p-4">
              <div className="flex items-center justify-between">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-xl font-bold text-white">{stats.assessments_today}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Assessed Today</p>
            </AnimatedCardContent>
          </AnimatedCard>

          <AnimatedCard className="bg-white/5 border-white/10" delay={0.1}>
            <AnimatedCardContent className="p-4">
              <div className="flex items-center justify-between">
                <AlertCircle className="h-4 w-4 text-orange-400" />
                <span className="text-xl font-bold text-white">{stats.pending_assessments}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Need Assessment</p>
            </AnimatedCardContent>
          </AnimatedCard>

          <AnimatedCard className="bg-white/5 border-white/10" delay={0.15}>
            <AnimatedCardContent className="p-4">
              <div className="flex items-center justify-between">
                <Target className="h-4 w-4 text-fire-gold" />
                <span className="text-xl font-bold text-white">{stats.average_fms_score}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Avg FMS Score</p>
            </AnimatedCardContent>
          </AnimatedCard>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Link href="/clinic/team/new?role=firefighter">
            <Button className="w-full h-auto py-4 bg-fire-red hover:bg-red-700 text-white flex items-center justify-center gap-2">
              <UserPlus className="h-5 w-5" />
              <span>Add Firefighter</span>
            </Button>
          </Link>
          <Link href="/clinic/review">
            <Button className="w-full h-auto py-4 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              <span>Review Tests</span>
            </Button>
          </Link>
          <Link href="/clinic/series">
            <Button className="w-full h-auto py-4 bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2">
              <Layers className="h-5 w-5" />
              <span>Mini Series</span>
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Personnel List */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                Department Personnel
              </CardTitle>
              <CardDescription className="text-gray-400">
                {filteredUsers.length} of {stationUsers.length} shown (all stations)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search & Filter */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, badge, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={filter === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilter('all')}
                    className={filter === 'all' ? 'bg-blue-600' : 'bg-white/5 text-white border-white/20'}
                  >
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant={filter === 'needs_assessment' ? 'default' : 'outline'}
                    onClick={() => setFilter('needs_assessment')}
                    className={filter === 'needs_assessment' ? 'bg-orange-600' : 'bg-white/5 text-white border-white/20'}
                  >
                    Needs Assessment
                  </Button>
                  <Button
                    size="sm"
                    variant={filter === 'active' ? 'default' : 'outline'}
                    onClick={() => setFilter('active')}
                    className={filter === 'active' ? 'bg-green-600' : 'bg-white/5 text-white border-white/20'}
                  >
                    Active Program
                  </Button>
                </div>
              </div>

              {/* User List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => {
                    const daysSince = getDaysSinceAssessment(u.last_fms_date)
                    const needsAssessment = !u.last_fms_date || (daysSince !== null && daysSince > 90)

                    return (
                      <div
                        key={u.id}
                        className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-black/30 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white truncate">{u.name}</p>
                              <Badge
                                variant="outline"
                                className={u.role === 'chief' ? 'text-fire-gold border-fire-gold/30' : 'text-gray-400 border-white/20'}
                              >
                                {u.role === 'chief' ? 'Chief' : 'FF'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                              {u.station_name && <span className="text-blue-400">{u.station_name}</span>}
                              {u.badge_number && <span>#{u.badge_number}</span>}
                              {u.last_fms_score !== undefined && (
                                <span className={getRiskTextColor(u.last_fms_score)}>
                                  FMS: {u.last_fms_score}
                                </span>
                              )}
                              {daysSince !== null && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {daysSince}d ago
                                </span>
                              )}
                              {u.has_active_series && (
                                <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                                  Active
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Link href={`/clinic/assessment?user=${u.id}`}>
                            <Button
                              size="sm"
                              className={needsAssessment ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}
                            >
                              Assess
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-center text-gray-400 py-8">No personnel found</p>
                )}
              </div>

              <Link href="/clinic/team">
                <Button variant="ghost" className="w-full mt-4 text-white/80 hover:text-white hover:bg-black/30">
                  View Full Roster
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Assessments */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-green-400" />
                Recent Assessments
              </CardTitle>
              <CardDescription className="text-gray-400">
                Your latest FMS screenings
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
                  <ClipboardCheck className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 mb-4">No assessments yet</p>
                  <Link href="/clinic/assessment">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Conduct First Assessment
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
