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
import {
  Activity, Users, FileText, LogOut, ChevronRight,
  Calendar, TrendingUp, AlertTriangle, Target, Plus,
  Clock, CheckCircle2
} from 'lucide-react'
import { Database } from '@/types/database'

type UserData = Database['public']['Tables']['users']['Row']
type StationData = Database['public']['Tables']['stations']['Row']
type FMSScoreData = Database['public']['Tables']['fms_scores']['Row']

interface FirefighterWithAssessment extends UserData {
  last_assessment?: FMSScoreData
  days_since_assessment?: number
}

export default function PTDashboard() {
  const [user, setUser] = useState<UserData | null>(null)
  const [station, setStation] = useState<StationData | null>(null)
  const [firefighters, setFirefighters] = useState<FirefighterWithAssessment[]>([])
  const [recentAssessments, setRecentAssessments] = useState<FMSScoreData[]>([])
  const [needsAssessment, setNeedsAssessment] = useState<FirefighterWithAssessment[]>([])
  const [stats, setStats] = useState({
    totalAssessments: 0,
    averageFMS: 0,
    highRiskCount: 0,
    dueForReassessment: 0
  })
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

      // Check role - PT only access
      if (userData.role !== 'pt' && userData.role !== 'admin') {
        // If chief, redirect to chief dashboard
        if (userData.role === 'chief') {
          router.push('/chief')
        } else {
          router.push('/firefighter')
        }
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
        const { data: firefightersData } = await supabase
          .from('users')
          .select('*')
          .eq('station_id', userData.station_id)
          .eq('role', 'firefighter')
          .order('name')

        if (firefightersData) {
          // Get assessment history for each firefighter
          const enhancedFirefighters = await Promise.all(
            firefightersData.map(async (firefighter) => {
              const { data: assessments } = await supabase
                .from('fms_scores')
                .select('*')
                .eq('user_id', firefighter.id)
                .order('created_at', { ascending: false })
                .limit(1)

              const lastAssessment = assessments?.[0]
              let daysSince = null

              if (lastAssessment?.assessed_date) {
                const assessmentDate = new Date(lastAssessment.assessed_date)
                const today = new Date()
                daysSince = Math.floor((today.getTime() - assessmentDate.getTime()) / (1000 * 60 * 60 * 24))
              }

              return {
                ...firefighter,
                last_assessment: lastAssessment,
                days_since_assessment: daysSince
              }
            })
          )

          setFirefighters(enhancedFirefighters)

          // Filter those needing assessment (never assessed or > 90 days)
          const needAssessment = enhancedFirefighters.filter(f =>
            !f.last_assessment || (f.days_since_assessment && f.days_since_assessment > 90)
          )
          setNeedsAssessment(needAssessment)

          // Calculate stats
          const assessedFirefighters = enhancedFirefighters.filter(f => f.last_assessment)
          const totalAssessments = assessedFirefighters.length
          const avgFMS = assessedFirefighters.length > 0
            ? assessedFirefighters.reduce((sum, f) => sum + (f.last_assessment?.total_score || 0), 0) / assessedFirefighters.length
            : 0
          const highRisk = assessedFirefighters.filter(f => f.last_assessment && f.last_assessment.total_score < 14).length
          const dueReassessment = enhancedFirefighters.filter(f => f.days_since_assessment && f.days_since_assessment > 90).length

          setStats({
            totalAssessments,
            averageFMS: Math.round(avgFMS * 10) / 10,
            highRiskCount: highRisk,
            dueForReassessment: dueReassessment
          })
        }

        // Get recent assessments by this PT
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
          <Activity className="h-16 w-16 text-fire-gold animate-pulse mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading PT Dashboard...</h2>
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
              <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-fire-gold" />
              <div>
                <h1 className="text-base sm:text-xl font-bold text-white">PT Assessment Center</h1>
                <p className="text-xs sm:text-sm text-gray-400">{station?.name || 'Station'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-gray-400">Physical Therapist</p>
              </div>
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
        <div className="flex gap-4 mb-8">
          <Link href="/pt/assessment" className="flex-1">
            <Button className="w-full h-auto py-4 bg-fire-red hover:bg-red-700 text-white">
              <Plus className="mr-2 h-5 w-5" />
              <div className="text-left">
                <p className="font-semibold">New FMS Assessment</p>
                <p className="text-xs opacity-90">Evaluate firefighter movement</p>
              </div>
            </Button>
          </Link>
          <Link href="/pt/history" className="flex-1">
            <Button className="w-full h-auto py-4 bg-blue-600 hover:bg-blue-700 text-white">
              <Clock className="mr-2 h-5 w-5" />
              <div className="text-left">
                <p className="font-semibold">Assessment History</p>
                <p className="text-xs opacity-90">View past evaluations</p>
              </div>
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <AnimatedCard className="bg-white/5 border-white/10" delay={0}>
            <AnimatedCardContent className="p-4">
              <div className="flex items-center justify-between">
                <FileText className="h-4 w-4 text-blue-400" />
                <span className="text-xl font-bold text-white">{stats.totalAssessments}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Total Assessments</p>
            </AnimatedCardContent>
          </AnimatedCard>

          <AnimatedCard className="bg-white/5 border-white/10" delay={0.05}>
            <AnimatedCardContent className="p-4">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-xl font-bold text-white">{stats.averageFMS}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Avg FMS Score</p>
            </AnimatedCardContent>
          </AnimatedCard>

          <AnimatedCard className="bg-white/5 border-white/10" delay={0.1}>
            <AnimatedCardContent className="p-4">
              <div className="flex items-center justify-between">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <span className="text-xl font-bold text-white">{stats.highRiskCount}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">High Risk (&lt;14)</p>
            </AnimatedCardContent>
          </AnimatedCard>

          <AnimatedCard className="bg-white/5 border-white/10" delay={0.15}>
            <AnimatedCardContent className="p-4">
              <div className="flex items-center justify-between">
                <Calendar className="h-4 w-4 text-red-400" />
                <span className="text-xl font-bold text-white">{stats.dueForReassessment}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Due for Reassessment</p>
            </AnimatedCardContent>
          </AnimatedCard>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Needs Assessment */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-red-400" />
                Needs Assessment
              </CardTitle>
              <CardDescription className="text-gray-400">
                Firefighters requiring evaluation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {needsAssessment.length > 0 ? (
                <div className="space-y-3">
                  {needsAssessment.slice(0, 5).map((firefighter) => (
                    <div
                      key={firefighter.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{firefighter.name}</p>
                        <p className="text-xs text-gray-400">
                          {firefighter.last_assessment
                            ? `Last assessed ${firefighter.days_since_assessment} days ago`
                            : 'Never assessed'}
                        </p>
                      </div>
                      <Link href={`/pt/assessment?user=${firefighter.id}`}>
                        <Button size="sm" className="bg-fire-red hover:bg-red-700">
                          Assess
                        </Button>
                      </Link>
                    </div>
                  ))}
                  {needsAssessment.length > 5 && (
                    <Link href="/pt/assessment">
                      <Button variant="ghost" className="w-full text-white/80 hover:text-white hover:bg-white/10">
                        View All ({needsAssessment.length} total)
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-3" />
                  <p className="text-gray-400">All firefighters recently assessed</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Assessments */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-400" />
                Your Recent Assessments
              </CardTitle>
              <CardDescription className="text-gray-400">
                Latest FMS evaluations you've conducted
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
                        <div className={`text-2xl font-bold ${
                          assessment.total_score >= 17 ? 'text-green-400' :
                          assessment.total_score >= 14 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {assessment.total_score >= 17 ? '✓' :
                           assessment.total_score >= 14 ? '⚠' : '✗'}
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
                  <Link href="/pt/assessment">
                    <Button className="bg-fire-red hover:bg-red-700">
                      Start First Assessment
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