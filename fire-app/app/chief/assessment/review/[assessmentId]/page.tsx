'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Shield, ArrowLeft, Target, Clock, Calendar, CheckCircle,
  Activity, AlertCircle
} from 'lucide-react'
import { Database } from '@/types/database'
import { getRiskTextColor, getRiskLabel } from '@/lib/utils/fms'

type FMSScoreData = Database['public']['Tables']['fms_scores']['Row']
type UserData = Database['public']['Tables']['users']['Row']
type SeriesData = Database['public']['Tables']['series']['Row']
type SeriesAssignmentData = Database['public']['Tables']['series_assignments']['Row']

interface AssessmentWithUser extends FMSScoreData {
  user: UserData
}

interface CurrentSeriesInfo {
  assignment: SeriesAssignmentData
  series: SeriesData
}

export default function ChiefAssessmentReview() {
  const [assessment, setAssessment] = useState<AssessmentWithUser | null>(null)
  const [currentSeries, setCurrentSeries] = useState<CurrentSeriesInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [stationId, setStationId] = useState<string | null>(null)

  const router = useRouter()
  const params = useParams()
  const assessmentId = params.assessmentId as string
  const supabase = createClient()

  useEffect(() => {
    loadAssessmentData()
  }, [assessmentId])

  const loadAssessmentData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      // Get the chief's station_id for the back button
      const { data: chiefData } = await supabase
        .from('users')
        .select('station_id')
        .eq('id', authUser.id)
        .single()

      if (chiefData?.station_id) {
        setStationId(chiefData.station_id)
      }

      // Get assessment with user info
      const { data: assessmentData, error } = await supabase
        .from('fms_scores')
        .select(`
          *,
          user:user_id (*)
        `)
        .eq('id', assessmentId)
        .single()

      if (error || !assessmentData) {
        console.error('Error fetching assessment:', error)
        router.push('/chief/analytics')
        return
      }

      setAssessment({
        ...assessmentData,
        user: assessmentData.user as UserData
      })

      // Get the user's current active series assignment
      const { data: assignmentData } = await supabase
        .from('series_assignments')
        .select(`
          *,
          series:series_id (*)
        `)
        .eq('user_id', assessmentData.user_id)
        .eq('completed', false)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (assignmentData && assignmentData.series) {
        setCurrentSeries({
          assignment: assignmentData,
          series: assignmentData.series as SeriesData
        })
      }
    } catch (error) {
      console.error('Error loading assessment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToAnalytics = () => {
    if (stationId) {
      router.push(`/chief/analytics?station=${stationId}`)
    } else {
      router.push('/chief/analytics')
    }
  }

  const getScoreColor = getRiskTextColor
  const getScoreLabel = getRiskLabel

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Target className="h-16 w-16 text-fire-gold animate-pulse mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Assessment...</h2>
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">Assessment not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToAnalytics}
              className="text-gray-400 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Analytics
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-fire-gold" />
              <h1 className="text-lg font-bold text-white">Assessment Review</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Assessment Summary */}
        <Card className="bg-white/5 border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-white">FMS Assessment Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Firefighter</p>
                <p className="text-xl font-bold text-white">{assessment.user.name}</p>
                <p className="text-sm text-gray-400">Badge #{assessment.user.badge_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Score</p>
                <p className={`text-3xl font-bold ${getScoreColor(assessment.total_score)}`}>
                  {assessment.total_score}/21
                </p>
                <p className={`text-sm ${getScoreColor(assessment.total_score)}`}>
                  {getScoreLabel(assessment.total_score)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Weak Areas</p>
                <div className="flex flex-wrap gap-1">
                  {((assessment.weak_areas as any)?.areas || []).map((area: string) => (
                    <Badge key={area} className="bg-red-500/20 text-red-400 border-red-500/30">
                      {area.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                  {((assessment.weak_areas as any)?.areas || []).length === 0 && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      No significant weaknesses
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {assessment.notes && (
              <div className="mt-4 p-3 bg-white/5 rounded-lg">
                <p className="text-sm text-gray-400">Assessment Notes:</p>
                <p className="text-white mt-1">{assessment.notes}</p>
              </div>
            )}

            {/* Individual Scores */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-sm text-gray-400 mb-3">Individual Scores</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <ScoreItem label="Deep Squat" score={assessment.deep_squat} />
                <ScoreItem label="Hurdle Step" score={assessment.hurdle_step} />
                <ScoreItem label="Inline Lunge" score={assessment.inline_lunge} />
                <ScoreItem label="Shoulder Mobility" score={assessment.shoulder_mobility} />
                <ScoreItem label="ASLR" score={assessment.active_straight_leg_raise} />
                <ScoreItem label="Trunk Stability" score={assessment.trunk_stability_pushup} />
                <ScoreItem label="Rotary Stability" score={assessment.rotary_stability} />
              </div>
            </div>

            {/* Assessment Date */}
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
              <Calendar className="h-4 w-4" />
              <span>Assessed on {new Date(assessment.assessment_date).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Current Series Assignment */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Current Training Series</CardTitle>
          </CardHeader>
          <CardContent>
            {currentSeries ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{currentSeries.series.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{currentSeries.series.description}</p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Current Week</p>
                    <p className="text-lg font-bold text-white">
                      Week {currentSeries.assignment.current_week} of {currentSeries.series.duration_weeks || 3}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Progress</p>
                    <p className="text-lg font-bold text-fire-gold">
                      {currentSeries.assignment.completion_percentage || 0}%
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Points Earned</p>
                    <p className="text-lg font-bold text-fire-gold">
                      {currentSeries.assignment.points_earned || 0}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    <span>{currentSeries.series.target_area}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{currentSeries.series.duration_weeks} weeks</span>
                  </div>
                  <Badge variant="outline" className="border-white/20">
                    {currentSeries.series.difficulty_level}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-400 pt-2 border-t border-white/10">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Started {new Date(currentSeries.assignment.start_date).toLocaleDateString()} •
                    Ends {new Date(currentSeries.assignment.end_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No active training series assigned</p>
                <p className="text-sm text-gray-500 mt-1">
                  This firefighter has not been assigned a training series yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ScoreItem({ label, score }: { label: string; score: number }) {
  const getScoreColorClass = (score: number) => {
    if (score >= 3) return 'text-green-400'
    if (score === 2) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="bg-white/5 rounded-lg p-2 text-center">
      <p className="text-xs text-gray-400 truncate">{label}</p>
      <p className={`text-lg font-bold ${getScoreColorClass(score)}`}>{score}</p>
    </div>
  )
}
