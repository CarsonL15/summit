'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { AnimatedCard, AnimatedCardContent, AnimatedCardDescription, AnimatedCardHeader, AnimatedCardTitle } from '@/components/ui/animated-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ProgressBar } from '@/components/ui/progress-bar'
import { ThemeToggle } from '@/components/theme-toggle'
import { Trophy, Flame, Target, TrendingUp, Calendar, ChevronRight, Mountain, CheckCircle2, User } from 'lucide-react'

interface PatientProgress {
  phase: 'analyze' | 'mobilize' | 'stabilize' | 'optimize'
  points: number
  streak_days: number
  total_exercises_completed: number
}

interface ExerciseAssignment {
  id: string
  exercises: {
    name: string
    description: string
    duration_seconds: number
    sets: number
    reps: number
  }
  start_date: string
  end_date: string
  daily_target: number
  phase: string
  completedToday?: boolean
  todayCompletions?: number
  targetCompletions?: number
  exercise_completions?: any[]
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

export default function PatientDashboard() {
  const [user, setUser] = useState<any>(null)
  const [progress, setProgress] = useState<PatientProgress | null>(null)
  const [todaysExercises, setTodaysExercises] = useState<ExerciseAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/auth/login')
        return
      }

      // Fetch user profile
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      setUser(userData)

      // Fetch patient progress
      const { data: progressData } = await supabase
        .from('patient_progress')
        .select('*')
        .eq('patient_id', authUser.id)
        .single()

      if (progressData) {
        setProgress(progressData)
      }

      // Fetch exercises in current program (within date range)
      const today = new Date().toISOString().split('T')[0]
      const { data: exercises } = await supabase
        .from('exercise_assignments')
        .select(`
          id,
          start_date,
          end_date,
          daily_target,
          phase,
          exercises (
            name,
            description,
            duration_seconds,
            sets,
            reps
          ),
          exercise_completions (
            id,
            completed_at
          )
        `)
        .eq('patient_id', authUser.id)
        .lte('start_date', today)  // Program has started
        .gte('end_date', today)    // Program hasn't ended
        .order('created_at', { ascending: true })

