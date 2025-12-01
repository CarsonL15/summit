'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Shield, Users, Trophy, Flame, Activity, Calendar,
  ChevronLeft, Search, Filter, UserPlus, FileText,
  Award, Target, Clock, TrendingUp
} from 'lucide-react'
import { Database } from '@/types/database'

type UserData = Database['public']['Tables']['users']['Row']
type FMSScoreData = Database['public']['Tables']['fms_scores']['Row']
type SeriesAssignmentData = Database['public']['Tables']['series_assignments']['Row']

interface FirefighterWithDetails extends UserData {
  lastFMS?: FMSScoreData
  activeSeries?: SeriesAssignmentData & {
    series: Database['public']['Tables']['series']['Row'] | null
  }
  achievements: number
}

export default function TeamManagement() {
  const [user, setUser] = useState<UserData | null>(null)
  const [firefighters, setFirefighters] = useState<FirefighterWithDetails[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
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
      if (userData.role !== 'chief' && userData.role !== 'admin' && userData.role !== 'pt') {
        router.push('/firefighter')
        return
      }

      setUser(userData)

      // Get all firefighters in station
      const { data: firefightersData } = await supabase
        .from('users')
        .select('*')
        .eq('station_id', userData.station_id)
        .eq('role', 'firefighter')
        .order('name')

      if (firefightersData) {
        // Get additional details for each firefighter
        const enhancedFirefighters = await Promise.all(
          firefightersData.map(async (firefighter) => {
            // Get latest FMS score
            const { data: fmsScores } = await supabase
              .from('fms_scores')
              .select('*')
              .eq('user_id', firefighter.id)
              .order('created_at', { ascending: false })
              .limit(1)

            // Get active series
            const today = new Date().toISOString().split('T')[0]
            const { data: activeSeries } = await supabase
              .from('series_assignments')
              .select(`
                *,
                series:series(*)
              `)
              .eq('user_id', firefighter.id)
              .eq('completed', false)
              .gte('end_date', today)
              .single()

            // Get achievement count
            const { count: achievementCount } = await supabase
              .from('user_achievements')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', firefighter.id)

            return {
              ...firefighter,
              lastFMS: fmsScores?.[0],
              activeSeries: activeSeries as any,
              achievements: achievementCount || 0
            }
          })
        )

        setFirefighters(enhancedFirefighters)
      }

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredFirefighters = firefighters.filter(firefighter => {
    const matchesSearch = firefighter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         firefighter.badge_number?.includes(searchTerm)

    const today = new Date().toISOString().split('T')[0]
    const isActive = firefighter.last_activity_date === today

    if (filterActive === 'active' && !isActive) return false
    if (filterActive === 'inactive' && isActive) return false

    return matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-16 w-16 text-fire-gold animate-pulse mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Team...</h2>
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
                <h1 className="text-base sm:text-xl font-bold text-white">Team Management</h1>
                <p className="text-xs sm:text-sm text-gray-400">{firefighters.length} firefighters</p>
              </div>
            </div>
            <Link href="/chief/firefighters/new">
              <Button className="bg-fire-red hover:bg-red-700 text-white">
                <UserPlus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Add Firefighter</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Search and Filters */}
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name or badge number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterActive === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterActive('all')}
                  className={filterActive === 'all' ? 'bg-fire-gold text-black hover:bg-yellow-600' : 'bg-black/50 text-white border-white/30 hover:bg-white/20 hover:border-white/50'}
                >
                  All
                </Button>
                <Button
                  variant={filterActive === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterActive('active')}
                  className={filterActive === 'active' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-black/50 text-white border-white/30 hover:bg-white/20 hover:border-white/50'}
                >
                  Active Today
                </Button>
                <Button
                  variant={filterActive === 'inactive' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterActive('inactive')}
                  className={filterActive === 'inactive' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-black/50 text-white border-white/30 hover:bg-white/20 hover:border-white/50'}
                >
                  Inactive
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFirefighters.map((firefighter) => (
            <Card key={firefighter.id} className="bg-white/5 border-white/10 hover:border-white/20 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-white text-base">{firefighter.name}</CardTitle>
                    <CardDescription className="text-gray-400">
                      Badge #{firefighter.badge_number}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {firefighter.last_activity_date === new Date().toISOString().split('T')[0] && (
                      <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white/5 rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-3 w-3 text-fire-gold" />
                      <span className="text-white font-semibold">{firefighter.points}</span>
                    </div>
                    <p className="text-xs text-gray-400">Points</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <Flame className="h-3 w-3 text-fire-red" />
                      <span className="text-white font-semibold">{firefighter.current_streak}</span>
                    </div>
                    <p className="text-xs text-gray-400">Day Streak</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-blue-400" />
                      <span className="text-white font-semibold">
                        {firefighter.lastFMS ? firefighter.lastFMS.total_score : '-'}/21
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">FMS Score</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <Award className="h-3 w-3 text-purple-400" />
                      <span className="text-white font-semibold">{firefighter.achievements}</span>
                    </div>
                    <p className="text-xs text-gray-400">Badges</p>
                  </div>
                </div>

                {/* Active Series */}
                {firefighter.activeSeries ? (
                  <div className="mb-4 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-xs text-blue-400 font-medium">Active Program</p>
                    <p className="text-xs text-white mt-0.5">
                      {firefighter.activeSeries.series?.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Week {firefighter.activeSeries.current_week} • {firefighter.activeSeries.completion_percentage}%
                    </p>
                  </div>
                ) : (
                  <div className="mb-4 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-xs text-red-400 font-medium">No Active Program</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {!firefighter.activeSeries && (
                    <Link href={`/chief/series/assign?user=${firefighter.id}`} className="flex-1">
                      <Button size="sm" className="w-full bg-fire-red hover:bg-red-700">
                        Assign Series
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredFirefighters.length === 0 && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No firefighters found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}