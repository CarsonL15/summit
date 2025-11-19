'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Shield, Users, FileText, Calendar, Target, Zap,
  ChevronLeft, Plus, Filter, Search, Activity
} from 'lucide-react'
import { Database } from '@/types/database'

type UserData = Database['public']['Tables']['users']['Row']
type SeriesData = Database['public']['Tables']['series']['Row']
type SeriesAssignmentData = Database['public']['Tables']['series_assignments']['Row']

interface AssignmentWithUser extends SeriesAssignmentData {
  user: UserData | null
  series: SeriesData | null
}

export default function SeriesManagement() {
  const [user, setUser] = useState<UserData | null>(null)
  const [availableSeries, setAvailableSeries] = useState<SeriesData[]>([])
  const [activeAssignments, setActiveAssignments] = useState<AssignmentWithUser[]>([])
  const [firefighters, setFirefighters] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
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

      // Get all available series
      const { data: seriesData } = await supabase
        .from('series')
        .select('*')
        .order('name')

      if (seriesData) {
        setAvailableSeries(seriesData)
      }

      // Get all firefighters in station
      const { data: firefightersData } = await supabase
        .from('users')
        .select('*')
        .eq('station_id', userData.station_id)
        .eq('role', 'firefighter')
        .order('name')

      if (firefightersData) {
        setFirefighters(firefightersData)
      }

      // Get active series assignments
      const today = new Date().toISOString().split('T')[0]
      const { data: assignmentsData } = await supabase
        .from('series_assignments')
        .select(`
          *,
          user:users(*),
          series:series(*)
        `)
        .eq('completed', false)
        .gte('end_date', today)
        .order('created_at', { ascending: false })

      if (assignmentsData) {
        setActiveAssignments(assignmentsData as any)
      }

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAssign = (firefighterId: string, seriesId: string) => {
    // Navigate to assignment flow with pre-selected values
    router.push(`/chief/series/assign?user=${firefighterId}&series=${seriesId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Zap className="h-16 w-16 text-fire-gold animate-pulse mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Series Management...</h2>
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
                <h1 className="text-base sm:text-xl font-bold text-white">Series Management</h1>
                <p className="text-xs sm:text-sm text-gray-400">Assign and manage training programs</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Available Series */}
        <Card className="bg-white/5 border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-fire-gold" />
              Available Training Series
            </CardTitle>
            <CardDescription className="text-gray-400">
              3-week progressive training programs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableSeries.map((series) => (
                <Card key={series.id} className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-base">{series.name}</CardTitle>
                    <CardDescription className="text-gray-400 text-sm">
                      {series.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {series.target_areas && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {(series.target_areas as string[]).map((area, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs border-white/20">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="w-full bg-fire-gold hover:bg-yellow-600 text-black"
                      onClick={() => router.push(`/chief/series/assign?series=${series.id}`)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Assign Series
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Assignments */}
        <Card className="bg-white/5 border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              Active Assignments
            </CardTitle>
            <CardDescription className="text-gray-400">
              Currently running training programs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeAssignments.length > 0 ? (
              <div className="space-y-3">
                {activeAssignments.map((assignment) => (
                  <div key={assignment.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">
                          {assignment.user?.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-400">
                          {assignment.series?.name || 'Unknown Series'}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                            Week {assignment.current_week || 1}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {assignment.completion_percentage || 0}% complete
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">
                          Ends {new Date(assignment.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-8">No active assignments</p>
            )}
          </CardContent>
        </Card>

        {/* Firefighters Without Series */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-red-400" />
              Unassigned Firefighters
            </CardTitle>
            <CardDescription className="text-gray-400">
              Team members without active training programs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {firefighters.filter(f =>
              !activeAssignments.some(a => a.user_id === f.id)
            ).length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {firefighters
                  .filter(f => !activeAssignments.some(a => a.user_id === f.id))
                  .map((firefighter) => (
                    <div
                      key={firefighter.id}
                      className="p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <p className="text-sm font-medium text-white">{firefighter.name}</p>
                      <p className="text-xs text-gray-400">Badge #{firefighter.badge_number}</p>
                      <Button
                        size="sm"
                        className="w-full mt-2 bg-fire-red hover:bg-red-700"
                        onClick={() => router.push(`/chief/series/assign?user=${firefighter.id}`)}
                      >
                        Assign Series
                      </Button>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-8">
                All firefighters have active training programs
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}