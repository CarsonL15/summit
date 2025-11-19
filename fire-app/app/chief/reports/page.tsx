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
  Shield, FileText, ChevronLeft, Search, Filter,
  Calendar, TrendingUp, AlertTriangle, User, Clock
} from 'lucide-react'
import { Database } from '@/types/database'

type UserData = Database['public']['Tables']['users']['Row']
type FMSScoreData = Database['public']['Tables']['fms_scores']['Row']

interface AssessmentWithDetails extends FMSScoreData {
  user?: UserData
  assessor?: UserData
}

export default function AssessmentReports() {
  const [user, setUser] = useState<UserData | null>(null)
  const [assessments, setAssessments] = useState<AssessmentWithDetails[]>([])
  const [filteredAssessments, setFilteredAssessments] = useState<AssessmentWithDetails[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadAssessments()
  }, [])

  useEffect(() => {
    filterAssessments()
  }, [searchTerm, scoreFilter, assessments])

  const loadAssessments = async () => {
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

      // Get all FMS assessments for the station
      const { data: firefighters } = await supabase
        .from('users')
        .select('id')
        .eq('station_id', userData.station_id)
        .eq('role', 'firefighter')

      if (firefighters) {
        const { data: assessmentsData } = await supabase
          .from('fms_scores')
          .select('*')
          .in('user_id', firefighters.map(f => f.id))
          .order('created_at', { ascending: false })

        if (assessmentsData) {
          // Get user and assessor details
          const enhancedAssessments = await Promise.all(
            assessmentsData.map(async (assessment) => {
              const { data: assessedUser } = await supabase
                .from('users')
                .select('*')
                .eq('id', assessment.user_id)
                .single()

              const { data: assessor } = await supabase
                .from('users')
                .select('*')
                .eq('id', assessment.assessed_by)
                .single()

              return {
                ...assessment,
                user: assessedUser,
                assessor: assessor
              }
            })
          )

          setAssessments(enhancedAssessments)
          setFilteredAssessments(enhancedAssessments)
        }
      }

    } catch (error) {
      console.error('Error loading assessments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAssessments = () => {
    let filtered = assessments

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.user?.badge_number?.includes(searchTerm)
      )
    }

    // Score filter
    if (scoreFilter !== 'all') {
      filtered = filtered.filter(a => {
        if (scoreFilter === 'high' && a.total_score >= 17) return true
        if (scoreFilter === 'medium' && a.total_score >= 14 && a.total_score < 17) return true
        if (scoreFilter === 'low' && a.total_score < 14) return true
        return false
      })
    }

    setFilteredAssessments(filtered)
  }

  const getScoreColor = (score: number) => {
    if (score >= 17) return 'text-green-400'
    if (score >= 14) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 17) return { text: 'Low Risk', className: 'bg-green-500/20 text-green-400 border-green-500/30' }
    if (score >= 14) return { text: 'Moderate Risk', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }
    return { text: 'High Risk', className: 'bg-red-500/20 text-red-400 border-red-500/30' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-fire-gold animate-pulse mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Assessment Reports...</h2>
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
                <h1 className="text-base sm:text-xl font-bold text-white">FMS Assessment Reports</h1>
                <p className="text-xs sm:text-sm text-gray-400">{assessments.length} total assessments</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Filters */}
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
                  variant={scoreFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScoreFilter('all')}
                  className={scoreFilter === 'all' ? 'bg-fire-gold text-black hover:bg-yellow-600' : 'bg-black/50 text-white border-white/30 hover:bg-white/20 hover:border-white/50'}
                >
                  All Scores
                </Button>
                <Button
                  variant={scoreFilter === 'high' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScoreFilter('high')}
                  className={scoreFilter === 'high' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-black/50 text-white border-white/30 hover:bg-white/20 hover:border-white/50'}
                >
                  High (17+)
                </Button>
                <Button
                  variant={scoreFilter === 'medium' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScoreFilter('medium')}
                  className={scoreFilter === 'medium' ? 'bg-yellow-600 text-white hover:bg-yellow-700' : 'bg-black/50 text-white border-white/30 hover:bg-white/20 hover:border-white/50'}
                >
                  Medium (14-16)
                </Button>
                <Button
                  variant={scoreFilter === 'low' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScoreFilter('low')}
                  className={scoreFilter === 'low' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-black/50 text-white border-white/30 hover:bg-white/20 hover:border-white/50'}
                >
                  Low (&lt;14)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessments List */}
        <div className="grid gap-4">
          {filteredAssessments.length > 0 ? (
            filteredAssessments.map((assessment) => {
              const scoreBadge = getScoreBadge(assessment.total_score)
              return (
                <Card key={assessment.id} className="bg-white/5 border-white/10 hover:border-white/20 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <h3 className="text-white font-medium">{assessment.user?.name || 'Unknown'}</h3>
                          <Badge variant="outline" className="text-xs border-white/20">
                            Badge #{assessment.user?.badge_number || 'N/A'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {assessment.assessed_date && new Date(assessment.assessed_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Assessed by: {assessment.assessor?.name || 'Unknown'}
                          </span>
                        </div>
                        {assessment.notes && (
                          <p className="text-xs text-gray-500 mt-2 italic">Notes: {assessment.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className={`text-3xl font-bold ${getScoreColor(assessment.total_score)}`}>
                            {assessment.total_score}
                          </p>
                          <p className="text-xs text-gray-400">out of 21</p>
                        </div>
                        <div>
                          <Badge className={scoreBadge.className}>
                            {scoreBadge.text}
                          </Badge>
                        </div>
                        <Link href={`/chief/assessment/review/${assessment.id}`}>
                          <Button size="sm" variant="outline" className="bg-black/50 text-white border-white/30 hover:bg-white/20 hover:border-white/50">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs text-gray-400 mb-2">Movement Scores:</p>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Squat</p>
                          <p className="text-sm font-semibold text-white">{assessment.deep_squat}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Hurdle</p>
                          <p className="text-sm font-semibold text-white">
                            {Math.min(assessment.hurdle_step_left, assessment.hurdle_step_right)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Lunge</p>
                          <p className="text-sm font-semibold text-white">
                            {Math.min(assessment.inline_lunge_left, assessment.inline_lunge_right)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Shoulder</p>
                          <p className="text-sm font-semibold text-white">
                            {Math.min(assessment.shoulder_mobility_left, assessment.shoulder_mobility_right)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">ASLR</p>
                          <p className="text-sm font-semibold text-white">
                            {Math.min(assessment.leg_raise_left, assessment.leg_raise_right)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Trunk</p>
                          <p className="text-sm font-semibold text-white">{assessment.trunk_stability}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Rotary</p>
                          <p className="text-sm font-semibold text-white">
                            {Math.min(assessment.rotary_stability_left, assessment.rotary_stability_right)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No assessments found</p>
                <p className="text-xs text-gray-500 mt-2">
                  {searchTerm || scoreFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Contact your PT to schedule assessments'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary Stats */}
        {assessments.length > 0 && (
          <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 mt-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Assessment Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{assessments.length}</p>
                  <p className="text-xs text-gray-400">Total Assessments</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">
                    {assessments.filter(a => a.total_score >= 17).length}
                  </p>
                  <p className="text-xs text-gray-400">Low Risk</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">
                    {assessments.filter(a => a.total_score >= 14 && a.total_score < 17).length}
                  </p>
                  <p className="text-xs text-gray-400">Moderate Risk</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-400">
                    {assessments.filter(a => a.total_score < 14).length}
                  </p>
                  <p className="text-xs text-gray-400">High Risk</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}