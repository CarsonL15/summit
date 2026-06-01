'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { AnimatedCard, AnimatedCardContent, AnimatedCardDescription, AnimatedCardHeader, AnimatedCardTitle } from '@/components/ui/animated-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Users,
  UserPlus,
  ClipboardList,
  TrendingUp,
  Search,
  ChevronRight,
  Activity,
  Mail,
  User,
  Loader2,
  Mountain,
  Calendar
} from 'lucide-react'

interface Patient {
  id: string
  first_name: string
  last_name: string
  email: string
  patient_progress: {
    phase: string
    points: number
    streak_days: number
    last_activity_date: string | null
  }[]
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

export default function EmployeeDashboard() {
  const [user, setUser] = useState<any>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [newPatient, setNewPatient] = useState({
    firstName: '',
    lastName: '',
    email: '',
  })
  const [addingPatient, setAddingPatient] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/auth/login')
        return
      }

      // Fetch employee profile
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userData?.role !== 'employee' && userData?.role !== 'owner') {
        router.push('/patient')
        return
      }

      setUser(userData)

      // Fetch patients in the same clinic
      const { data: patientsData } = await supabase
        .from('users')
        .select(`
          id,
          first_name,
          last_name,
          email,
          patient_progress (
            phase,
            points,
            streak_days,
            last_activity_date
          )
        `)
        .eq('clinic_id', userData.clinic_id)
        .eq('role', 'patient')

      if (patientsData) {
        setPatients(patientsData as any)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPatient = async () => {
    if (!newPatient.firstName || !newPatient.lastName || !newPatient.email) {
      alert('Please fill in all fields')
      return
    }

    setAddingPatient(true)

    try {
      // Generate a random temporary password (user won't see this)
      const tempPassword = `TempPass${Math.random().toString(36).slice(-12)}!${Date.now()}`

      // Create auth user (without confirmation email)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newPatient.email,
        password: tempPassword,
        options: {
          emailRedirectTo: undefined, // Don't redirect
          data: {
            first_name: newPatient.firstName,
            last_name: newPatient.lastName,
          },
        },
      })

      if (authError) {
        alert(`Error creating patient: ${authError.message}`)
        return
      }

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: newPatient.email,
            first_name: newPatient.firstName,
            last_name: newPatient.lastName,
            role: 'patient',
            clinic_id: user.clinic_id,
          })

        if (profileError) {
          console.error('Profile error:', profileError)
          alert(`Failed to create patient profile: ${profileError.message}`)
          return
        }

        // Initialize patient progress
        await supabase
          .from('patient_progress')
          .insert({
            patient_id: authData.user.id,
            phase: 'analyze',
            points: 0,
            streak_days: 0,
            total_exercises_completed: 0,
          })

        // Send password reset email so patient can set their own password
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          newPatient.email,
          {
            redirectTo: `${window.location.origin}/auth/reset-password`,
          }
        )

        if (resetError) {
          console.error('Password reset email error:', resetError)
          alert(`Patient created, but failed to send setup email: ${resetError.message}\n\nYou can manually send them a password reset link.`)
        } else {
          alert(`Patient created successfully!\n\nAn email has been sent to ${newPatient.email} with instructions to set their password.`)
        }

        // Reset form and close modal
        setNewPatient({ firstName: '', lastName: '', email: '' })
        setIsAddPatientOpen(false)

        // Refresh patient list
        await fetchData()
      }
    } catch (error) {
      console.error('Error adding patient:', error)
      alert('An error occurred while adding the patient')
    } finally {
      setAddingPatient(false)
    }
  }

  const filteredPatients = patients.filter(patient =>
    `${patient.first_name} ${patient.last_name} ${patient.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const getPhaseColor = (phase: string): "phase-analyze" | "phase-mobilize" | "phase-stabilize" | "phase-optimize" => {
    const colors = {
      analyze: 'phase-analyze',
      mobilize: 'phase-mobilize',
      stabilize: 'phase-stabilize',
      optimize: 'phase-optimize',
    }
    return colors[phase as keyof typeof colors] as any || 'phase-analyze'
  }

  const getActivityStatus = (lastActivity: string | null) => {
    if (!lastActivity) return 'inactive'
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSinceActivity === 0) return 'active'
    if (daysSinceActivity <= 3) return 'recent'
    return 'inactive'
  }

  const getActivityBadge = (lastActivity: string | null) => {
    const status = getActivityStatus(lastActivity)
    if (status === 'active') {
      return <Badge className="bg-success text-white rounded-full">Active Today</Badge>
    }
    if (status === 'recent') {
      return <Badge className="bg-warning text-white rounded-full">Recently Active</Badge>
    }
    return <Badge variant="outline" className="rounded-full">Inactive</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Mountain className="w-16 h-16 mx-auto text-summit-blue animate-pulse" />
          <h2 className="text-xl font-semibold font-display">Loading dashboard...</h2>
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
                Employee Dashboard
              </h1>
              <p className="text-muted-foreground">Welcome back, {user?.first_name}</p>
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
        {/* Stats Overview */}
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
                  {patients.length}
                </motion.p>
              </AnimatedCardContent>
            </AnimatedCard>
          </motion.div>

          <motion.div variants={item}>
            <AnimatedCard className="bg-gradient-to-br from-green-500/10 to-transparent" delay={0.1}>
              <AnimatedCardHeader className="pb-2">
                <AnimatedCardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <Activity className="w-4 h-4 mr-1 text-green-500" />
                  Active Today
                </AnimatedCardTitle>
              </AnimatedCardHeader>
              <AnimatedCardContent>
                <motion.p
                  className="text-3xl font-bold font-display text-green-600"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                >
                  {patients.filter(p =>
                    getActivityStatus(p.patient_progress[0]?.last_activity_date) === 'active'
                  ).length}
                </motion.p>
              </AnimatedCardContent>
            </AnimatedCard>
          </motion.div>

          <motion.div variants={item}>
            <AnimatedCard className="bg-gradient-to-br from-orange-500/10 to-transparent" delay={0.2}>
              <AnimatedCardHeader className="pb-2">
                <AnimatedCardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1 text-orange-500" />
                  Average Streak
                </AnimatedCardTitle>
              </AnimatedCardHeader>
              <AnimatedCardContent>
                <motion.p
                  className="text-3xl font-bold font-display text-orange-600"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                >
                  {patients.length > 0
                    ? Math.round(
                        patients.reduce((acc, p) =>
                          acc + (p.patient_progress[0]?.streak_days || 0), 0
                        ) / patients.length
                      )
                    : 0
                  } <span className="text-lg font-normal">days</span>
                </motion.p>
              </AnimatedCardContent>
            </AnimatedCard>
          </motion.div>

          <motion.div variants={item}>
            <AnimatedCard className="bg-gradient-to-br from-purple-500/10 to-transparent" delay={0.3}>
              <AnimatedCardHeader className="pb-2">
                <AnimatedCardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <ClipboardList className="w-4 h-4 mr-1 text-purple-500" />
                  Pending Assessments
                </AnimatedCardTitle>
              </AnimatedCardHeader>
              <AnimatedCardContent>
                <motion.p
                  className="text-3xl font-bold font-display text-purple-600"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                >
                  3
                </motion.p>
              </AnimatedCardContent>
            </AnimatedCard>
          </motion.div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        >
          <Dialog open={isAddPatientOpen} onOpenChange={setIsAddPatientOpen}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <AnimatedCard className="cursor-pointer border-2 hover:border-summit-blue/50 transition-all" delay={0.5}>
                  <AnimatedCardHeader>
                    <AnimatedCardTitle className="flex items-center font-display">
                      <div className="w-12 h-12 bg-gradient-to-br from-summit-gold to-summit-gold-light rounded-xl flex items-center justify-center mr-3">
                        <UserPlus className="w-6 h-6 text-white" />
                      </div>
                      Add New Patient
                    </AnimatedCardTitle>
                    <AnimatedCardDescription>
                      Create patient account and send invitation
                    </AnimatedCardDescription>
                  </AnimatedCardHeader>
                </AnimatedCard>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-2xl">
              <DialogHeader>
                <DialogTitle className="font-display">Add New Patient</DialogTitle>
                <DialogDescription>
                  Create a new patient account. They will receive an email with login credentials.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="firstName" className="text-right font-medium">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={newPatient.firstName}
                    onChange={(e) => setNewPatient(prev => ({ ...prev, firstName: e.target.value }))}
                    className="col-span-3 rounded-xl"
                    placeholder="John"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="lastName" className="text-right font-medium">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={newPatient.lastName}
                    onChange={(e) => setNewPatient(prev => ({ ...prev, lastName: e.target.value }))}
                    className="col-span-3 rounded-xl"
                    placeholder="Doe"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newPatient.email}
                    onChange={(e) => setNewPatient(prev => ({ ...prev, email: e.target.value }))}
                    className="col-span-3 rounded-xl"
                    placeholder="john.doe@example.com"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddPatientOpen(false)}
                  disabled={addingPatient}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleAddPatient}
                  disabled={addingPatient}
                  className="rounded-xl bg-gradient-to-r from-summit-blue to-summit-blue-light hover:from-summit-blue-light hover:to-summit-blue text-white"
                >
                  {addingPatient ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Create & Send Invite
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/employee/assessment')}
          >
            <AnimatedCard
              className="cursor-pointer border-2 hover:border-summit-blue/50 transition-all"
              delay={0.6}
            >
              <AnimatedCardHeader>
                <AnimatedCardTitle className="flex items-center font-display">
                  <div className="w-12 h-12 bg-gradient-to-br from-summit-blue to-summit-blue-light rounded-xl flex items-center justify-center mr-3">
                    <ClipboardList className="w-6 h-6 text-white" />
                  </div>
                  New FMS Assessment
                </AnimatedCardTitle>
                <AnimatedCardDescription>
                  Conduct functional movement screen assessment
                </AnimatedCardDescription>
              </AnimatedCardHeader>
            </AnimatedCard>
          </motion.div>
        </motion.div>

        {/* Patient List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <AnimatedCard delay={0.7}>
            <AnimatedCardHeader>
              <AnimatedCardTitle className="font-display">Patient Roster</AnimatedCardTitle>
              <AnimatedCardDescription>
                Click on a patient to view detailed progress and manage exercises
              </AnimatedCardDescription>
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>
            </AnimatedCardHeader>
            <AnimatedCardContent>
              <motion.div
                className="space-y-3"
                variants={container}
                initial="hidden"
                animate="show"
              >
                {filteredPatients.map((patient, index) => {
                  const progress = patient.patient_progress[0]
                  return (
                    <motion.div
                      key={patient.id}
                      variants={item}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-4 border-2 rounded-xl hover:bg-muted/50 hover:border-summit-blue/30 transition-all cursor-pointer"
                      onClick={() => router.push(`/employee/patient/${patient.id}`)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold font-display text-lg">
                            {patient.first_name} {patient.last_name}
                          </h4>
                          <p className="text-sm text-muted-foreground">{patient.email}</p>
                          <div className="flex gap-2 mt-2">
                            {progress && (
                              <>
                                <Badge className={`bg-${getPhaseColor(progress.phase)} text-white rounded-full px-3`}>
                                  {progress.phase.toUpperCase()}
                                </Badge>
                                {getActivityBadge(progress.last_activity_date)}
                                <Badge variant="outline" className="rounded-full">
                                  {progress.streak_days} day streak
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </motion.div>
                  )
                })}
                {filteredPatients.length === 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-muted-foreground py-8"
                  >
                    No patients found
                  </motion.p>
                )}
              </motion.div>
            </AnimatedCardContent>
          </AnimatedCard>
        </motion.div>
      </main>
    </div>
  )
}