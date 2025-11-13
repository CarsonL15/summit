'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { AnimatedCard, AnimatedCardContent, AnimatedCardDescription, AnimatedCardHeader, AnimatedCardTitle } from '@/components/ui/animated-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ThemeToggle } from '@/components/theme-toggle'
import { ProgressBar } from '@/components/ui/progress-bar'
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
  ChevronDown,
  User,
  Briefcase,
  Crown
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
  const [showUserMenu, setShowUserMenu] = useState(false)
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
          .select('id, employee_id, created_at, patient_id')
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
          const uniquePatients = new Set(employeeAssessments.map(a => a.patient_id))
          const lastAssessment = employeeAssessments.length > 0
            ? employeeAssessments.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )[0].created_at
            : null

          employeeStats.push({
            id: employee.id,
            name: `${employee.first_name} ${employee.last_name}`,
            patientCount: uniquePatients.size,
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

  const getPhaseColor = (phase: string): "phase-analyze" | "phase-mobilize" | "phase-stabilize" | "phase-optimize" => {
    const colors = {
      analyze: 'phase-analyze',
      mobilize: 'phase-mobilize',
      stabilize: 'phase-stabilize',
      optimize: 'phase-optimize',
    }
    return colors[phase as keyof typeof colors] as any || 'phase-analyze'
  }

  const getMedalColor = (index: number) => {
    if (index === 0) return 'from-yellow-400 to-amber-500' // Gold
    if (index === 1) return 'from-gray-300 to-gray-400' // Silver
    if (index === 2) return 'from-orange-400 to-orange-600' // Bronze
    return 'from-gray-200 to-gray-300'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Mountain className="w-16 h-16 mx-auto text-summit-blue animate-pulse" />
          <h2 className="text-xl font-semibold font-display">Loading analytics...</h2>
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
              <h1 className="text-2xl font-bold font-display text-foreground flex items-center">
                <Crown className="w-6 h-6 mr-2 text-summit-gold" />
                Clinic Analytics Dashboard
              </h1>
              <p className="text-muted-foreground">Monitor your clinic's performance and patient outcomes</p>
            </motion.div>
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="rounded-2xl"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Owner Menu
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
        {/* Key Metrics */}
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
                  <Users className="w-4 h-4 mr-1 text-summit-blue" />
                  Total Patients
                </AnimatedCardTitle>
              </AnimatedCardHeader>
              <AnimatedCardContent>
                <motion.p
                  className="text-3xl font-bold font-display text-summit-blue"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                >
                  {clinicStats.totalPatients}
                </motion.p>
                <p className="text-xs text-muted-foreground mt-1">
                  {clinicStats.activePatients} active this week
                </p>
              </AnimatedCardContent>
            </AnimatedCard>
          </motion.div>

          <motion.div variants={item}>
            <AnimatedCard className="bg-gradient-to-br from-green-500/10 to-transparent" delay={0.1}>
              <AnimatedCardHeader className="pb-2">
                <AnimatedCardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <Activity className="w-4 h-4 mr-1 text-green-500" />
                  Completion Rate
                </AnimatedCardTitle>
              </AnimatedCardHeader>
              <AnimatedCardContent>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                >
                  <p className="text-3xl font-bold font-display text-green-600">
                    {clinicStats.averageCompletionRate}%
                  </p>
                  <ProgressBar
                    value={clinicStats.averageCompletionRate}
                    color="success"
                    size="sm"
                    className="mt-2"
                    animated
                  />
                </motion.div>
                <p className="text-xs text-muted-foreground mt-1">
                  {clinicStats.totalExercisesCompleted} / {clinicStats.totalExercisesAssigned} exercises
                </p>
              </AnimatedCardContent>
            </AnimatedCard>
          </motion.div>

          <motion.div variants={item}>
            <AnimatedCard className="bg-gradient-to-br from-summit-gold/20 to-transparent" delay={0.2}>
              <AnimatedCardHeader className="pb-2">
                <AnimatedCardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <Trophy className="w-4 h-4 mr-1 text-summit-gold" />
                  Avg. Patient Points
                </AnimatedCardTitle>
              </AnimatedCardHeader>
              <AnimatedCardContent>
                <motion.p
                  className="text-3xl font-bold font-display text-summit-gold-dark"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                >
                  {clinicStats.averagePatientPoints}
                </motion.p>
                <p className="text-xs text-muted-foreground mt-1">
                  Engagement score
                </p>
              </AnimatedCardContent>
            </AnimatedCard>
          </motion.div>

          <motion.div variants={item}>
            <AnimatedCard className="bg-gradient-to-br from-orange-500/10 to-transparent" delay={0.3}>
              <AnimatedCardHeader className="pb-2">
                <AnimatedCardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <Flame className="w-4 h-4 mr-1 text-orange-500" />
                  Avg. Streak
                </AnimatedCardTitle>
              </AnimatedCardHeader>
              <AnimatedCardContent>
                <motion.p
                  className="text-3xl font-bold font-display text-orange-600"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                >
                  {clinicStats.averageStreak} <span className="text-lg font-normal">days</span>
                </motion.p>
                <p className="text-xs text-muted-foreground mt-1">
                  Patient consistency
                </p>
              </AnimatedCardContent>
            </AnimatedCard>
          </motion.div>
        </motion.div>

        {/* Phase Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <AnimatedCard className="mb-8" delay={0.4}>
            <AnimatedCardHeader>
              <AnimatedCardTitle className="flex items-center font-display">
                <Mountain className="w-5 h-5 mr-2 text-summit-blue" />
                Patient Phase Distribution
              </AnimatedCardTitle>
              <AnimatedCardDescription>
                Track patient progression through recovery phases
              </AnimatedCardDescription>
            </AnimatedCardHeader>
            <AnimatedCardContent>
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(clinicStats.patientsPerPhase).map(([phase, count], index) => (
                  <motion.div
                    key={phase}
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1, type: "spring", stiffness: 200 }}
                  >
                    <div className={`bg-${getPhaseColor(phase)} text-white rounded-xl p-6 mb-2 shadow-lg`}>
                      <motion.p
                        className="text-4xl font-bold font-display"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.7 + index * 0.1, type: "spring", stiffness: 300 }}
                      >
                        {count}
                      </motion.p>
                    </div>
                    <p className="text-sm font-medium capitalize font-display">{phase}</p>
                    <ProgressBar
                      value={clinicStats.totalPatients > 0 ? (count / clinicStats.totalPatients) * 100 : 0}
                      color={getPhaseColor(phase)}
                      size="sm"
                      className="mt-2"
                      animated
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {clinicStats.totalPatients > 0
                        ? `${Math.round(count / clinicStats.totalPatients * 100)}%`
                        : '0%'}
                    </p>
                  </motion.div>
                ))}
              </div>
            </AnimatedCardContent>
          </AnimatedCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {/* Employee Performance */}
          <AnimatedCard delay={0.7}>
            <AnimatedCardHeader>
              <AnimatedCardTitle className="flex items-center font-display">
                <UserCheck className="w-5 h-5 mr-2 text-summit-blue" />
                Employee Performance
              </AnimatedCardTitle>
              <AnimatedCardDescription>
                Staff assessment activity and patient load
              </AnimatedCardDescription>
            </AnimatedCardHeader>
            <AnimatedCardContent>
              <motion.div
                className="space-y-3"
                variants={container}
                initial="hidden"
                animate="show"
              >
                {employeePerformance.map((employee, index) => (
                  <motion.div
                    key={employee.id}
                    variants={item}
                    className="p-4 border-2 rounded-xl hover:bg-muted/50 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold font-display">{employee.name}</p>
                        <div className="flex gap-4 mt-2">
                          <Badge variant="outline" className="rounded-full">
                            <Users className="w-3 h-3 mr-1" />
                            {employee.patientCount} patients
                          </Badge>
                          <Badge variant="outline" className="rounded-full">
                            <ClipboardList className="w-3 h-3 mr-1" />
                            {employee.assessmentCount} assessments
                          </Badge>
                        </div>
                      </div>
                      {employee.lastAssessmentDate && (
                        <Badge variant="outline" className="text-xs rounded-full">
                          Last: {new Date(employee.lastAssessmentDate).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                ))}
                {employeePerformance.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No employee data available</p>
                )}
              </motion.div>
            </AnimatedCardContent>
          </AnimatedCard>

          {/* Top Performers */}
          <AnimatedCard delay={0.8}>
            <AnimatedCardHeader>
              <AnimatedCardTitle className="flex items-center font-display">
                <Award className="w-5 h-5 mr-2 text-summit-gold" />
                Top Performing Patients
              </AnimatedCardTitle>
              <AnimatedCardDescription>
                Most engaged patients by points earned
              </AnimatedCardDescription>
            </AnimatedCardHeader>
            <AnimatedCardContent>
              <motion.div
                className="space-y-3"
                variants={container}
                initial="hidden"
                animate="show"
              >
                {topPatients.map((patient, index) => (
                  <motion.div
                    key={patient.id}
                    variants={item}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between p-4 border-2 rounded-xl hover:bg-muted/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${getMedalColor(index)} flex items-center justify-center text-white font-bold shadow-lg`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        {index < 3 ? <Trophy className="w-5 h-5" /> : index + 1}
                      </motion.div>
                      <div>
                        <p className="font-semibold font-display">{patient.name}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs rounded-full">
                            <Trophy className="w-3 h-3 mr-1" />
                            {patient.points} pts
                          </Badge>
                          <Badge variant="outline" className="text-xs rounded-full">
                            <Flame className="w-3 h-3 mr-1" />
                            {patient.streak} days
                          </Badge>
                          <Badge className={`bg-${getPhaseColor(patient.phase)} text-white text-xs rounded-full`}>
                            {patient.phase}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {topPatients.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No patient data available</p>
                )}
              </motion.div>
            </AnimatedCardContent>
          </AnimatedCard>
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <AnimatedCard className="mt-8" delay={1}>
            <AnimatedCardHeader>
              <AnimatedCardTitle className="flex items-center font-display">
                <BarChart3 className="w-5 h-5 mr-2 text-summit-blue" />
                Clinic Summary
              </AnimatedCardTitle>
            </AnimatedCardHeader>
            <AnimatedCardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: ClipboardList, value: clinicStats.totalAssessments, label: 'Total Assessments', color: 'text-purple-600' },
                  { icon: Target, value: clinicStats.totalExercisesAssigned, label: 'Exercises Assigned', color: 'text-blue-600' },
                  { icon: UserCheck, value: clinicStats.totalEmployees, label: 'Staff Members', color: 'text-green-600' },
                  { icon: Calendar, value: `${Math.round(clinicStats.activePatients / Math.max(clinicStats.totalPatients, 1) * 100)}%`, label: 'Weekly Active Rate', color: 'text-orange-600' }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    className="text-center p-6 bg-gradient-to-br from-muted/50 to-transparent rounded-xl"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.1 + index * 0.1, type: "spring", stiffness: 200 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <stat.icon className={`w-10 h-10 ${stat.color} mx-auto mb-3`} />
                    <motion.p
                      className="text-3xl font-bold font-display"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.3 + index * 0.1, type: "spring", stiffness: 300 }}
                    >
                      {stat.value}
                    </motion.p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </AnimatedCardContent>
          </AnimatedCard>
        </motion.div>
      </main>
    </div>
  )
}