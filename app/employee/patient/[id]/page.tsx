'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { AnimatedCard, AnimatedCardContent, AnimatedCardDescription, AnimatedCardHeader, AnimatedCardTitle } from '@/components/ui/animated-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ProgressBar } from '@/components/ui/progress-bar'
import {
  ArrowLeft,
  User,
  Trophy,
  Flame,
  Target,
  ClipboardList,
  Activity,
  Calendar,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Mountain,
  TrendingUp,
  Award,
  Zap
} from 'lucide-react'

interface PatientDetails {
  id: string
  first_name: string
  last_name: string
  email: string
  created_at: string
  patient_progress: {
    phase: string
    points: number
    streak_days: number
    last_activity_date: string | null
    total_exercises_completed: number
  }[]
}

interface FMSAssessment {
  id: string
  created_at: string
  total_score: number
  deep_squat: number
  hurdle_step_left: number
  hurdle_step_right: number
  inline_lunge_left: number
  inline_lunge_right: number
  shoulder_mobility_left: number
  shoulder_mobility_right: number
  active_straight_leg_raise_left: number
  active_straight_leg_raise_right: number
  trunk_stability_push_up: number
  rotary_stability_left: number
  rotary_stability_right: number
  notes: string | null
  users: {
    first_name: string
    last_name: string
  }
}

interface ExerciseAssignment {
  id: string
  assigned_date: string
  due_date: string
  phase: string
  exercises: {
    name: string
    category: string
    sets: number
    reps: number
  }
  exercise_completions: {
    id: string
    completed_at: string
  }[]
}

