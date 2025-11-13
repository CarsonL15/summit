'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { AnimatedCard, AnimatedCardContent, AnimatedCardDescription, AnimatedCardHeader, AnimatedCardTitle } from '@/components/ui/animated-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ProgressBar } from '@/components/ui/progress-bar'
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
  Dumbbell,
  Mountain,
  Sparkles,
  Timer,
  Award,
  ChevronRight
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

      // 6. Redirect after delay (no alert needed with visual feedback)
      setTimeout(() => {
        router.push('/patient')
      }, 3000)

    } catch (error) {
      console.error('Error completing exercise:', error)
      alert('An error occurred while completing the exercise')
    } finally {
      setIsCompleting(false)
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  const getPhaseColor = (phase: string) => {
    const colors = {
      analyze: 'bg-phase-analyze',
      mobilize: 'bg-phase-mobilize',
      stabilize: 'bg-phase-stabilize',
      optimize: 'bg-phase-optimize',
    }
    return colors[phase as keyof typeof colors] || 'bg-gray-500'
  }

  const getPhaseGradient = (phase: string) => {
    const gradients = {
      analyze: 'from-phase-analyze to-phase-analyze-dark',
      mobilize: 'from-phase-mobilize to-phase-mobilize-dark',
      stabilize: 'from-phase-stabilize to-phase-stabilize-dark',
      optimize: 'from-phase-optimize to-phase-optimize-dark',
    }
    return gradients[phase as keyof typeof gradients] || 'from-gray-500 to-gray-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-summit-blue/5 via-background to-summit-gold/5">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-20 h-20 mx-auto bg-gradient-to-br from-summit-blue to-summit-blue-light rounded-2xl flex items-center justify-center"
            >
              <Dumbbell className="w-10 h-10 text-white animate-pulse" />
            </motion.div>
            <h2 className="text-xl font-semibold text-muted-foreground">Loading exercise...</h2>
          </div>
        </div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-summit-blue/5 via-background to-summit-gold/5 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <Target className="w-16 h-16 mx-auto text-destructive" />
          <h2 className="text-xl font-semibold">Exercise not found</h2>
          <Button
            onClick={() => router.push('/patient')}
            className="mt-4 rounded-xl bg-gradient-to-r from-summit-blue to-summit-blue-light hover:from-summit-blue-light hover:to-summit-blue"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    )
  }

  const exercise = assignment.exercises

  return (
    <div className="min-h-screen bg-gradient-to-br from-summit-blue/5 via-background to-summit-gold/5">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-summit-blue/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-summit-gold/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative backdrop-blur-sm bg-background/80 shadow-sm border-b"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/patient')}
              className="rounded-xl hover:bg-summit-blue/10"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-summit-blue to-summit-blue-light bg-clip-text text-transparent">
                {exercise.name}
              </h1>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="rounded-xl">
                  {exercise.category}
                </Badge>
                <Badge className={`bg-gradient-to-r ${getPhaseGradient(assignment.phase)} text-white rounded-xl`}>
                  {assignment.phase.toUpperCase()}
                </Badge>
                {isCompleted && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Badge className="bg-gradient-to-r from-success to-success-dark text-white rounded-xl">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Daily Target Met
                    </Badge>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Video/Image Placeholder */}
          <motion.div variants={item}>
            <AnimatedCard className="mb-6 border-2 overflow-hidden">
              <AnimatedCardContent className="p-0">
                <motion.div
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="bg-gradient-to-br from-summit-blue/20 to-summit-gold/20 h-64 md:h-96 rounded-t-2xl flex items-center justify-center"
                >
                  {exercise.video_url ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-center"
                    >
                      <Video className="w-20 h-20 text-summit-blue mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium">Video: {exercise.video_url}</p>
                      <Button
                        variant="outline"
                        className="mt-4 rounded-xl"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Play Video
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-center"
                    >
                      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-summit-blue to-summit-blue-light rounded-2xl flex items-center justify-center mb-3">
                        <Dumbbell className="w-12 h-12 text-white" />
                      </div>
                      <p className="text-muted-foreground font-medium">Video demonstration coming soon</p>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatedCardContent>
            </AnimatedCard>
          </motion.div>

          {/* Exercise Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <motion.div variants={item}>
              <AnimatedCard className="h-full border-2">
                <AnimatedCardHeader>
                  <AnimatedCardTitle className="text-xl font-display">Exercise Details</AnimatedCardTitle>
                </AnimatedCardHeader>
                <AnimatedCardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Description</p>
                      <p className="font-medium">{exercise.description}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="text-center p-3 rounded-xl bg-gradient-to-br from-summit-blue/10 to-summit-blue/5"
                      >
                        <Repeat className="w-5 h-5 mx-auto mb-1 text-summit-blue" />
                        <p className="text-3xl font-bold bg-gradient-to-r from-summit-blue to-summit-blue-light bg-clip-text text-transparent">
                          {exercise.sets}
                        </p>
                        <p className="text-xs text-muted-foreground">Sets</p>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="text-center p-3 rounded-xl bg-gradient-to-br from-summit-gold/10 to-summit-gold/5"
                      >
                        <Target className="w-5 h-5 mx-auto mb-1 text-summit-gold" />
                        <p className="text-3xl font-bold bg-gradient-to-r from-summit-gold to-summit-gold-dark bg-clip-text text-transparent">
                          {exercise.reps}
                        </p>
                        <p className="text-xs text-muted-foreground">Reps</p>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="text-center p-3 rounded-xl bg-gradient-to-br from-success/10 to-success/5"
                      >
                        <Timer className="w-5 h-5 mx-auto mb-1 text-success" />
                        <p className="text-3xl font-bold text-success">
                          {exercise.duration_seconds}
                        </p>
                        <p className="text-xs text-muted-foreground">Seconds</p>
                      </motion.div>
                    </div>
                  </div>
                </AnimatedCardContent>
              </AnimatedCard>
            </motion.div>

            <motion.div variants={item}>
              <AnimatedCard className="h-full border-2">
                <AnimatedCardHeader>
                  <AnimatedCardTitle className="text-xl font-display">Your Progress</AnimatedCardTitle>
                </AnimatedCardHeader>
                <AnimatedCardContent>
                  <div className="space-y-4">
                    <motion.div
                      whileHover={{ x: 5 }}
                      className="flex justify-between items-center p-3 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-summit-gold to-summit-gold-dark flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium">Points</span>
                      </div>
                      <span className="text-2xl font-bold bg-gradient-to-r from-summit-gold to-summit-gold-dark bg-clip-text text-transparent">
                        {userProgress?.points || 0}
                      </span>
                    </motion.div>
                    <motion.div
                      whileHover={{ x: 5 }}
                      className="flex justify-between items-center p-3 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-destructive to-destructive/80 flex items-center justify-center">
                          <Flame className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium">Current Streak</span>
                      </div>
                      <span className="text-2xl font-bold text-destructive">
                        {userProgress?.streak_days || 0}
                        <span className="text-sm text-muted-foreground ml-1">days</span>
                      </span>
                    </motion.div>
                    <motion.div
                      whileHover={{ x: 5 }}
                      className="flex justify-between items-center p-3 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success to-success-dark flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium">Total Completed</span>
                      </div>
                      <span className="text-2xl font-bold text-success">
                        {userProgress?.total_exercises_completed || 0}
                      </span>
                    </motion.div>
                  </div>
                </AnimatedCardContent>
              </AnimatedCard>
            </motion.div>
          </div>

          {/* Instructions */}
          <motion.div variants={item}>
            <AnimatedCard className="mb-6 border-2">
              <AnimatedCardHeader>
                <AnimatedCardTitle className="text-xl font-display flex items-center">
                  <Award className="w-5 h-5 mr-2 text-summit-blue" />
                  How to Perform
                </AnimatedCardTitle>
              </AnimatedCardHeader>
              <AnimatedCardContent>
                <ol className="space-y-3">
                  {[
                    "Get into the starting position as shown in the video",
                    "Perform the movement with controlled form",
                    `Complete ${exercise.sets} sets of ${exercise.reps} repetitions`,
                    "Rest 30-60 seconds between sets",
                    "Focus on quality over speed"
                  ].map((instruction, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-summit-blue to-summit-blue-light flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">{index + 1}</span>
                      </div>
                      <span className="text-foreground">{instruction}</span>
                    </motion.li>
                  ))}
                </ol>
              </AnimatedCardContent>
            </AnimatedCard>
          </motion.div>

          {/* Complete Button */}
          <motion.div
            variants={item}
            className="flex justify-center"
          >
            <AnimatePresence mode="wait">
              {isCompleted ? (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-success to-success-dark rounded-full flex items-center justify-center"
                  >
                    <CheckCircle className="w-12 h-12 text-white" />
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-display font-bold bg-gradient-to-r from-success to-success-dark bg-clip-text text-transparent mb-2"
                  >
                    Daily Target Achieved!
                  </motion.h3>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-3"
                  >
                    <p className="text-muted-foreground mb-4">
                      Great job! You've completed this exercise.
                    </p>
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <Badge className="bg-gradient-to-r from-summit-gold to-summit-gold-dark text-white rounded-xl px-3 py-1">
                        <Sparkles className="w-3 h-3 mr-1" />
                        +10 Points
                      </Badge>
                      <Badge className="bg-gradient-to-r from-destructive to-destructive/80 text-white rounded-xl px-3 py-1">
                        <Flame className="w-3 h-3 mr-1" />
                        {userProgress?.streak_days || 1} Day Streak
                      </Badge>
                    </div>
                    <Button
                      onClick={() => router.push('/patient')}
                      className="rounded-xl bg-gradient-to-r from-summit-blue to-summit-blue-light hover:from-summit-blue-light hover:to-summit-blue"
                    >
                      <Mountain className="w-4 h-4 mr-2" />
                      Back to Dashboard
                    </Button>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="incomplete"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-center"
                >
                  <p className="text-muted-foreground mb-6">
                    Ready to complete this exercise? Make sure you've done all {exercise.sets} sets!
                  </p>
                  <Button
                    size="lg"
                    onClick={handleCompleteExercise}
                    disabled={isCompleting}
                    className="px-12 py-6 text-lg rounded-xl bg-gradient-to-r from-summit-blue to-summit-blue-light hover:from-summit-blue-light hover:to-summit-blue transition-all hover:scale-105"
                  >
                    {isCompleting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Timer className="w-6 h-6 mr-2" />
                        </motion.div>
                        Completing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-6 h-6 mr-2" />
                        Mark as Complete
                      </>
                    )}
                  </Button>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground"
                  >
                    <Trophy className="w-4 h-4 text-summit-gold" />
                    <span>You'll earn <strong className="text-summit-gold">10 points</strong> for completing this exercise!</span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}