'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AnimatedCard, AnimatedCardContent } from '@/components/ui/animated-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import confetti from 'canvas-confetti'
import {
  Flame, Trophy, Target, CheckCircle, ChevronLeft, Clock,
  Repeat, Activity, Video, Award, Star, Zap
} from 'lucide-react'
import { Database } from '@/types/database'
import {
  getLocalToday, getSessionsCompleted, getCurrentStage,
  TOTAL_SESSIONS,
  type StageExerciseMap, type CompletionRecord
} from '@/lib/utils/session'

type ExerciseData = Database['public']['Tables']['exercises']['Row']
type UserData = Database['public']['Tables']['users']['Row']
type SeriesAssignmentData = Database['public']['Tables']['series_assignments']['Row']
type SeriesExerciseData = Database['public']['Tables']['series_exercises']['Row']

interface ExerciseWithSeries extends ExerciseData {
  series_assignment?: SeriesAssignmentData
  series_exercise?: SeriesExerciseData
  sets_display: number
  reps_display: number | null
}

export default function ExerciseDetailPage() {
  const [exercise, setExercise] = useState<ExerciseWithSeries | null>(null)
  const [user, setUser] = useState<UserData | null>(null)
  const [completedToday, setCompletedToday] = useState(false)
  const [pointsEarned, setPointsEarned] = useState(0)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)

  const router = useRouter()
  const params = useParams()
  const exerciseId = params.id as string
  const supabase = createClient()

  useEffect(() => {
    loadExerciseData()
  }, [exerciseId])

  const loadExerciseData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      // Get user profile
      const { data: userData } = await supabase
        .from('users')
        .select('id, name, role, points, current_streak, longest_streak, last_activity_date, email, badge_number, station_id, created_at, updated_at')
        .eq('id', authUser.id)
        .single()

      if (!userData) {
        router.push('/auth/login')
        return
      }

      setUser(userData)

      // Get exercise details
      const { data: exerciseData } = await supabase
        .from('exercises')
        .select('id, name, description, instructions, video_url, thumbnail_url, sets, reps, duration_seconds, category, equipment_needed, tags, created_at, updated_at')
        .eq('id', exerciseId)
        .single()

      if (!exerciseData) {
        router.push('/firefighter')
        return
      }

      // Get current series assignment if exists
      const today = getLocalToday()

      const { data: seriesAssignment } = await supabase
        .from('series_assignments')
        .select('id, user_id, series_id, current_week, completed, completion_percentage, start_date, end_date, points_earned, assigned_by, fms_score_id, created_at, updated_at')
        .eq('user_id', authUser.id)
        .eq('completed', false)
        .gte('end_date', today)
        .single()

      let exerciseWithSeries: ExerciseWithSeries = {
        ...exerciseData,
        sets_display: exerciseData.sets || 3,
        reps_display: exerciseData.reps
      }

      if (seriesAssignment) {
        // Fetch all series_exercises and completions to derive current stage
        const { data: allSeriesExercises } = await supabase
          .from('series_exercises')
          .select('id, series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps, custom_duration')
          .eq('series_id', seriesAssignment.series_id)

        const { data: allCompletions } = await supabase
          .from('exercise_completions')
          .select('exercise_id, completed_date')
          .eq('series_assignment_id', seriesAssignment.id)

        if (allSeriesExercises) {
          // Build stage exercise map and derive current stage
          const stageExerciseMap: StageExerciseMap = { 1: [], 2: [], 3: [] }
          for (const se of allSeriesExercises) {
            const stageNum = se.week_number as 1 | 2 | 3
            if (stageExerciseMap[stageNum]) {
              stageExerciseMap[stageNum].push(se.exercise_id)
            }
          }

          const completions: CompletionRecord[] = (allCompletions || []).map(c => ({
            exercise_id: c.exercise_id,
            completed_date: c.completed_date
          }))

          const sessions = getSessionsCompleted(completions, stageExerciseMap)
          const currentStage = getCurrentStage(sessions)

          // Find the series_exercise for this exercise in the current stage
          const seriesExercise = allSeriesExercises.find(
            se => se.exercise_id === exerciseId && se.week_number === currentStage.number
          )

          if (seriesExercise) {
            exerciseWithSeries = {
              ...exerciseData,
              series_assignment: seriesAssignment,
              series_exercise: seriesExercise,
              sets_display: seriesExercise.custom_sets || exerciseData.sets || 3,
              reps_display: seriesExercise.custom_reps || exerciseData.reps
            }
          }
        }
      }

      setExercise(exerciseWithSeries)

      // Check if already completed today
      const { data: todayCompletion } = await supabase
        .from('exercise_completions')
        .select('id, points_awarded')
        .eq('user_id', authUser.id)
        .eq('exercise_id', exerciseId)
        .eq('completed_date', today)
        .single()

      if (todayCompletion) {
        setCompletedToday(true)
        setPointsEarned(todayCompletion.points_awarded || 0)
      }
    } catch (error) {
      // Error loading exercise
    } finally {
      setLoading(false)
    }
  }

  const triggerCelebration = () => {
    // Fire confetti from multiple angles
    const count = 200
    const defaults = {
      origin: { y: 0.7 },
      colors: ['#dc2626', '#facc15', '#ef4444', '#fbbf24', '#f87171']
    }

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      })
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    })
    fire(0.2, {
      spread: 60,
    })
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    })
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    })
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    })
  }

  const handleCompleteExercise = async () => {
    if (!exercise || !user || completing) return

    setCompleting(true)
    try {
      const today = getLocalToday()
      const todayDate = new Date(today + 'T00:00:00')
      todayDate.setDate(todayDate.getDate() - 1)
      const yesterday = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`

      // Check if this is the first completion today
      const { data: todayCompletions } = await supabase
        .from('exercise_completions')
        .select('id')
        .eq('user_id', user.id)
        .eq('exercise_id', exerciseId)
        .eq('completed_date', today)

      const isFirstToday = !todayCompletions || todayCompletions.length === 0
      const points = isFirstToday ? 10 : 0

      // Insert completion record — store stage number (from series_exercise.week_number)
      await supabase
        .from('exercise_completions')
        .insert({
          user_id: user.id,
          exercise_id: exerciseId,
          series_assignment_id: exercise.series_assignment?.id,
          week_number: exercise.series_exercise?.week_number || exercise.series_assignment?.current_week,
          completed_date: today,
          points_awarded: points
        })

      // Update user points if first completion
      if (points > 0) {
        await supabase
          .from('users')
          .update({ points: user.points + points })
          .eq('id', user.id)

        setUser(prev => prev ? { ...prev, points: prev.points + points } : null)
      }

      // Update streak
      const { data: yesterdayAnyCompletion } = await supabase
        .from('exercise_completions')
        .select('id')
        .eq('user_id', user.id)
        .eq('completed_date', yesterday)
        .limit(1)
        .single()

      const newStreak = yesterdayAnyCompletion ? user.current_streak + 1 : 1
      const newLongest = Math.max(newStreak, user.longest_streak)

      await supabase
        .from('users')
        .update({
          current_streak: newStreak,
          longest_streak: newLongest,
          last_activity_date: today
        })
        .eq('id', user.id)

      setUser(prev => prev ? {
        ...prev,
        current_streak: newStreak,
        longest_streak: newLongest,
        last_activity_date: today
      } : null)

      // Check for achievements
      await checkAndAwardAchievements(newStreak, user.points + points)

      // Update series completion percentage if applicable
      if (exercise.series_assignment) {
        await updateSeriesProgress(exercise.series_assignment)
      }

      setCompletedToday(true)
      setPointsEarned(points)

      // Trigger celebration if points earned
      if (points > 0) {
        triggerCelebration()
      }
    } catch (error) {
      // Error completing exercise
    } finally {
      setCompleting(false)
    }
  }

  const checkAndAwardAchievements = async (currentStreak: number, totalPoints: number) => {
    try {
      // Get all achievements
      const { data: achievements } = await supabase
        .from('achievements')
        .select('id, name, description, icon, points_required, type')

      if (!achievements) return

      // Get user's existing achievements
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', user!.id)

      const earnedIds = new Set(userAchievements?.map(ua => ua.achievement_id))

      // Check for new achievements
      const newAchievements = []

      for (const achievement of achievements) {
        if (earnedIds.has(achievement.id)) continue

        let earned = false

        if (achievement.type === 'streak') {
          if (currentStreak === 1 && achievement.name === 'First Steps') earned = true
          if (currentStreak === 7 && achievement.name === 'Week Warrior') earned = true
          if (currentStreak === 14 && achievement.name === 'Two Week Champion') earned = true
          if (currentStreak === 30 && achievement.name === 'Fire Brigade Elite') earned = true
        } else if (achievement.type === 'points') {
          if (totalPoints >= (achievement.points_required || 0)) earned = true
        }

        if (earned) {
          newAchievements.push({
            user_id: user!.id,
            achievement_id: achievement.id
          })
        }
      }

      // Award new achievements
      if (newAchievements.length > 0) {
        await supabase
          .from('user_achievements')
          .insert(newAchievements)
      }
    } catch (error) {
      // Error checking achievements
    }
  }

  const updateSeriesProgress = async (seriesAssignment: SeriesAssignmentData) => {
    try {
      // Fetch all series_exercises and all completions to derive session count
      const { data: allSeriesExercises } = await supabase
        .from('series_exercises')
        .select('exercise_id, week_number')
        .eq('series_id', seriesAssignment.series_id)

      const { data: allCompletions } = await supabase
        .from('exercise_completions')
        .select('exercise_id, completed_date')
        .eq('series_assignment_id', seriesAssignment.id)

      if (!allSeriesExercises) return

      // Build stage exercise map
      const stageExerciseMap: StageExerciseMap = { 1: [], 2: [], 3: [] }
      for (const se of allSeriesExercises) {
        const stageNum = se.week_number as 1 | 2 | 3
        if (stageExerciseMap[stageNum]) {
          stageExerciseMap[stageNum].push(se.exercise_id)
        }
      }

      const completions: CompletionRecord[] = (allCompletions || []).map(c => ({
        exercise_id: c.exercise_id,
        completed_date: c.completed_date
      }))

      const sessions = getSessionsCompleted(completions, stageExerciseMap)
      const currentStage = getCurrentStage(sessions)
      const completionPercentage = Math.round((sessions / TOTAL_SESSIONS) * 100)
      const isComplete = sessions >= TOTAL_SESSIONS

      await supabase
        .from('series_assignments')
        .update({
          completion_percentage: completionPercentage,
          current_week: currentStage.number,
          completed: isComplete
        })
        .eq('id', seriesAssignment.id)
    } catch (error) {
      // Error updating series progress
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-16 w-16 text-fire-red animate-pulse mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Exercise...</h2>
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    )
  }

  if (!exercise || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">Exercise not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link href="/firefighter">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-black/30 p-2 sm:px-3"
              >
                <ChevronLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-fire-red" />
              <h1 className="text-base sm:text-lg font-bold text-white">Exercise</h1>
            </div>
            <div className="text-right">
              <p className="text-xs sm:text-sm font-medium text-white">{user.points} pts</p>
              <p className="text-xs text-gray-400 hidden sm:block">
                <Flame className="inline h-3 w-3" />
                {user.current_streak} streak
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        {/* Exercise Header */}
        <AnimatedCard className="bg-white/5 border-white/10 mb-4 sm:mb-6">
          <AnimatedCardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">{exercise.name}</h1>
                {exercise.category && (
                  <Badge className="bg-fire-gold/20 text-fire-gold border-fire-gold/30 text-xs">
                    {exercise.category}
                  </Badge>
                )}
              </div>
              {completedToday && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs sm:text-sm">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>

            {exercise.description && (
              <p className="text-gray-400 mb-4">{exercise.description}</p>
            )}

            {/* Exercise Parameters */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="text-center p-3 sm:p-4 bg-white/5 rounded-lg">
                <Repeat className="h-5 w-5 sm:h-6 sm:w-6 text-fire-gold mx-auto mb-1 sm:mb-2" />
                <p className="text-lg sm:text-2xl font-bold text-white">{exercise.sets_display}</p>
                <p className="text-xs sm:text-sm text-gray-400">Sets</p>
              </div>

              {exercise.reps_display ? (
                <div className="text-center p-3 sm:p-4 bg-white/5 rounded-lg">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 mx-auto mb-1 sm:mb-2" />
                  <p className="text-lg sm:text-2xl font-bold text-white">{exercise.reps_display}</p>
                  <p className="text-xs sm:text-sm text-gray-400">Reps</p>
                </div>
              ) : exercise.duration_seconds ? (
                <div className="text-center p-3 sm:p-4 bg-white/5 rounded-lg">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 mx-auto mb-1 sm:mb-2" />
                  <p className="text-lg sm:text-2xl font-bold text-white">{exercise.duration_seconds}s</p>
                  <p className="text-xs sm:text-sm text-gray-400">Duration</p>
                </div>
              ) : (
                <div className="text-center p-3 sm:p-4 bg-white/5 rounded-lg">
                  <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 mx-auto mb-1 sm:mb-2" />
                  <p className="text-lg sm:text-2xl font-bold text-white">-</p>
                  <p className="text-xs sm:text-sm text-gray-400">Time</p>
                </div>
              )}

              <div className="text-center p-3 sm:p-4 bg-white/5 rounded-lg">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-fire-red mx-auto mb-1 sm:mb-2" />
                <p className="text-lg sm:text-2xl font-bold text-white">
                  {completedToday ? pointsEarned : 10}
                </p>
                <p className="text-xs sm:text-sm text-gray-400">Points</p>
              </div>
            </div>

            {exercise.equipment_needed && exercise.equipment_needed !== 'None' && (
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-400">
                  <Zap className="inline h-4 w-4 mr-2" />
                  Equipment needed: {exercise.equipment_needed}
                </p>
              </div>
            )}
          </AnimatedCardContent>
        </AnimatedCard>

        {/* Instructions */}
        {exercise.instructions && (
          <Card className="bg-white/5 border-white/10 mb-6">
            <CardHeader>
              <CardTitle className="text-white">How to Perform</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 leading-relaxed">{exercise.instructions}</p>
            </CardContent>
          </Card>
        )}

        {/* Video Section */}
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardContent className="p-4">
            {exercise.video_url ? (
              exercise.video_url.includes('youtu') ? (
                <div className="aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src={`${exercise.video_url.replace('youtu.be/', 'www.youtube-nocookie.com/embed/').replace('youtube.com/watch?v=', 'youtube-nocookie.com/embed/')}?rel=0&modestbranding=1&showinfo=0&iv_load_policy=3`}
                    title={`${exercise.name} demonstration`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                  <video
                    src={exercise.video_url}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-contain"
                    title={`${exercise.name} demonstration`}
                  />
                </div>
              )
            ) : (
              <div className="aspect-video bg-black/50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Video className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">Video demonstration coming soon</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completion Button */}
        {!completedToday ? (
          <Button
            onClick={handleCompleteExercise}
            disabled={completing}
            className="w-full h-14 text-lg bg-fire-red hover:bg-red-700 text-white"
          >
            {completing ? (
              <>
                <Activity className="h-5 w-5 mr-2 animate-spin" />
                Completing...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Complete Exercise (+10 Points)
              </>
            )}
          </Button>
        ) : (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <div>
                  <p className="font-semibold text-white">Exercise Completed!</p>
                  <p className="text-sm text-gray-400">
                    {pointsEarned > 0 ? `You earned ${pointsEarned} points!` : 'Already completed today'}
                  </p>
                </div>
              </div>
              {pointsEarned > 0 && (
                <Badge className="bg-fire-gold/20 text-fire-gold border-fire-gold/30">
                  +{pointsEarned} pts
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Motivational Message */}
        <Card className="bg-gradient-to-r from-fire-red/20 to-fire-gold/20 border-fire-red/30 mt-6">
          <CardContent className="p-6 text-center">
            <Star className="h-8 w-8 text-fire-gold mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">Keep Going, {user?.name?.split(' ')[0] || 'Firefighter'}!</p>
            <p className="text-sm text-gray-300">
              Every rep makes you stronger. Every exercise keeps you ready.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}