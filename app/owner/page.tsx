'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  TrendingUp,
  Activity,
  Award,
  Trophy,
  BarChart3,
  Calendar,
  Target,
  UserCheck,
  ClipboardList,
  Mountain,
  Flame,
  ChevronUp,
  ChevronDown
} from 'lucide-react'

interface ClinicStats {
  totalPatients: number
  activePatients: number
  totalEmployees: number
  totalAssessments: number
  totalExercisesAssigned: number
  totalExercisesCompleted: number
  averageCompletionRate: number
  averagePatientPoints: number
  averageStreak: number
  patientsPerPhase: {
    analyze: number
    mobilize: number
    stabilize: number
    optimize: number
  }
}

interface EmployeePerformance {
  id: string
  name: string
  patientCount: number
  assessmentCount: number
  lastAssessmentDate: string | null
}

interface TopPatient {
  id: string
  name: string
  points: number
  streak: number
  completedExercises: number
  phase: string
}

export default function OwnerDashboard() {
  const [owner, setOwner] = useState<any>(null)
  const [clinicStats, setClinicStats] = useState<ClinicStats>({
    totalPatients: 0,
    activePatients: 0,
    totalEmployees: 0,
    totalAssessments: 0,
    totalExercisesAssigned: 0,
    totalExercisesCompleted: 0,
    averageCompletionRate: 0,
    averagePatientPoints: 0,
    averageStreak: 0,
    patientsPerPhase: {
      analyze: 0,
      mobilize: 0,
      stabilize: 0,
      optimize: 0,
    }
  })
  const [employeePerformance, setEmployeePerformance] = useState<EmployeePerformance[]>([])
  const [topPatients, setTopPatients] = useState<TopPatient[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get owner data
      const { data: ownerData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (ownerData?.role !== 'owner') {
        // Redirect based on actual role
        if (ownerData?.role === 'employee') {
          router.push('/employee')
        } else if (ownerData?.role === 'patient') {
          router.push('/patient')
        }
        return
      }

      setOwner(ownerData)

      // Fetch all clinic users
      const { data: clinicUsers } = await supabase
        .from('users')
        .select('id, role, first_name, last_name')
        .eq('clinic_id', ownerData.clinic_id)

      if (clinicUsers) {
        const patients = clinicUsers.filter(u => u.role === 'patient')
        const employees = clinicUsers.filter(u => u.role === 'employee' || u.role === 'owner')

        // Get patient progress data
        const patientIds = patients.map(p => p.id)
        const { data: progressData } = await supabase
          .from('patient_progress')
          .select('*')
          .in('patient_id', patientIds)

        // Calculate active patients (activity in last 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const activeCount = progressData?.filter(p => {
          if (!p.last_activity_date) return false
          return new Date(p.last_activity_date) >= sevenDaysAgo
        }).length || 0

        // Calculate phase distribution
        const phaseCount = {
          analyze: 0,
          mobilize: 0,
          stabilize: 0,
          optimize: 0,
        }
        progressData?.forEach(p => {
          phaseCount[p.phase as keyof typeof phaseCount]++
        })

        // Calculate averages
        const totalPoints = progressData?.reduce((sum, p) => sum + p.points, 0) || 0
        const totalStreak = progressData?.reduce((sum, p) => sum + p.streak_days, 0) || 0
        const avgPoints = patients.length > 0 ? Math.round(totalPoints / patients.length) : 0
        const avgStreak = patients.length > 0 ? Math.round(totalStreak / patients.length) : 0

        // Get assessments count
        const { data: assessments } = await supabase
          .from('fms_assessments')
          .select('id, employee_id, created_at')
          .in('patient_id', patientIds)

        // Get exercise assignments and completions
        const { data: assignments } = await supabase
          .from('exercise_assignments')
          .select('id')
          .in('patient_id', patientIds)

        const { data: completions } = await supabase
          .from('exercise_completions')
          .select('id')
          .in('patient_id', patientIds)

        const completionRate = assignments && assignments.length > 0
          ? Math.round((completions?.length || 0) / assignments.length * 100)
          : 0

        // Set clinic stats
        setClinicStats({
          totalPatients: patients.length,
          activePatients: activeCount,
          totalEmployees: employees.length,
          totalAssessments: assessments?.length || 0,
          totalExercisesAssigned: assignments?.length || 0,
          totalExercisesCompleted: completions?.length || 0,
          averageCompletionRate: completionRate,
          averagePatientPoints: avgPoints,
          averageStreak: avgStreak,
          patientsPerPhase: phaseCount,
        })

        // Calculate employee performance
        const employeeStats: EmployeePerformance[] = []
        for (const employee of employees) {
          const employeeAssessments = assessments?.filter(a => a.employee_id === employee.id) || []
          const employeePatients = new Set(employeeAssessments.map(a => a.patient_id)).size
          const lastAssessment = employeeAssessments.length > 0
            ? employeeAssessments.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )[0].created_at
            : null

          employeeStats.push({
            id: employee.id,
            name: `${employee.first_name} ${employee.last_name}`,
            patientCount: employeePatients,
            assessmentCount: employeeAssessments.length,
            lastAssessmentDate: lastAssessment,
          })
        }
        setEmployeePerformance(employeeStats)

        // Get top performing patients
        const patientsWithProgress = patients.map(p => {
          const progress = progressData?.find(pr => pr.patient_id === p.id)
          return {
            id: p.id,
            name: `${p.first_name} ${p.last_name}`,
            points: progress?.points || 0,
            streak: progress?.streak_days || 0,
            completedExercises: progress?.total_exercises_completed || 0,
            phase: progress?.phase || 'analyze',
          }
        })
        // Sort by points and take top 5
        const topPerformers = patientsWithProgress
          .sort((a, b) => b.points - a.points)
          .slice(0, 5)
        setTopPatients(topPerformers)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
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

  const getChangeIndicator = (value: number, isPositive: boolean = true) => {
    if (value === 0) return null
    const isGood = isPositive ? value > 0 : value < 0
    return (
      <span className={`flex items-center text-sm ${isGood ? 'text-green-600' : 'text-red-600'}`}>
        {value > 0 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {Math.abs(value)}%
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading analytics...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Clinic Analytics Dashboard
              </h1>
              <p className="text-gray-600">Monitor your clinic's performance and patient outcomes</p>
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
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                <Users className="inline w-4 h-4 mr-1" />
                Total Patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{clinicStats.totalPatients}</p>
              <p className="text-xs text-gray-500 mt-1">
                {clinicStats.activePatients} active this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                <Activity className="inline w-4 h-4 mr-1" />
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{clinicStats.averageCompletionRate}%</p>
              <p className="text-xs text-gray-500 mt-1">
                {clinicStats.totalExercisesCompleted} / {clinicStats.totalExercisesAssigned} exercises
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                <Trophy className="inline w-4 h-4 mr-1" />
                Avg. Patient Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{clinicStats.averagePatientPoints}</p>
              <p className="text-xs text-gray-500 mt-1">
                Engagement score
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                <Flame className="inline w-4 h-4 mr-1" />
                Avg. Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{clinicStats.averageStreak} days</p>
              <p className="text-xs text-gray-500 mt-1">
                Patient consistency
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Phase Distribution */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mountain className="w-5 h-5 mr-2" />
              Patient Phase Distribution
            </CardTitle>
            <CardDescription>
              Track patient progression through recovery phases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(clinicStats.patientsPerPhase).map(([phase, count]) => (
                <div key={phase} className="text-center">
                  <div className={`${getPhaseColor(phase)} text-white rounded-lg p-4 mb-2`}>
                    <p className="text-3xl font-bold">{count}</p>
                  </div>
                  <p className="text-sm font-medium capitalize">{phase}</p>
                  <p className="text-xs text-gray-500">
                    {clinicStats.totalPatients > 0
                      ? `${Math.round(count / clinicStats.totalPatients * 100)}%`
                      : '0%'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Employee Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCheck className="w-5 h-5 mr-2" />
                Employee Performance
              </CardTitle>
              <CardDescription>
                Staff assessment activity and patient load
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employeePerformance.map(employee => (
                  <div key={employee.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{employee.name}</p>
                        <div className="flex gap-4 mt-1">
                          <span className="text-sm text-gray-600">
                            {employee.patientCount} patients
                          </span>
                          <span className="text-sm text-gray-600">
                            {employee.assessmentCount} assessments
                          </span>
                        </div>
                      </div>
                      {employee.lastAssessmentDate && (
                        <Badge variant="outline" className="text-xs">
                          Last: {new Date(employee.lastAssessmentDate).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {employeePerformance.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No employee data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Top Performing Patients
              </CardTitle>
              <CardDescription>
                Most engaged patients by points earned
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPatients.map((patient, index) => (
                  <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold
                        ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300'}`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{patient.name}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            <Trophy className="w-3 h-3 mr-1" />
                            {patient.points} pts
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Flame className="w-3 h-3 mr-1" />
                            {patient.streak} days
                          </Badge>
                          <Badge className={`${getPhaseColor(patient.phase)} text-white text-xs`}>
                            {patient.phase}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {topPatients.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No patient data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Clinic Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <ClipboardList className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{clinicStats.totalAssessments}</p>
                <p className="text-sm text-gray-600">Total Assessments</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Target className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{clinicStats.totalExercisesAssigned}</p>
                <p className="text-sm text-gray-600">Exercises Assigned</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <UserCheck className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{clinicStats.totalEmployees}</p>
                <p className="text-sm text-gray-600">Staff Members</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Calendar className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  {Math.round(clinicStats.activePatients / Math.max(clinicStats.totalPatients, 1) * 100)}%
                </p>
                <p className="text-sm text-gray-600">Weekly Active Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}