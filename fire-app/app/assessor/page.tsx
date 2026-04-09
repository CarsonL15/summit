'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Activity, Users, ClipboardCheck, LogOut, Search, Clock, User
} from 'lucide-react'
import { Database } from '@/types/database'
import { getRiskTextColor } from '@/lib/utils/fms'

type UserData = Database['public']['Tables']['users']['Row']
type StationData = Database['public']['Tables']['stations']['Row']
type FMSScoreData = Database['public']['Tables']['fms_scores']['Row']

interface UserWithFMS extends UserData {
  last_fms_score?: number
  last_fms_date?: string
  has_active_series?: boolean
  station_name?: string
}

export default function AssessorDashboard() {
  const [user, setUser] = useState<UserData | null>(null)
  const [stationUsers, setStationUsers] = useState<UserWithFMS[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserWithFMS[]>([])
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

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.badge_number?.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      )
    }

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
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, role, station_id, email, badge_number, points, current_streak, longest_streak, last_activity_date, created_at, updated_at')
        .eq('id', authUser.id)
        .single()

      if (userError || !userData) {
        router.push('/auth/login')
        return
      }

      if (userData.role !== 'assessor' && userData.role !== 'admin') {
        if (userData.role === 'clinic') {
          router.push('/clinic')
        } else if (userData.role === 'chief') {
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
        .select('id, name')
        .order('name')

      const stationMap = new Map<string, string>()
      allStations?.forEach(s => stationMap.set(s.id, s.name))

      // Get ALL users across ALL stations (firefighters AND chiefs)
      const { data: users } = await supabase
        .from('users')
        .select('id, name, badge_number, email, role, station_id, points, current_streak, longest_streak, last_activity_date, created_at, updated_at')
        .in('role', ['firefighter', 'chief'])
        .order('name')
        .limit(500)

      if (users) {
        const today = new Date().toISOString().split('T')[0]

        const { data: fmsScores } = await supabase
          .from('fms_scores')
          .select('user_id, total_score, assessed_date')
          .in('user_id', users.map(u => u.id))
          .order('assessed_date', { ascending: false })

        const { data: activeSeries } = await supabase
          .from('series_assignments')
          .select('user_id')
          .in('user_id', users.map(u => u.id))
          .eq('completed', false)
          .gte('end_date', today)

        const fmsMap = new Map<string, { score: number; date: string }>()
        fmsScores?.forEach(score => {
          if (!fmsMap.has(score.user_id)) {
            fmsMap.set(score.user_id, { score: score.total_score, date: score.assessed_date })
          }
        })

        const activeSeriesSet = new Set(activeSeries?.map(a => a.user_id))

        const usersWithFMS: UserWithFMS[] = users.map(u => ({
          ...u,
          last_fms_score: fmsMap.get(u.id)?.score,
          last_fms_date: fmsMap.get(u.id)?.date,
          has_active_series: activeSeriesSet.has(u.id),
          station_name: u.station_id ? stationMap.get(u.station_id) : undefined
        }))

        setStationUsers(usersWithFMS)
        setFilteredUsers(usersWithFMS)
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
          <ClipboardCheck className="h-16 w-16 text-teal-400 animate-pulse mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Assessor Dashboard...</h2>
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
              <ClipboardCheck className="h-6 w-6 sm:h-8 sm:w-8 text-teal-400" />
              <div>
                <h1 className="text-base sm:text-xl font-bold text-white">FMS Assessor</h1>
                <p className="text-xs sm:text-sm text-gray-400">Conduct Movement Screenings</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-400">Assessor</p>
              </div>
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-black/30 p-2">
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
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        {/* Personnel List */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-400" />
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
                  className={filter === 'all' ? 'bg-teal-600' : 'bg-white/5 text-white border-white/20'}
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
            <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto">
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
                        <Link href={`/assessor/assessment?user=${u.id}`}>
                          <Button
                            size="sm"
                            className={needsAssessment ? 'bg-orange-600 hover:bg-orange-700' : 'bg-teal-600 hover:bg-teal-700'}
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
