'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trophy, Flame, Target, TrendingUp, Calendar, ChevronRight } from 'lucide-react'

interface PatientProgress {
  phase: 'analyze' | 'mobilize' | 'stabilize' | 'optimize'
  points: number
  streak_days: number
  total_exercises_completed: number
}

interface ExerciseAssignment {
  id: string
  exercise: {
    name: string
    description: string
    duration_seconds: number
    sets: number
    reps: number
  }
  due_date: string
  phase: string
}

export default function PatientDashboard() {
  const [user, setUser] = useState<any>(null)
  const [progress, setProgress] = useState<PatientProgress | null>(null)
  const [todaysExercises, setTodaysExercises] = useState<ExerciseAssignment[]>([])
  const [loading, setLoading] = useState(true)
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

      // Fetch exercises due today or earlier that aren't completed
      const today = new Date().toISOString().split('T')[0]
      const { data: exercises } = await supabase
        .from('exercise_assignments')
        .select(`
          id,
          due_date,
          phase,
          exercises (
            name,
            description,
            duration_seconds,
            sets,
            reps
          ),
          exercise_completions (
            id
          )
        `)
        .eq('patient_id', authUser.id)
        .lte('due_date', today)  // Due today or earlier
        .order('due_date', { ascending: true })

      if (exercises) {
        // Filter out completed exercises
        const incompleteExercises = exercises.filter(ex =>
          !ex.exercise_completions || ex.exercise_completions.length === 0
        )
        setTodaysExercises(incompleteExercises as any)
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

  const getPhaseColor = (phase: string) => {
    const colors = {
      analyze: 'bg-blue-500',
      mobilize: 'bg-green-500',
      stabilize: 'bg-yellow-500',
      optimize: 'bg-purple-500',
    }
    return colors[phase as keyof typeof colors] || 'bg-gray-500'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading your journey...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.first_name}!
              </h1>
              <p className="text-gray-600">Let's continue your journey to the summit</p>
            </div>
            <Button
              variant="outline"
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/auth/login')
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                <Trophy className="inline w-4 h-4 mr-1" />
                Total Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{progress?.points || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                <Flame className="inline w-4 h-4 mr-1" />
                Current Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{progress?.streak_days || 0} days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                <Target className="inline w-4 h-4 mr-1" />
                Exercises Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{progress?.total_exercises_completed || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                <TrendingUp className="inline w-4 h-4 mr-1" />
                Current Phase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={`${getPhaseColor(progress?.phase || 'analyze')} text-white`}>
                {progress?.phase?.toUpperCase() || 'ANALYZE'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Mountain Progress Visualization */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Journey to the Summit</CardTitle>
            <CardDescription>Track your progress through each recovery phase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-64 bg-gradient-to-b from-sky-200 to-sky-50 rounded-lg overflow-hidden">
              {/* Mountain SVG */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 400 200"
                preserveAspectRatio="none"
              >
                <path
                  d="M 0 200 L 100 150 L 200 100 L 300 50 L 400 0 L 400 200 Z"
                  fill="url(#mountainGradient)"
                  opacity="0.8"
                />
                <defs>
                  <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#6B7280" />
                    <stop offset="100%" stopColor="#9CA3AF" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Phase Markers */}
              <div className="absolute inset-0 flex items-end justify-around pb-4">
                {['analyze', 'mobilize', 'stabilize', 'optimize'].map((phase, index) => (
                  <div key={phase} className="text-center">
                    <div
                      className={`w-8 h-8 rounded-full ${
                        getPhaseProgress(phase) === 100
                          ? getPhaseColor(phase)
                          : 'bg-gray-300'
                      } flex items-center justify-center text-white font-bold mb-2`}
                      style={{
                        marginBottom: `${(index + 1) * 40}px`,
                      }}
                    >
                      {index + 1}
                    </div>
                    <p className="text-xs font-medium capitalize">{phase}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Exercises */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Today's Exercises</CardTitle>
                <CardDescription>
                  Complete your daily exercises to maintain your streak
                </CardDescription>
              </div>
              <Badge variant="outline">
                <Calendar className="w-3 h-3 mr-1" />
                {new Date().toLocaleDateString()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {todaysExercises.length > 0 ? (
              <div className="space-y-3">
                {todaysExercises.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => router.push(`/patient/exercise/${assignment.id}`)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h4 className="font-semibold">{assignment.exercise.name}</h4>
                        <p className="text-sm text-gray-600">
                          {assignment.exercise.sets} sets × {assignment.exercise.reps} reps
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </Badge>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                No exercises scheduled for today. Check back tomorrow!
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}