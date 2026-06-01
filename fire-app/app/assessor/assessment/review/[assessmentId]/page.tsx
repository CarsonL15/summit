'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AnimatedCard, AnimatedCardContent, AnimatedCardHeader, AnimatedCardTitle } from '@/components/ui/animated-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Activity, ArrowLeft, CheckCircle, Target, Clock, Star, Calendar, Dumbbell, ClipboardCheck, UserCheck
} from 'lucide-react'
import { Database } from '@/types/database'
import { getRiskLevel, getRiskTextColor, getRiskLabel } from '@/lib/utils/fms'

type FMSScoreData = Database['public']['Tables']['fms_scores']['Row']
type UserData = Database['public']['Tables']['users']['Row']
type SeriesData = Database['public']['Tables']['series']['Row']
type ExerciseData = Database['public']['Tables']['exercises']['Row']

interface AssessmentWithUser extends FMSScoreData {
  user: UserData
}

interface SeriesWithExercises extends SeriesData {
  exercises: Record<number, ExerciseData[]>
}

export default function AssessorSeriesAssignmentReview() {
  const [assessment, setAssessment] = useState<AssessmentWithUser | null>(null)
  const [availableSeries, setAvailableSeries] = useState<SeriesData[]>([])
  const [selectedSeries, setSelectedSeries] = useState<string>('')
  const [seriesExercises, setSeriesExercises] = useState<SeriesWithExercises | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const router = useRouter()
  const params = useParams()
  const assessmentId = params.assessmentId as string
  const supabase = createClient()

  useEffect(() => {
    loadAssessmentData()
  }, [assessmentId])

  useEffect(() => {
    if (selectedSeries) {
      loadSeriesExercises(selectedSeries)
    }
  }, [selectedSeries])

  const loadAssessmentData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      // Verify assessor role
      const { data: assessorUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single()

      if (!assessorUser || (assessorUser.role !== 'assessor' && assessorUser.role !== 'admin')) {
        router.push('/assessor')
        return
      }

      // Get assessment with user info
      const { data: assessmentData, error } = await supabase
        .from('fms_scores')
        .select(`
          *,
          user:user_id (*)
        `)
        .eq('id', assessmentId)
        .single() as { data: any; error: any }

      if (error || !assessmentData) {
        router.push('/assessor')
        return
      }

      setAssessment({
        ...assessmentData,
        user: assessmentData.user as UserData
      })

      // Load available series based on weak areas
      const weakAreas = (assessmentData.weak_areas as any)?.areas || []

      const { data: seriesData } = await supabase
        .from('series')
        .select('id, name, description, target_area, difficulty_level, series_type, days_per_week, duration_weeks, created_at, updated_at')
        .order('name')

      if (seriesData) {
        // Sort series by relevance: count how many weak areas each series matches
        const suggestedSeries = seriesData.sort((a, b) => {
          const aMatchCount = weakAreas.filter((area: string) =>
            a.target_area?.toLowerCase().includes(area.replace('_', ' ').toLowerCase()) ||
            a.name.toLowerCase().includes(area.replace('_', ' ').toLowerCase())
          ).length
          const bMatchCount = weakAreas.filter((area: string) =>
            b.target_area?.toLowerCase().includes(area.replace('_', ' ').toLowerCase()) ||
            b.name.toLowerCase().includes(area.replace('_', ' ').toLowerCase())
          ).length

          // More matches = higher priority
          if (bMatchCount !== aMatchCount) return bMatchCount - aMatchCount
          // Alphabetical tiebreaker
          return a.name.localeCompare(b.name)
        })

        setAvailableSeries(suggestedSeries)

        if (suggestedSeries.length > 0) {
          setSelectedSeries(suggestedSeries[0].id)
        }
      }
    } catch (error) {
      // Error loading assessment
    } finally {
      setLoading(false)
    }
  }

  const loadSeriesExercises = async (seriesId: string) => {
    try {
      const { data: seriesData, error: seriesError } = await supabase
        .from('series')
        .select('id, name, description, target_area, difficulty_level, series_type, days_per_week, duration_weeks, created_at, updated_at')
        .eq('id', seriesId)
        .single()

      if (seriesError || !seriesData) return

      const { data: seriesExercisesData, error: exercisesError } = await supabase
        .from('series_exercises')
        .select(`
          id, series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps, custom_duration,
          exercise:exercise_id (id, name, description, sets, reps, category)
        `)
        .eq('series_id', seriesId)
        .order('week_number')
        .order('order_in_week') as { data: any[] | null; error: any }

      if (exercisesError) {
        // Error fetching series exercises
      }

      const exercises: Record<number, ExerciseData[]> = {}
      const totalWeeks = seriesData.duration_weeks || 3

      for (let week = 1; week <= totalWeeks; week++) {
        exercises[week] = (seriesExercisesData || [])
          .filter(se => se.week_number === week)
          .map(se => se.exercise as ExerciseData)
          .filter(Boolean)
      }

      setSeriesExercises({
        ...seriesData,
        exercises
      })
    } catch (error) {
      // Error loading series exercises
    }
  }

  const handleAssignSeries = async () => {
    if (!selectedSeries || !assessment) return

    setSaving(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      // Check for existing active series
      const { data: existingAssignments } = await supabase
        .from('series_assignments')
        .select('id')
        .eq('user_id', assessment.user_id)
        .eq('completed', false)
        .gte('end_date', new Date().toISOString().split('T')[0])

      if (existingAssignments && existingAssignments.length > 0) {
        const confirm = window.confirm('This person already has an active series. Do you want to replace it?')
        if (!confirm) {
          setSaving(false)
          return
        }

        await supabase
          .from('series_assignments')
          .update({ completed: true })
          .in('id', existingAssignments.map(a => a.id))
      }

      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 21)

      const { error } = await supabase
        .from('series_assignments')
        .insert({
          user_id: assessment.user_id,
          series_id: selectedSeries,
          assigned_by: authUser?.id || null,
          fms_score_id: assessmentId,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          current_week: 1,
          completed: false,
          completion_percentage: 0
        })

      if (error) throw error

      // Send results email (fire and forget — don't block on it)
      if (assessment.user.email) {
        const weakAreas = ((assessment.weak_areas as any)?.areas || []).map((area: string) => {
          const labels: Record<string, string> = {
            deep_squat: 'Deep squat mobility restriction',
            hurdle_step: 'Stride mechanics and stepping stability',
            inline_lunge: 'Hip and trunk mobility limitation',
            shoulder_mobility: 'Shoulder mobility restriction',
            aslr: 'Hamstring and hip flexibility deficit',
            trunk_stability: 'Core stability deficit',
            rotary_stability: 'Rotary stability limitation',
          }
          return labels[area] || area.replace(/_/g, ' ')
        })

        const riskLevel = assessment.total_score >= 18 ? 'Low Risk'
          : assessment.total_score >= 15 ? 'Moderate'
          : 'High Risk'

        fetch('/api/email/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firefighterName: assessment.user.name,
            firefighterEmail: assessment.user.email,
            riskLevel,
            weakAreas,
            totalScore: assessment.total_score,
          }),
        }).catch(() => {})
      }

      // Show success interstitial instead of redirecting
      setShowSuccess(true)
    } catch (error) {
      alert('Failed to assign series. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getScoreColor = getRiskTextColor
  const getScoreLabel = getRiskLabel

  // Success interstitial - "Go see the doctor"
  if (showSuccess && assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="bg-white/5 border-white/10 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex p-4 bg-green-500/20 rounded-full mb-4">
                <CheckCircle className="h-16 w-16 text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Assessment Complete!</h2>
            <p className="text-gray-400 mb-6">
              Please direct <span className="text-white font-semibold">{assessment.user.name}</span> to the doctor for results review.
            </p>
            <Link href="/assessor">
              <Button className="bg-teal-600 hover:bg-teal-700 text-white w-full text-lg py-6">
                <ClipboardCheck className="h-5 w-5 mr-2" />
                Next Assessment
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Target className="h-16 w-16 text-teal-400 animate-pulse mx-auto mb-4" />
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
              onClick={() => router.push('/assessor')}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-6 w-6 text-teal-400" />
              <h1 className="text-lg font-bold text-white">Assign Training Series</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Assessment Summary */}
        <Card className="bg-white/5 border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-white">FMS Assessment Results</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Person Info */}
            <div className="flex items-center gap-3 mb-6">
              <div>
                <p className="text-sm text-gray-400">
                  {assessment.user.role === 'chief' ? 'Chief' : 'Firefighter'}
                </p>
                <p className="text-xl font-bold text-white">{assessment.user.name}</p>
                <p className="text-sm text-gray-400">Badge #{assessment.user.badge_number}</p>
              </div>
            </div>

            {/* Three Scores */}
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className={`p-4 rounded-lg border ${
                assessment.total_score >= 18 ? 'bg-green-500/10 border-green-500/30' :
                assessment.total_score >= 15 ? 'bg-yellow-500/10 border-yellow-500/30' :
                'bg-red-500/10 border-red-500/30'
              }`}>
                <p className="text-sm text-gray-400">FMS Score</p>
                <p className={`text-3xl font-bold ${getScoreColor(assessment.total_score)}`}>
                  {assessment.total_score}/21
                </p>
                <p className={`text-sm mt-1 ${getScoreColor(assessment.total_score)}`}>
                  {getScoreLabel(assessment.total_score)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-gray-400">Left Mobility</p>
                <p className="text-3xl font-bold text-white">
                  {assessment.left_mobility_score ?? '—'}/21
                </p>
                <p className="text-sm mt-1 text-gray-500">Raw left-side total</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-gray-400">Right Mobility</p>
                <p className="text-3xl font-bold text-white">
                  {assessment.right_mobility_score ?? '—'}/21
                </p>
                <p className="text-sm mt-1 text-gray-500">Raw right-side total</p>
              </div>
            </div>

            {/* Weak Areas */}
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Weak Areas</p>
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

            {/* Movement Breakdown */}
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-3">Movement Breakdown</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {[
                  { label: 'Overhead Squat', fms: assessment.deep_squat, rawL: assessment.deep_squat_raw, rawR: assessment.deep_squat_raw, bilateral: false, painL: assessment.deep_squat_pain_left, painR: assessment.deep_squat_pain_right },
                  { label: 'Hurdle Step', fms: assessment.hurdle_step, rawL: assessment.hurdle_step_left, rawR: assessment.hurdle_step_right, bilateral: true, painL: assessment.hurdle_step_pain_left, painR: assessment.hurdle_step_pain_right },
                  { label: 'Inline Lunge', fms: assessment.inline_lunge, rawL: assessment.inline_lunge_left, rawR: assessment.inline_lunge_right, bilateral: true, painL: assessment.inline_lunge_pain_left, painR: assessment.inline_lunge_pain_right, clearing: assessment.clearing_ankle, clearingLabel: 'Ankle' },
                  { label: 'Shoulder Mobility', fms: assessment.shoulder_mobility, rawL: assessment.shoulder_mobility_left, rawR: assessment.shoulder_mobility_right, bilateral: true, painL: assessment.shoulder_mobility_pain_left, painR: assessment.shoulder_mobility_pain_right, clearing: assessment.clearing_shoulder, clearingLabel: 'Shoulder' },
                  { label: 'ASLR', fms: assessment.aslr, rawL: assessment.aslr_left, rawR: assessment.aslr_right, bilateral: true, painL: assessment.aslr_pain_left, painR: assessment.aslr_pain_right },
                  { label: 'Trunk Stability', fms: assessment.trunk_stability, rawL: assessment.trunk_stability_raw, rawR: assessment.trunk_stability_raw, bilateral: false, painL: assessment.trunk_stability_pain_left, painR: assessment.trunk_stability_pain_right, clearing: assessment.clearing_extension, clearingLabel: 'Extension' },
                  { label: 'Rotary Stability', fms: assessment.rotary_stability, rawL: assessment.rotary_stability_left, rawR: assessment.rotary_stability_right, bilateral: true, painL: assessment.rotary_stability_pain_left, painR: assessment.rotary_stability_pain_right, clearing: assessment.clearing_flexion, clearingLabel: 'Flexion' },
                ].map((m) => {
                  const score = m.fms ?? 0
                  const scoreColor = score <= 1 ? 'text-red-400' : score === 2 ? 'text-yellow-400' : 'text-green-400'
                  const bgColor = score <= 1 ? 'bg-red-500/10 border-red-500/30' : score === 2 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-green-500/10 border-green-500/30'
                  const hasPain = m.painL || m.painR
                  const clearingFailed = m.clearing === false
                  return (
                    <div key={m.label} className={`p-3 rounded-lg border ${bgColor}`}>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-semibold text-white">{m.label}</h4>
                        <span className={`text-xl font-bold ${scoreColor}`}>{score}</span>
                      </div>
                      {m.rawL != null && (
                        <p className="text-xs text-gray-500">
                          {m.bilateral ? `L: ${m.rawL}  R: ${m.rawR}` : `Raw: ${m.rawL}`}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {hasPain && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                            Pain{m.painL && m.painR ? ' L+R' : m.painL ? ' L' : ' R'}
                          </span>
                        )}
                        {m.clearing !== undefined && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            clearingFailed ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                          }`}>
                            {m.clearingLabel} {clearingFailed ? 'Fail' : 'Pass'}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {assessment.notes && (
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-sm text-gray-400">Assessment Notes:</p>
                <p className="text-white mt-1">{assessment.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Series Selection */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Available Series */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Recommended Training Series</h2>
            <div className="space-y-3">
              {availableSeries.map((series, index) => {
                const isRecommended = index < 2 && ((assessment.weak_areas as any)?.areas || []).length > 0
                return (
                  <button
                    key={series.id}
                    onClick={() => setSelectedSeries(series.id)}
                    className={`w-full p-4 rounded-lg border text-left transition-colors ${
                      selectedSeries === series.id
                        ? 'bg-teal-500/20 border-teal-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-black/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-white">{series.name}</h3>
                          {isRecommended && (
                            <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">
                              <Star className="h-3 w-3 mr-1" />
                              Recommended
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
                        <p className="text-sm text-gray-400 mt-1">{series.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs flex-wrap">
                          <span className="text-gray-500">
                            <Clock className="inline h-3 w-3 mr-1" />
                            3 weeks
                          </span>
                          <span className="text-gray-500">
                            <Calendar className="inline h-3 w-3 mr-1" />
                            {series.days_per_week || 3}x/week
                          </span>
                          {series.target_area && (
                            <span className="text-gray-500">
                              <Target className="inline h-3 w-3 mr-1" />
                              {series.target_area}
                            </span>
                          )}
                          {series.difficulty_level && (
                            <Badge variant="outline" className="text-xs border-white/20">
                              {series.difficulty_level}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {selectedSeries === series.id && (
                        <CheckCircle className="h-5 w-5 text-teal-400 mt-1" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Series Preview */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Series Preview</h2>
            {seriesExercises ? (
              <Card className="bg-white/5 border-white/10 h-fit">
                <CardHeader>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <CardTitle className="text-white">{seriesExercises.name}</CardTitle>
                    {seriesExercises.series_type && (
                      <Badge
                        className={`text-xs ${
                          seriesExercises.series_type === 'rehab'
                            ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                            : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        }`}
                      >
                        {seriesExercises.series_type === 'rehab' ? `Rehab (${seriesExercises.days_per_week || 7} days/week)` : `S&C (${seriesExercises.days_per_week || 3}x/week)`}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-gray-400">
                    {seriesExercises.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col h-full">
                  <div className="flex-1 min-h-[400px] max-h-[600px] overflow-y-auto pr-2 scrollbar-dark mb-4">
                    {Object.entries(seriesExercises.exercises)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([weekNum, exercises]) => {
                        const weekNumber = Number(weekNum)
                        const weekLabels: Record<number, string> = {
                          1: 'Foundation',
                          2: 'Progression',
                          3: 'Integration',
                          4: 'Strength',
                          5: 'Power',
                          6: 'Endurance',
                          7: 'Peak',
                          8: 'Mastery'
                        }
                        return (
                          <div key={weekNum} className="mb-4">
                            <h4 className="text-sm font-semibold text-teal-400 mb-2">
                              Week {weekNumber}: {weekLabels[weekNumber] || `Phase ${weekNumber}`}
                            </h4>
                            <div className="space-y-2">
                              {exercises.slice(0, 4).map((exercise, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-sm">
                                  <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                                  <div className="flex-1">
                                    <span className="text-gray-300">{exercise.name}</span>
                                    {exercise.tags && exercise.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {exercise.tags.slice(0, 3).map((tag, tagIdx) => (
                                          <Badge
                                            key={tagIdx}
                                            variant="outline"
                                            className="text-xs bg-white/5 text-gray-400 border-white/10"
                                          >
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {exercises.length === 0 && (
                                <p className="text-gray-500 text-sm">No exercises configured</p>
                              )}
                              {exercises.length > 4 && (
                                <p className="text-gray-500 text-xs">+{exercises.length - 4} more exercises</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>

                  <Button
                    onClick={handleAssignSeries}
                    disabled={saving || !selectedSeries}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    {saving ? (
                      <>
                        <Activity className="h-4 w-4 mr-2 animate-spin" />
                        Assigning Series...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Assign Series to {assessment.user.name}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-8 text-center">
                  <Target className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Select a series to preview exercises</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
