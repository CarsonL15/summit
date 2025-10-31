'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  Mountain
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
      analyze: 'bg-blue-500',
      mobilize: 'bg-green-500',
      stabilize: 'bg-yellow-500',
      optimize: 'bg-purple-500',
    }
    return colors[phase as keyof typeof colors] || 'bg-gray-500'
  }

  const getActivityStatus = (lastActivity: string | null) => {
    if (!lastActivity) return { label: 'Inactive', color: 'bg-gray-500' }
    const daysSince = Math.floor(
      (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSince === 0) return { label: 'Active Today', color: 'bg-green-500' }
    if (daysSince <= 3) return { label: 'Recently Active', color: 'bg-yellow-500' }
    return { label: `${daysSince} days ago`, color: 'bg-gray-500' }
  }

  const getScoreColor = (score: number) => {
    if (score === 0) return 'text-gray-600'
    if (score === 1) return 'text-red-600'
    if (score === 2) return 'text-yellow-600'
    return 'text-green-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading patient data...</h2>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Patient not found</h2>
          <Button onClick={() => router.push('/employee')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/employee')}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {patient.first_name} {patient.last_name}
              </h1>
              <p className="text-gray-600">{patient.email}</p>
            </div>
            <Button
              onClick={() => router.push('/employee/assessment')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              New Assessment
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Patient Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                <Mountain className="inline w-4 h-4 mr-1" />
                Current Phase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={`${getPhaseColor(progress?.phase || 'analyze')} text-white`}>
                {progress?.phase?.toUpperCase() || 'ANALYZE'}
              </Badge>
            </CardContent>
          </Card>

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
                <Activity className="inline w-4 h-4 mr-1" />
                Activity Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={`${activityStatus.color} text-white`}>
                {activityStatus.label}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Progress Stats */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Exercise Progress</CardTitle>
            <CardDescription>
              Overall completion and engagement metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{completionRate}%</div>
                <p className="text-sm text-gray-600 mt-1">Completion Rate</p>
                <p className="text-xs text-gray-500 mt-1">
                  {completedExercises} of {assignments.length} exercises
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {progress?.total_exercises_completed || 0}
                </div>
                <p className="text-sm text-gray-600 mt-1">Total Completed</p>
                <p className="text-xs text-gray-500 mt-1">All-time exercises</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {new Date(patient.created_at).toLocaleDateString()}
                </div>
                <p className="text-sm text-gray-600 mt-1">Member Since</p>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.floor((Date.now() - new Date(patient.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* FMS Assessment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClipboardList className="w-5 h-5 mr-2" />
                Assessment History
              </CardTitle>
              <CardDescription>
                FMS scores and trends over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {assessments.map((assessment) => (
                  <div key={assessment.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">
                          Total Score: {assessment.total_score}/21
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(assessment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        By {assessment.users.first_name} {assessment.users.last_name}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <span className={getScoreColor(assessment.deep_squat)}>
                        Deep Squat: {assessment.deep_squat}
                      </span>
                      <span className={getScoreColor(Math.min(assessment.hurdle_step_left, assessment.hurdle_step_right))}>
                        Hurdle Step: {Math.min(assessment.hurdle_step_left, assessment.hurdle_step_right)}
                      </span>
                      <span className={getScoreColor(Math.min(assessment.inline_lunge_left, assessment.inline_lunge_right))}>
                        Inline Lunge: {Math.min(assessment.inline_lunge_left, assessment.inline_lunge_right)}
                      </span>
                      <span className={getScoreColor(Math.min(assessment.shoulder_mobility_left, assessment.shoulder_mobility_right))}>
                        Shoulder: {Math.min(assessment.shoulder_mobility_left, assessment.shoulder_mobility_right)}
                      </span>
                      <span className={getScoreColor(Math.min(assessment.active_straight_leg_raise_left, assessment.active_straight_leg_raise_right))}>
                        ASLR: {Math.min(assessment.active_straight_leg_raise_left, assessment.active_straight_leg_raise_right)}
                      </span>
                      <span className={getScoreColor(assessment.trunk_stability_push_up)}>
                        Trunk: {assessment.trunk_stability_push_up}
                      </span>
                    </div>
                    {assessment.notes && (
                      <p className="text-xs text-gray-600 mt-2 italic">
                        Note: {assessment.notes}
                      </p>
                    )}
                  </div>
                ))}
                {assessments.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No assessments yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Exercises */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Recent Exercises
              </CardTitle>
              <CardDescription>
                Assigned exercises and completion status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {assignments.slice(0, 10).map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{assignment.exercises.name}</p>
                      <p className="text-xs text-gray-600">
                        {assignment.exercises.sets} sets × {assignment.exercises.reps} reps
                      </p>
                      <p className="text-xs text-gray-500">
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`${getPhaseColor(assignment.phase)} text-white text-xs`}
                      >
                        {assignment.phase}
                      </Badge>
                      {assignment.exercise_completions.length > 0 ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : new Date(assignment.due_date) < new Date() ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                ))}
                {assignments.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No exercises assigned yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}