export default function PatientDetailPage() {
  const [patient, setPatient] = useState<PatientDetails | null>(null)
  const [assessments, setAssessments] = useState<FMSAssessment[]>([])
  const [assignments, setAssignments] = useState<ExerciseAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchPatientData()
  }, [params.id])

  const fetchPatientData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Verify employee role
      const { data: employeeData } = await supabase
        .from('users')
        .select('role, clinic_id')
        .eq('id', user.id)
        .single()

      if (employeeData?.role !== 'employee' && employeeData?.role !== 'owner') {
        router.push('/patient')
        return
      }

      // Fetch patient details
      const { data: patientData, error: patientError } = await supabase
        .from('users')
        .select(`
          id,
          first_name,
          last_name,
          email,
          created_at,
          patient_progress (
            phase,
            points,
            streak_days,
            last_activity_date,
            total_exercises_completed
          )
        `)
        .eq('id', params.id)
        .eq('clinic_id', employeeData.clinic_id)
        .single()

      if (patientError || !patientData) {
        console.error('Patient fetch error:', patientError)
        router.push('/employee')
        return
      }

      setPatient(patientData as any)

      // Fetch FMS assessments
      const { data: assessmentData } = await supabase
        .from('fms_assessments')
        .select(`
          *,
          users!fms_assessments_employee_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('patient_id', params.id)
        .order('created_at', { ascending: false })

      if (assessmentData) {
        setAssessments(assessmentData as any)
      }

      // Fetch exercise assignments
      const { data: assignmentData } = await supabase
        .from('exercise_assignments')
        .select(`
          id,
          assigned_date,
          due_date,
          phase,
          exercises (
            name,
            category,
            sets,
            reps
          ),
          exercise_completions (
            id,
            completed_at
          )
        `)
        .eq('patient_id', params.id)
        .order('due_date', { ascending: false })
        .limit(20)

      if (assignmentData) {
        setAssignments(assignmentData as any)
      }
    } catch (error) {
      console.error('Error fetching patient data:', error)
    } finally {
      setLoading(false)
    }
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

  const getActivityStatus = (lastActivity: string | null) => {
    if (!lastActivity) return { label: 'Inactive', color: 'bg-gray-500', icon: AlertCircle }
    const daysSince = Math.floor(
      (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSince === 0) return { label: 'Active Today', color: 'bg-success', icon: Zap }
    if (daysSince <= 3) return { label: 'Recently Active', color: 'bg-warning', icon: Activity }
    return { label: `${daysSince} days ago`, color: 'bg-gray-500', icon: Clock }
  }

  const getScoreColor = (score: number) => {
    if (score === 0) return 'text-muted-foreground'
    if (score === 1) return 'text-destructive'
    if (score === 2) return 'text-warning'
    return 'text-success'
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
              <Mountain className="w-10 h-10 text-white animate-pulse" />
            </motion.div>
            <h2 className="text-xl font-semibold text-muted-foreground">Loading patient data...</h2>
          </div>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-summit-blue/5 via-background to-summit-gold/5 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <AlertCircle className="w-16 h-16 mx-auto text-destructive" />
          <h2 className="text-xl font-semibold">Patient not found</h2>
          <Button
            onClick={() => router.push('/employee')}
            className="mt-4 bg-gradient-to-r from-summit-blue to-summit-blue-light hover:from-summit-blue-light hover:to-summit-blue"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    )
  }

  const progress = patient.patient_progress[0]
  const activityStatus = getActivityStatus(progress?.last_activity_date)
  const completedExercises = assignments.filter(a => a.exercise_completions.length > 0).length
  const completionRate = assignments.length > 0
    ? Math.round((completedExercises / assignments.length) * 100)
    : 0

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
              onClick={() => router.push('/employee')}
              className="rounded-xl hover:bg-summit-blue/10"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-summit-blue to-summit-blue-light bg-clip-text text-transparent">
                {patient.first_name} {patient.last_name}
              </h1>
              <p className="text-muted-foreground">{patient.email}</p>
            </div>
            <Button
              onClick={() => router.push('/employee/assessment')}
              className="rounded-xl bg-gradient-to-r from-summit-blue to-summit-blue-light hover:from-summit-blue-light hover:to-summit-blue text-white"
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              New Assessment
            </Button>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Patient Overview */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <motion.div variants={item}>
            <AnimatedCard className="h-full border-2 hover:border-summit-blue/30 transition-colors">
              <AnimatedCardHeader className="pb-2">
                <AnimatedCardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <Mountain className="w-4 h-4 mr-2 text-summit-blue" />
                  Current Phase
                </AnimatedCardTitle>
              </AnimatedCardHeader>
              <AnimatedCardContent>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                >
                  <Badge className={`${getPhaseColor(progress?.phase || 'analyze')} text-white px-3 py-1 text-sm rounded-xl`}>
                    {progress?.phase?.toUpperCase() || 'ANALYZE'}
                  </Badge>
                </motion.div>
              </AnimatedCardContent>
            </AnimatedCard>
          </motion.div>

          <motion.div variants={item}>
            <AnimatedCard className="h-full border-2 hover:border-summit-gold/30 transition-colors">
              <AnimatedCardHeader className="pb-2">
                <AnimatedCardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <Trophy className="w-4 h-4 mr-2 text-summit-gold" />
                  Total Points
                </AnimatedCardTitle>
              </AnimatedCardHeader>
              <AnimatedCardContent>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                  className="text-2xl font-bold bg-gradient-to-r from-summit-gold to-summit-gold-dark bg-clip-text text-transparent"
                >
                  {progress?.points || 0}
                </motion.p>
              </AnimatedCardContent>
            </AnimatedCard>
          </motion.div>

          <motion.div variants={item}>
            <AnimatedCard className="h-full border-2 hover:border-destructive/30 transition-colors">
              <AnimatedCardHeader className="pb-2">
                <AnimatedCardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <Flame className="w-4 h-4 mr-2 text-destructive" />
                  Current Streak
                </AnimatedCardTitle>
              </AnimatedCardHeader>
              <AnimatedCardContent>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
                  className="text-2xl font-bold text-destructive"
                >
                  {progress?.streak_days || 0}
                  <span className="text-sm text-muted-foreground ml-2">days</span>
                </motion.p>
              </AnimatedCardContent>
            </AnimatedCard>
          </motion.div>

          <motion.div variants={item}>
            <AnimatedCard className="h-full border-2 hover:border-success/30 transition-colors">
              <AnimatedCardHeader className="pb-2">
                <AnimatedCardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-success" />
                  Activity Status
                </AnimatedCardTitle>
              </AnimatedCardHeader>
              <AnimatedCardContent>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
                  className="flex items-center gap-2"
                >
                  <activityStatus.icon className="w-4 h-4" />
                  <Badge className={`${activityStatus.color} text-white px-3 py-1 text-sm rounded-xl`}>
                    {activityStatus.label}
                  </Badge>
                </motion.div>
              </AnimatedCardContent>
            </AnimatedCard>
          </motion.div>
        </motion.div>

        {/* Progress Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <AnimatedCard className="mb-8 border-2">
            <AnimatedCardHeader>
              <AnimatedCardTitle className="flex items-center text-2xl font-display">
                <TrendingUp className="w-5 h-5 mr-2 text-summit-blue" />
                Exercise Progress
              </AnimatedCardTitle>
              <AnimatedCardDescription>
                Overall completion and engagement metrics
              </AnimatedCardDescription>
            </AnimatedCardHeader>
            <AnimatedCardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.6 }}
                  className="text-center space-y-2"
                >
                  <div className="relative">
                    <div className="text-4xl font-bold bg-gradient-to-r from-summit-blue to-summit-blue-light bg-clip-text text-transparent">
                      {completionRate}%
                    </div>
                    <ProgressBar
                      value={completionRate}
                      max={100}
                      className="mt-2"
                      color="primary"
                      size="sm"
                    />
                  </div>
                  <p className="text-sm font-medium text-foreground">Completion Rate</p>
                  <p className="text-xs text-muted-foreground">
                    {completedExercises} of {assignments.length} exercises
                  </p>
                </motion.div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.7 }}
                  className="text-center space-y-2"
                >
                  <div className="text-4xl font-bold bg-gradient-to-r from-success to-success-dark bg-clip-text text-transparent">
                    {progress?.total_exercises_completed || 0}
                  </div>
                  <p className="text-sm font-medium text-foreground">Total Completed</p>
                  <p className="text-xs text-muted-foreground">All-time exercises</p>
                </motion.div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.8 }}
                  className="text-center space-y-2"
                >
                  <div className="text-2xl font-bold bg-gradient-to-r from-phase-optimize to-phase-optimize-dark bg-clip-text text-transparent">
                    {Math.floor((Date.now() - new Date(patient.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                  </div>
                  <p className="text-sm font-medium text-foreground">Days Active</p>
                  <p className="text-xs text-muted-foreground">
                    Since {new Date(patient.created_at).toLocaleDateString()}
                  </p>
                </motion.div>
              </div>
            </AnimatedCardContent>
          </AnimatedCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {/* FMS Assessment History */}
          <AnimatedCard className="border-2">
            <AnimatedCardHeader>
              <AnimatedCardTitle className="flex items-center text-xl font-display">
                <ClipboardList className="w-5 h-5 mr-2 text-summit-blue" />
                Assessment History
              </AnimatedCardTitle>
              <AnimatedCardDescription>
                FMS scores and trends over time
              </AnimatedCardDescription>
            </AnimatedCardHeader>
            <AnimatedCardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {assessments.map((assessment, index) => (
                  <motion.div
                    key={assessment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + index * 0.1 }}
                    className="p-4 border-2 rounded-xl hover:border-summit-blue/30 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold">
                            Score: {assessment.total_score}/21
                          </p>
                          <ProgressBar
                            value={assessment.total_score}
                            max={21}
                            className="w-20"
                            color={assessment.total_score >= 14 ? "success" : assessment.total_score >= 10 ? "warning" : "primary"}
                            size="sm"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(assessment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs rounded-xl">
                        {assessment.users.first_name} {assessment.users.last_name}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <span className={`${getScoreColor(assessment.deep_squat)} font-medium`}>
                        🏋️ Squat: {assessment.deep_squat}
                      </span>
                      <span className={`${getScoreColor(Math.min(assessment.hurdle_step_left, assessment.hurdle_step_right))} font-medium`}>
                        🦵 Hurdle: {Math.min(assessment.hurdle_step_left, assessment.hurdle_step_right)}
                      </span>
                      <span className={`${getScoreColor(Math.min(assessment.inline_lunge_left, assessment.inline_lunge_right))} font-medium`}>
                        🤸 Lunge: {Math.min(assessment.inline_lunge_left, assessment.inline_lunge_right)}
                      </span>
                      <span className={`${getScoreColor(Math.min(assessment.shoulder_mobility_left, assessment.shoulder_mobility_right))} font-medium`}>
                        💪 Shoulder: {Math.min(assessment.shoulder_mobility_left, assessment.shoulder_mobility_right)}
                      </span>
                      <span className={`${getScoreColor(Math.min(assessment.active_straight_leg_raise_left, assessment.active_straight_leg_raise_right))} font-medium`}>
                        🦿 ASLR: {Math.min(assessment.active_straight_leg_raise_left, assessment.active_straight_leg_raise_right)}
                      </span>
                      <span className={`${getScoreColor(assessment.trunk_stability_push_up)} font-medium`}>
                        🏃 Trunk: {assessment.trunk_stability_push_up}
                      </span>
                    </div>
                    {assessment.notes && (
                      <p className="text-xs text-muted-foreground mt-3 italic bg-muted/50 p-2 rounded-lg">
                        📝 {assessment.notes}
                      </p>
                    )}
                  </motion.div>
                ))}
                {assessments.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      No assessments yet
                    </p>
                    <Button
                      onClick={() => router.push('/employee/assessment')}
                      className="mt-4 rounded-xl"
                      variant="outline"
                    >
                      Conduct First Assessment
                    </Button>
                  </motion.div>
                )}
              </div>
            </AnimatedCardContent>
          </AnimatedCard>

          {/* Recent Exercises */}
          <AnimatedCard className="border-2">
            <AnimatedCardHeader>
              <AnimatedCardTitle className="flex items-center text-xl font-display">
                <Target className="w-5 h-5 mr-2 text-summit-gold" />
                Recent Exercises
              </AnimatedCardTitle>
              <AnimatedCardDescription>
                Assigned exercises and completion status
              </AnimatedCardDescription>
            </AnimatedCardHeader>
            <AnimatedCardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {assignments.slice(0, 10).map((assignment, index) => (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + index * 0.1 }}
                    className="flex items-center justify-between p-4 border-2 rounded-xl hover:border-summit-gold/30 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{assignment.exercises.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Award className="w-3 h-3 mr-1" />
                          {assignment.exercises.sets} sets × {assignment.exercises.reps} reps
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(assignment.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`bg-gradient-to-r ${getPhaseGradient(assignment.phase)} text-white text-xs px-2 py-0.5 rounded-xl`}
                      >
                        {assignment.phase}
                      </Badge>
                      {assignment.exercise_completions.length > 0 ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <CheckCircle className="w-5 h-5 text-success" />
                        </motion.div>
                      ) : new Date(assignment.due_date) < new Date() ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <AlertCircle className="w-5 h-5 text-destructive" />
                        </motion.div>
                      ) : (
                        <Clock className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </motion.div>
                ))}
                {assignments.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <Target className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      No exercises assigned yet
                    </p>
                    <Button
                      onClick={() => router.push('/employee/assessment')}
                      className="mt-4 rounded-xl"
                      variant="outline"
                    >
                      Start with Assessment
                    </Button>
                  </motion.div>
                )}
              </div>
            </AnimatedCardContent>
          </AnimatedCard>
        </motion.div>
      </main>
    </div>
  )
}