      if (exercises) {
        // Check which exercises were completed TODAY
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date()
        todayEnd.setHours(23, 59, 59, 999)

        const exercisesWithTodayStatus = exercises.map(ex => {
          const todayCompletions = ex.exercise_completions?.filter(comp => {
            const completedDate = new Date(comp.completed_at)
            return completedDate >= todayStart && completedDate <= todayEnd
          }) || []

          return {
            ...ex,
            completedToday: todayCompletions.length > 0,
            todayCompletions: todayCompletions.length,
            targetCompletions: ex.daily_target || 1
          }
        })

        // Show all exercises, but mark completed ones differently
        setTodaysExercises(exercisesWithTodayStatus as any)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPhaseProgress = (phase: string) => {
    const phases = ['analyze', 'mobilize', 'stabilize', 'optimize']
    const currentIndex = phases.indexOf(progress?.phase || 'analyze')
    const targetIndex = phases.indexOf(phase)
    return currentIndex >= targetIndex ? 100 : currentIndex === targetIndex - 1 ? 50 : 0
  }

  const getPhaseColor = (phase: string): "phase-analyze" | "phase-mobilize" | "phase-stabilize" | "phase-optimize" => {
    const colors = {
      analyze: 'phase-analyze',
      mobilize: 'phase-mobilize',
      stabilize: 'phase-stabilize',
      optimize: 'phase-optimize',
    }
    return colors[phase as keyof typeof colors] as any || 'phase-analyze'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Mountain className="w-16 h-16 mx-auto text-summit-blue animate-pulse" />
          <h2 className="text-xl font-semibold font-display">Loading your journey...</h2>
          <div className="space-y-2 max-w-xs mx-auto">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-summit-blue/5 via-background to-summit-gold/5">
      {/* Header */}
      <header className="bg-card shadow-sm border-b sticky top-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-2xl font-bold font-display text-foreground">
                Welcome back, {user?.first_name}!
              </h1>
              <p className="text-muted-foreground">Let's continue your journey to the summit</p>
            </motion.div>
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="rounded-2xl"
              >
                <User className="w-4 h-4 mr-2" />
                Menu
              </Button>
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-64 bg-card rounded-xl shadow-lg border p-4 space-y-3"
                  >
                    <ThemeToggle />
                    <hr className="border-border" />
                    <Button
                      variant="outline"
                      onClick={async () => {
                        await supabase.auth.signOut()
                        router.push('/auth/login')
                      }}
                      className="w-full rounded-xl"
                    >
                      Sign Out
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <motion.div variants={item}>
            <AnimatedCard className="bg-gradient-to-br from-summit-blue/10 to-transparent" delay={0}>
              <AnimatedCardHeader className="pb-2">
                <AnimatedCardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <Trophy className="w-4 h-4 mr-1 text-summit-gold" />
                  Total Points
                </AnimatedCardTitle>
              </AnimatedCardHeader>
              <AnimatedCardContent>
                <motion.p
                  className="text-3xl font-bold font-display text-summit-blue"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                >
                  {progress?.points || 0}
                </motion.p>
              </AnimatedCardContent>
            </AnimatedCard>
          </motion.div>

          <motion.div variants={item}>
            <AnimatedCard className="bg-gradient-to-br from-orange-500/10 to-transparent" delay={0.1}>
              <AnimatedCardHeader className="pb-2">
                <AnimatedCardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <Flame className="w-4 h-4 mr-1 text-orange-500" />
                  Current Streak
                </AnimatedCardTitle>
              </AnimatedCardHeader>
              <AnimatedCardContent>
                <motion.p
                  className="text-3xl font-bold font-display text-orange-600"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                >
                  {progress?.streak_days || 0} <span className="text-lg font-normal">days</span>
                </motion.p>
              </AnimatedCardContent>
            </AnimatedCard>
          </motion.div>

          <motion.div variants={item}>
            <AnimatedCard className="bg-gradient-to-br from-green-500/10 to-transparent" delay={0.2}>
              <AnimatedCardHeader className="pb-2">
                <AnimatedCardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <Target className="w-4 h-4 mr-1 text-green-500" />
                  Exercises Completed
                </AnimatedCardTitle>
              </AnimatedCardHeader>
              <AnimatedCardContent>
                <motion.p
                  className="text-3xl font-bold font-display text-green-600"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                >
                  {progress?.total_exercises_completed || 0}
                </motion.p>
              </AnimatedCardContent>
            </AnimatedCard>
          </motion.div>

          <motion.div variants={item}>
            <AnimatedCard className="bg-gradient-to-br from-purple-500/10 to-transparent" delay={0.3}>
              <AnimatedCardHeader className="pb-2">
                <AnimatedCardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1 text-purple-500" />
                  Current Phase
                </AnimatedCardTitle>
              </AnimatedCardHeader>
              <AnimatedCardContent>
                <Badge className={`bg-${getPhaseColor(progress?.phase || 'analyze')} text-white font-display px-3 py-1`}>
                  {progress?.phase?.toUpperCase() || 'ANALYZE'}
                </Badge>
              </AnimatedCardContent>
            </AnimatedCard>
          </motion.div>
        </motion.div>

        {/* Mountain Progress Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <AnimatedCard className="mb-8" delay={0.4}>
            <AnimatedCardHeader>
              <AnimatedCardTitle className="font-display">Your Journey to the Summit</AnimatedCardTitle>
              <AnimatedCardDescription>Track your progress through each recovery phase</AnimatedCardDescription>
            </AnimatedCardHeader>
            <AnimatedCardContent>
              <div className="relative h-64 bg-gradient-to-b from-sky-200 to-sky-50 dark:from-sky-900/30 dark:to-sky-950/20 rounded-xl overflow-hidden">
                {/* Mountain SVG */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 400 200"
                  preserveAspectRatio="none"
                >
                  <motion.path
                    d="M 0 200 L 100 150 L 200 100 L 300 50 L 400 0 L 400 200 Z"
                    fill="url(#mountainGradient)"
                    opacity="0.8"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                  />
                  <defs>
                    <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#0d3d62" />
                      <stop offset="100%" stopColor="#1a5a8a" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Phase Markers */}
                <div className="absolute inset-0 flex items-end justify-around pb-4">
                  {['analyze', 'mobilize', 'stabilize', 'optimize'].map((phase, index) => (
                    <motion.div
                      key={phase}
                      className="text-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                    >
                      <motion.div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mb-2 shadow-lg`}
                        style={{
                          marginBottom: `${(index + 1) * 40}px`,
                          backgroundColor: getPhaseProgress(phase) === 100
                            ? `var(--${getPhaseColor(phase)})`
                            : 'rgb(156, 163, 175)'
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {getPhaseProgress(phase) === 100 ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          index + 1
                        )}
                      </motion.div>
                      <p className="text-xs font-medium capitalize font-display">{phase}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Progress Line */}
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/10">
                  <ProgressBar
                    value={getPhaseProgress(progress?.phase || 'analyze')}
                    color={getPhaseColor(progress?.phase || 'analyze')}
                    className="h-full"
                    animated
                  />
                </div>
              </div>
            </AnimatedCardContent>
          </AnimatedCard>
        </motion.div>

        {/* Today's Exercises */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <AnimatedCard delay={0.6}>
            <AnimatedCardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <AnimatedCardTitle className="font-display">Your Weekly Exercise Program</AnimatedCardTitle>
                  <AnimatedCardDescription>
                    Complete each exercise daily to maintain your streak
                  </AnimatedCardDescription>
                </div>
                <Badge variant="outline" className="rounded-full">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date().toLocaleDateString()}
                </Badge>
              </div>
            </AnimatedCardHeader>
            <AnimatedCardContent>
              {todaysExercises.length > 0 ? (
                <motion.div
                  className="space-y-3"
                  variants={container}
                  initial="hidden"
                  animate="show"
                >
                  {todaysExercises.map((assignment, index) => (
                    <motion.div
                      key={assignment.id}
                      variants={item}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 border-2 rounded-xl transition-all cursor-pointer ${
                        assignment.completedToday
                          ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800'
                          : 'hover:bg-muted/50 border-border'
                      }`}
                      onClick={() => router.push(`/patient/exercise/${assignment.id}`)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold font-display">{assignment.exercises.name}</h4>
                            {assignment.completedToday && (
                              <Badge className="bg-green-600 text-xs rounded-full px-2">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Done Today
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {assignment.exercises.sets} sets × {assignment.exercises.reps} reps
                          </p>
                          <div className="mt-2">
                            <ProgressBar
                              value={assignment.todayCompletions || 0}
                              max={assignment.targetCompletions || 1}
                              size="sm"
                              color={assignment.completedToday ? "success" : "primary"}
                              showLabel
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs rounded-full">
                            {Math.ceil((new Date(assignment.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                          </Badge>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <motion.div
                    className="mt-4 p-4 bg-summit-blue/10 dark:bg-summit-blue/20 rounded-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <p className="text-sm text-summit-blue dark:text-summit-blue-light font-medium">
                      💡 <strong>Tip:</strong> Complete all exercises daily to maintain your streak.
                      You can repeat exercises multiple times per day if desired!
                    </p>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.p
                  className="text-center text-muted-foreground py-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  No exercises currently assigned. Visit your healthcare provider for an assessment.
                </motion.p>
              )}
            </AnimatedCardContent>
          </AnimatedCard>
        </motion.div>
      </main>
    </div>
  )
}