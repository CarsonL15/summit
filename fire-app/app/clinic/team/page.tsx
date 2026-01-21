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
  Activity, Users, ArrowLeft, UserPlus, Shield, Search,
  Clock, Target, ChevronRight, Mail
} from 'lucide-react'
import { Database } from '@/types/database'
import { getRiskTextColor } from '@/lib/utils/fms'

type UserData = Database['public']['Tables']['users']['Row']
type StationData = Database['public']['Tables']['stations']['Row']

interface UserWithFMS extends UserData {
  last_fms_score?: number
  last_fms_date?: string
  has_active_series?: boolean
}

export default function ClinicTeamPage() {
  const [clinicUser, setClinicUser] = useState<UserData | null>(null)
  const [station, setStation] = useState<StationData | null>(null)
  const [stationUsers, setStationUsers] = useState<UserWithFMS[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserWithFMS[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'chief' | 'firefighter'>('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [searchQuery, roleFilter, stationUsers])

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

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }

  const loadData = async () => {
    try {
      // Get current auth user
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      // Get clinic user profile
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
      if (userData.role !== 'clinic' && userData.role !== 'admin') {
        if (userData.role === 'chief') {
          router.push('/chief')
        } else {
          router.push('/firefighter')
        }
        return
      }

      setClinicUser(userData)

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

        // Get all users in station (firefighters AND chiefs)
        const { data: users } = await supabase
          .from('users')
          .select('*')
          .eq('station_id', userData.station_id)
          .in('role', ['firefighter', 'chief'])
          .order('role')
          .order('name')

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

          // Build maps
          const fmsMap = new Map<string, { score: number; date: string }>()
          fmsScores?.forEach(score => {
            if (!fmsMap.has(score.user_id)) {
              fmsMap.set(score.user_id, { score: score.total_score, date: score.assessed_date })
            }
          })

          const activeSeriesSet = new Set(activeSeries?.map(a => a.user_id))

          // Enhance users
          const usersWithFMS: UserWithFMS[] = users.map(u => ({
            ...u,
            last_fms_score: fmsMap.get(u.id)?.score,
            last_fms_date: fmsMap.get(u.id)?.date,
            has_active_series: activeSeriesSet.has(u.id)
          }))

          setStationUsers(usersWithFMS)
          setFilteredUsers(usersWithFMS)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysSinceAssessment = (date?: string) => {
    if (!date) return null
    return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
  }

  const chiefCount = stationUsers.filter(u => u.role === 'chief').length
  const firefighterCount = stationUsers.filter(u => u.role === 'firefighter').length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-16 w-16 text-blue-400 animate-pulse mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Team...</h2>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/clinic">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-white">Station Roster</h1>
                <p className="text-xs sm:text-sm text-gray-400">{station?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/clinic/team/new?role=chief">
                <Button size="sm" className="bg-fire-gold hover:bg-yellow-600 text-black hidden sm:flex">
                  <Shield className="h-4 w-4 mr-1" />
                  Add Chief
                </Button>
              </Link>
              <Link href="/clinic/team/new?role=firefighter">
                <Button size="sm" className="bg-fire-red hover:bg-red-700 text-white">
                  <UserPlus className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Add Firefighter</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Department Header */}
        <Card className="bg-gradient-to-r from-fire-gold/20 to-fire-red/20 border-fire-gold/30 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-fire-gold/20 rounded-lg">
                  <Shield className="h-6 w-6 text-fire-gold" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Spokane Valley Fire Department</h2>
                  <p className="text-sm text-gray-400">SVFD</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{stationUsers.length}</p>
                <p className="text-sm text-gray-400">Total Personnel</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Station Card */}
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-fire-red/20 rounded-lg">
                  <Activity className="h-5 w-5 text-fire-red" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">{station?.name}</h3>
                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-xs text-fire-gold border-fire-gold/30">
                      <Shield className="h-3 w-3 mr-1" />
                      {chiefCount} Chiefs
                    </Badge>
                    <Badge variant="outline" className="text-xs text-fire-red border-fire-red/30">
                      <Users className="h-3 w-3 mr-1" />
                      {firefighterCount} Firefighters
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <AnimatedCard className="bg-white/5 border-white/10" delay={0}>
            <AnimatedCardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-white">{stationUsers.length}</p>
              <p className="text-xs text-gray-400">Total Personnel</p>
            </AnimatedCardContent>
          </AnimatedCard>
          <AnimatedCard className="bg-fire-gold/10 border-fire-gold/30" delay={0.05}>
            <AnimatedCardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-fire-gold">{chiefCount}</p>
              <p className="text-xs text-gray-400">Chiefs</p>
            </AnimatedCardContent>
          </AnimatedCard>
          <AnimatedCard className="bg-fire-red/10 border-fire-red/30" delay={0.1}>
            <AnimatedCardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-fire-red">{firefighterCount}</p>
              <p className="text-xs text-gray-400">Firefighters</p>
            </AnimatedCardContent>
          </AnimatedCard>
        </div>

        {/* Search & Filter */}
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
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
                  variant={roleFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setRoleFilter('all')}
                  className={roleFilter === 'all' ? 'bg-blue-600' : 'bg-white/5 text-white border-white/20'}
                >
                  All ({stationUsers.length})
                </Button>
                <Button
                  size="sm"
                  variant={roleFilter === 'chief' ? 'default' : 'outline'}
                  onClick={() => setRoleFilter('chief')}
                  className={roleFilter === 'chief' ? 'bg-fire-gold text-black' : 'bg-white/5 text-white border-white/20'}
                >
                  Chiefs ({chiefCount})
                </Button>
                <Button
                  size="sm"
                  variant={roleFilter === 'firefighter' ? 'default' : 'outline'}
                  onClick={() => setRoleFilter('firefighter')}
                  className={roleFilter === 'firefighter' ? 'bg-fire-red' : 'bg-white/5 text-white border-white/20'}
                >
                  Firefighters ({firefighterCount})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User List */}
        <div className="space-y-3">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => {
              const daysSince = getDaysSinceAssessment(user.last_fms_date)
              const needsAssessment = !user.last_fms_date || (daysSince !== null && daysSince > 90)

              return (
                <Card key={user.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`p-2 rounded-full flex-shrink-0 ${user.role === 'chief' ? 'bg-fire-gold/20' : 'bg-fire-red/20'}`}>
                          {user.role === 'chief' ? (
                            <Shield className="h-5 w-5 text-fire-gold" />
                          ) : (
                            <Users className="h-5 w-5 text-fire-red" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-white truncate">{user.name}</p>
                            <Badge
                              variant="outline"
                              className={user.role === 'chief' ? 'text-fire-gold border-fire-gold/30' : 'text-gray-400 border-white/20'}
                            >
                              {user.role === 'chief' ? 'Chief' : 'Firefighter'}
                            </Badge>
                            {user.has_active_series && (
                              <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                                Active Program
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-400 flex-wrap">
                            {user.badge_number && <span>Badge #{user.badge_number}</span>}
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Points: {user.points}</span>
                            <span>Streak: {user.current_streak}d</span>
                            {user.last_fms_score !== undefined && (
                              <span className={getRiskTextColor(user.last_fms_score)}>
                                FMS: {user.last_fms_score}/21
                              </span>
                            )}
                            {daysSince !== null && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Assessed {daysSince}d ago
                              </span>
                            )}
                            {!user.last_fms_date && (
                              <span className="text-orange-400">Never assessed</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        <Link href={`/clinic/assessment?user=${user.id}`}>
                          <Button
                            size="sm"
                            className={needsAssessment ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}
                          >
                            Assess
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 mb-4">
                  {searchQuery || roleFilter !== 'all'
                    ? 'No personnel match your search'
                    : 'No personnel in this station'}
                </p>
                {!searchQuery && roleFilter === 'all' && (
                  <Link href="/clinic/team/new">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Add First Member
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
