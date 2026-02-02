'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AnimatedCard, AnimatedCardContent } from '@/components/ui/animated-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Shield, FileText, ChevronLeft, Search, Filter,
  Calendar, TrendingUp, AlertTriangle, User, Clock,
  ChevronDown, ChevronUp, Target, Star, CheckCircle, Activity
} from 'lucide-react'
import { Database } from '@/types/database'
import { getRiskLevel, getRiskBadgeClasses, getRiskLabel, getRiskTextColor, RISK_THRESHOLDS } from '@/lib/utils/fms'

type UserData = Database['public']['Tables']['users']['Row']
type FMSScoreData = Database['public']['Tables']['fms_scores']['Row']
type SeriesData = Database['public']['Tables']['series']['Row']

interface AssessmentWithDetails extends FMSScoreData {
  user?: UserData
  assessor?: UserData
}

interface SeriesWithExerciseCount extends SeriesData {
  exerciseCount?: number
}

export default function AssessmentReports() {
  const [user, setUser] = useState<UserData | null>(null)
  const [assessments, setAssessments] = useState<AssessmentWithDetails[]>([])
  const [filteredAssessments, setFilteredAssessments] = useState<AssessmentWithDetails[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'moderate' | 'low'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [availableSeries, setAvailableSeries] = useState<SeriesWithExerciseCount[]>([])
  const [loadingSeries, setLoadingSeries] = useState(false)
  const [assigningSeries, setAssigningSeries] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadAssessments()
  }, [])

  useEffect(() => {
    filterAssessments()
  }, [searchTerm, scoreFilter, assessments])

  useEffect(() => {
    if (expandedId) {
      loadSeriesOptions(expandedId)
    }
  }, [expandedId])

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
        .in('role', ['firefighter', 'chief'])

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

  const loadSeriesOptions = async (assessmentId: string) => {
    setLoadingSeries(true)
    try {
      const assessment = assessments.find(a => a.id === assessmentId)
      if (!assessment) return

      // Get all available series
      const { data: seriesData } = await supabase
        .from('series')
        .select('*')
        .order('name')

      if (seriesData) {
        // Get weak areas from assessment
        const weakAreas = (assessment.weak_areas as any)?.areas || []

        // DEMO MODE: Always prioritize Bulletproof Shoulder Program first
        const sortedSeries = seriesData.sort((a, b) => {
          // Always put Bulletproof Shoulder Program at the top
          if (a.name === 'Bulletproof Shoulder Program') return -1
          if (b.name === 'Bulletproof Shoulder Program') return 1

          // Then sort by relevance to weak areas
          const aMatches = weakAreas.some((area: string) =>
            a.target_area?.toLowerCase().includes(area.replace('_', ' ').toLowerCase()) ||
            a.name.toLowerCase().includes(area.replace('_', ' ').toLowerCase())
          )
          const bMatches = weakAreas.some((area: string) =>
            b.target_area?.toLowerCase().includes(area.replace('_', ' ').toLowerCase()) ||
            b.name.toLowerCase().includes(area.replace('_', ' ').toLowerCase())
          )

          if (aMatches && !bMatches) return -1
          if (!aMatches && bMatches) return 1
          return 0
        })

        setAvailableSeries(sortedSeries)
      }
    } catch (error) {
      console.error('Error loading series:', error)
    } finally {
      setLoadingSeries(false)
    }
  }

  const handleAssignSeries = async (seriesId: string, userId: string) => {
    setAssigningSeries(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      // Check for existing active series
      const { data: existingAssignments } = await supabase
        .from('series_assignments')
        .select('id')
        .eq('user_id', userId)
        .eq('completed', false)
        .gte('end_date', new Date().toISOString().split('T')[0])

      if (existingAssignments && existingAssignments.length > 0) {
        const confirm = window.confirm('This person already has an active series. Do you want to replace it?')
        if (!confirm) {
          setAssigningSeries(false)
          return
        }

        // Mark existing as completed
        await supabase
          .from('series_assignments')
          .update({ completed: true })
          .in('id', existingAssignments.map(a => a.id))
      }

      // Create new series assignment
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 21) // 3-week program

      const { error } = await supabase
        .from('series_assignments')
        .insert({
          user_id: userId,
          series_id: seriesId,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          current_week: 1,
          completed: false,
          completion_percentage: 0
        })

      if (error) throw error

      alert('Series assigned successfully!')
      setExpandedId(null)
    } catch (error) {
      console.error('Error assigning series:', error)
      alert('Failed to assign series. Please try again.')
    } finally {
      setAssigningSeries(false)
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

    // Score filter - uses risk level (high risk = low score, low risk = high score)
    if (scoreFilter !== 'all') {
      filtered = filtered.filter(a => {
        const risk = getRiskLevel(a.total_score)
        if (scoreFilter === 'low' && risk === 'low') return true      // 18-21
        if (scoreFilter === 'moderate' && risk === 'moderate') return true  // 15-17
        if (scoreFilter === 'high' && risk === 'high') return true    // <15
        return false
      })
    }

    setFilteredAssessments(filtered)
  }

  const getScoreColor = (score: number) => getRiskTextColor(score)

  const getScoreBadge = (score: number) => ({
    text: getRiskLabel(score),
    className: getRiskBadgeClasses(score)
  })

  const getWeakAreas = (assessment: AssessmentWithDetails) => {
    return (assessment.weak_areas as any)?.areas || []
  }

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
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
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-black/30">
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
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name or badge number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={scoreFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScoreFilter('all')}
                  className={scoreFilter === 'all' ? 'bg-fire-gold text-black hover:bg-yellow-600' : 'bg-black/50 text-white border-white/30 hover:bg-black/40 hover:border-white/40'}
                >
                  All Scores
                </Button>
                <Button
                  variant={scoreFilter === 'high' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScoreFilter('high')}
                  className={scoreFilter === 'high' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-black/50 text-white border-white/30 hover:bg-black/40 hover:border-white/40'}
                >
                  High Risk (&lt;15)
                </Button>
                <Button
                  variant={scoreFilter === 'moderate' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScoreFilter('moderate')}
                  className={scoreFilter === 'moderate' ? 'bg-yellow-600 text-white hover:bg-yellow-700' : 'bg-black/50 text-white border-white/30 hover:bg-black/40 hover:border-white/40'}
                >
                  Moderate (15-17)
                </Button>
                <Button
                  variant={scoreFilter === 'low' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScoreFilter('low')}
                  className={scoreFilter === 'low' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-black/50 text-white border-white/30 hover:bg-black/40 hover:border-white/40'}
                >
                  Low Risk (18+)
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
              const isExpanded = expandedId === assessment.id
              const weakAreas = getWeakAreas(assessment)
              return (
                <Card
                  key={assessment.id}
                  className={`bg-white/5 border-white/10 transition-all duration-200 ${
                    isExpanded ? 'border-blue-500/50 bg-white/[0.07]' : 'hover:border-white/20 cursor-pointer'
                  }`}
                >
                  <CardContent className="p-0">
                    {/* Main Row - Clickable */}
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => toggleExpanded(assessment.id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <h3 className="text-white font-medium">{assessment.user?.name || 'Unknown'}</h3>
                            <Badge variant="outline" className="text-xs border-white/20">
                              Badge #{assessment.user?.badge_number || 'N/A'}
                            </Badge>
                            {assessment.user?.role === 'chief' && (
                              <Badge className="text-xs bg-fire-gold/20 text-fire-gold border-fire-gold/30">
                                Chief
                              </Badge>
                            )}
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
                          <div className="text-gray-400">
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Score Breakdown - Always Visible */}
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
                    </div>

                    {/* Expanded Section - FMS Details & Series Assignment */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-white/10">
                        <div className="grid md:grid-cols-2 gap-6 pt-4">
                          {/* Left Column - FMS Details */}
                          <div>
                            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                              <Activity className="h-4 w-4 text-blue-400" />
                              Assessment Details
                            </h4>

                            {/* Weak Areas */}
                            <div className="mb-4">
                              <p className="text-xs text-gray-400 mb-2">Weak Areas Identified:</p>
                              <div className="flex flex-wrap gap-1">
                                {weakAreas.length > 0 ? (
                                  weakAreas.map((area: string) => (
                                    <Badge
                                      key={area}
                                      className="bg-red-500/20 text-red-400 border-red-500/30"
                                    >
                                      {area.replace(/_/g, ' ')}
                                    </Badge>
                                  ))
                                ) : (
                                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                    No significant weaknesses
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Notes */}
                            {assessment.notes && (
                              <div className="bg-white/5 rounded-lg p-3">
                                <p className="text-xs text-gray-400 mb-1">Assessment Notes:</p>
                                <p className="text-sm text-white">{assessment.notes}</p>
                              </div>
                            )}

                            <Link href={`/chief/assessment/review/${assessment.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-4 bg-black/50 text-white border-white/30 hover:bg-black/40"
                              >
                                View Full Details
                              </Button>
                            </Link>
                          </div>

                          {/* Right Column - Series Assignment */}
                          <div>
                            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                              <Target className="h-4 w-4 text-fire-gold" />
                              Recommended Training Series
                            </h4>

                            {loadingSeries ? (
                              <div className="space-y-2">
                                <Skeleton className="h-16 w-full bg-white/10" />
                                <Skeleton className="h-16 w-full bg-white/10" />
                              </div>
                            ) : (
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {availableSeries.slice(0, 5).map((series, index) => {
                                  const isRecommended = index < 2 && weakAreas.length > 0
                                  return (
                                    <div
                                      key={series.id}
                                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-black/30 transition-colors"
                                    >
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium text-white">{series.name}</span>
                                          {isRecommended && (
                                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                              <Star className="h-2 w-2 mr-1" />
                                              Match
                                            </Badge>
                                          )}
                                          {series.series_type && (
                                            <Badge
                                              className={`text-xs ${
                                                series.series_type === 'rehab'
                                                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                                                  : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                              }`}
                                            >
                                              {series.series_type === 'rehab' ? 'Rehab' : 'S&C'}
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                          {series.target_area && `${series.target_area} • `}
                                          {series.days_per_week || 3}x/week • 3 weeks
                                        </p>
                                      </div>
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleAssignSeries(series.id, assessment.user_id)
                                        }}
                                        disabled={assigningSeries}
                                        className="bg-fire-red hover:bg-red-700 text-white text-xs"
                                      >
                                        {assigningSeries ? (
                                          <Activity className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <>
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Assign
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
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
                    {assessments.filter(a => getRiskLevel(a.total_score) === 'low').length}
                  </p>
                  <p className="text-xs text-gray-400">Low Risk (18-21)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">
                    {assessments.filter(a => getRiskLevel(a.total_score) === 'moderate').length}
                  </p>
                  <p className="text-xs text-gray-400">Moderate (15-17)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-400">
                    {assessments.filter(a => getRiskLevel(a.total_score) === 'high').length}
                  </p>
                  <p className="text-xs text-gray-400">High Risk (&lt;15)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
