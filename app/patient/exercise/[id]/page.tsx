'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import confetti from 'canvas-confetti'
import {
  ArrowLeft,
  Clock,
  Play,
  CheckCircle,
  Trophy,
  Flame,
  Target,
  Video,
  Repeat,
  Dumbbell
} from 'lucide-react'

interface ExerciseAssignment {
  id: string
  due_date: string
  phase: string
  exercises: {
    id: string
    name: string
    category: string
    description: string
    video_url: string | null
    duration_seconds: number
    sets: number
    reps: number
  }
  exercise_completions: {
    id: string
    completed_at: string
  }[]
}

export default function ExerciseDetailPage() {
  const [assignment, setAssignment] = useState<ExerciseAssignment | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [userProgress, setUserProgress] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchExerciseData()
  }, [params.id])

  const fetchExerciseData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get exercise assignment with exercise details
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('exercise_assignments')
        .select(`
          id,
          start_date,
          end_date,
          daily_target,
          phase,
          exercises (
            id,
            name,
            category,
            description,
            video_url,
            duration_seconds,
            sets,
            reps
          ),
          exercise_completions (
            id,
            completed_at
          )
        `)
        .eq('id', params.id)
        .eq('patient_id', user.id)
        .single()

      if (assignmentError || !assignmentData) {
        console.error('Error fetching assignment:', assignmentError)
        router.push('/patient')
        return
      }

      // Check if completed today
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)

      const todayCompletions = assignmentData.exercise_completions.filter(comp => {
        const completedDate = new Date(comp.completed_at)
        return completedDate >= todayStart && completedDate <= todayEnd
      })

      setAssignment(assignmentData as any)
      setIsCompleted(todayCompletions.length >= (assignmentData.daily_target || 1))

      // Get user progress
      const { data: progressData } = await supabase
        .from('patient_progress')
        .select('*')
        .eq('patient_id', user.id)
        .single()

      setUserProgress(progressData)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const triggerConfetti = () => {
    // Multiple bursts for extra celebration!
    const count = 200
    const defaults = {
      origin: { y: 0.7 }
    }

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
        spread: 90,
        scalar: 1.2,
      })
    }

    fire(0.25, { spread: 26, startVelocity: 55 })
    fire(0.2, { spread: 60 })
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
    fire(0.1, { spread: 120, startVelocity: 45 })
  }

  const calculateNewStreak = async (userId: string): Promise<number> => {
    // Get the last activity date
    const { data: progressData } = await supabase
      .from('patient_progress')
      .select('last_activity_date, streak_days')
      .eq('patient_id', userId)
      .single()

    if (!progressData) return 1

    const lastActivity = progressData.last_activity_date ? new Date(progressData.last_activity_date) : null
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (!lastActivity) return 1

    const lastActivityDate = new Date(lastActivity)
    lastActivityDate.setHours(0, 0, 0, 0)

    const daysDiff = Math.floor((today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff === 0) {
      // Same day, maintain streak
      return progressData.streak_days
    } else if (daysDiff === 1) {
      // Next day, increment streak
      return progressData.streak_days + 1
    } else {
      // Streak broken, restart
      return 1
    }
  }

  const handleCompleteExercise = async () => {
    if (!assignment) return

    setIsCompleting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if already completed today (but allow multiple if under daily target)
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)

      const { data: todayCompletions } = await supabase
        .from('exercise_completions')
        .select('*')
        .eq('assignment_id', assignment.id)
        .eq('patient_id', user.id)
        .gte('completed_at', todayStart.toISOString())
        .lte('completed_at', todayEnd.toISOString())

      const completionsToday = todayCompletions?.length || 0
      const dailyTarget = assignment.daily_target || 1

      // 1. Mark exercise as completed (allow multiple per day)
      const { error: completionError } = await supabase
        .from('exercise_completions')
        .insert({
          assignment_id: assignment.id,
          patient_id: user.id,
          completed_at: new Date().toISOString(),
        })

      if (completionError) {
        console.error('Completion error:', completionError)
        alert('Failed to mark exercise as complete')
        return
      }

      // 2. Calculate new streak
      const newStreak = await calculateNewStreak(user.id)

      // 3. Update patient progress (award points only on first completion of the day)
      const pointsEarned = completionsToday === 0 ? 10 : 0 // Points only for first completion
      const exerciseIncrement = completionsToday === 0 ? 1 : 0 // Count unique exercises per day

      const { error: progressError } = await supabase
        .from('patient_progress')
        .update({
          points: (userProgress?.points || 0) + pointsEarned,
          streak_days: newStreak,
          last_activity_date: new Date().toISOString().split('T')[0],
          total_exercises_completed: (userProgress?.total_exercises_completed || 0) + exerciseIncrement,
        })
        .eq('patient_id', user.id)

      if (progressError) {
        console.error('Progress error:', progressError)
      }

      // 4. Check for achievements
      const totalCompleted = (userProgress?.total_exercises_completed || 0) + 1

      // First exercise achievement
      if (totalCompleted === 1) {
        await supabase
          .from('achievements')
          .insert({
            patient_id: user.id,
            type: 'milestone',
            name: 'First Steps',
            description: 'Completed your first exercise!',
            earned_at: new Date().toISOString(),
          })
      }

      // Streak achievements
      if (newStreak === 7) {
        await supabase
          .from('achievements')
          .insert({
            patient_id: user.id,
            type: 'streak',
            name: 'Week Warrior',
            description: 'Maintained a 7-day streak!',
            earned_at: new Date().toISOString(),
          })
      }

      // 5. Trigger celebration
      triggerConfetti()
      setIsCompleted(true)

      // 6. Show success and redirect after delay
      setTimeout(() => {
        alert(`Great job! You earned ${pointsEarned} points! 🎉\n\nStreak: ${newStreak} days`)
        router.push('/patient')
      }, 2000)

    } catch (error) {
      console.error('Error completing exercise:', error)
      alert('An error occurred while completing the exercise')
    } finally {
      setIsCompleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading exercise...</h2>
        </div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Exercise not found</h2>
          <Button onClick={() => router.push('/patient')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const exercise = assignment.exercises

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/patient')}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{exercise.name}</h1>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline">{exercise.category}</Badge>
                <Badge className={
                  assignment.phase === 'analyze' ? 'bg-blue-500' :
                  assignment.phase === 'mobilize' ? 'bg-green-500' :
                  assignment.phase === 'stabilize' ? 'bg-yellow-500' :
                  'bg-purple-500'
                }>
                  {assignment.phase.toUpperCase()}
                </Badge>
                {isCompleted && (
                  <Badge className="bg-green-500">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Daily Target Met
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Video/Image Placeholder */}
        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="bg-gray-200 h-64 md:h-96 rounded-t-lg flex items-center justify-center">
              {exercise.video_url ? (
                <div className="text-center">
                  <Video className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Video: {exercise.video_url}</p>
                </div>
              ) : (
                <div className="text-center">
                  <Dumbbell className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Video demonstration coming soon</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Exercise Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Exercise Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Description</p>
                  <p className="font-medium">{exercise.description}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1 flex items-center">
                      <Repeat className="w-3 h-3 mr-1" />
                      Sets
                    </p>
                    <p className="text-2xl font-bold">{exercise.sets}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1 flex items-center">
                      <Target className="w-3 h-3 mr-1" />
                      Reps
                    </p>
                    <p className="text-2xl font-bold">{exercise.reps}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Duration
                    </p>
                    <p className="text-2xl font-bold">{exercise.duration_seconds}s</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="text-gray-600">Points</span>
                  </div>
                  <span className="font-bold text-lg">{userProgress?.points || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="text-gray-600">Current Streak</span>
                  </div>
                  <span className="font-bold text-lg">{userProgress?.streak_days || 0} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">Total Completed</span>
                  </div>
                  <span className="font-bold text-lg">{userProgress?.total_exercises_completed || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>How to Perform</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2">
              <li>Get into the starting position as shown in the video</li>
              <li>Perform the movement with controlled form</li>
              <li>Complete {exercise.sets} sets of {exercise.reps} repetitions</li>
              <li>Rest 30-60 seconds between sets</li>
              <li>Focus on quality over speed</li>
            </ol>
          </CardContent>
        </Card>

        {/* Complete Button */}
        <div className="flex justify-center">
          {isCompleted ? (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Daily Target Achieved!</h3>
              <p className="text-gray-600 mb-4">Great job! You've completed this exercise.</p>
              <Button onClick={() => router.push('/patient')}>
                Back to Dashboard
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Ready to complete this exercise? Make sure you've done all {exercise.sets} sets!
              </p>
              <Button
                size="lg"
                onClick={handleCompleteExercise}
                disabled={isCompleting}
                className="px-8"
              >
                {isCompleting ? (
                  'Completing...'
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Mark as Complete
                  </>
                )}
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                You'll earn 10 points for completing this exercise!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}