'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  Mail
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

export default function EmployeeDashboard() {
  const [user, setUser] = useState<any>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false)
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

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newPatient.email,
        password: tempPassword,
        options: {
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
      return <Badge className="bg-green-500 text-white">Active Today</Badge>
    }
    if (status === 'recent') {
      return <Badge className="bg-yellow-500 text-white">Recently Active</Badge>
    }
    return <Badge variant="outline">Inactive</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading dashboard...</h2>
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
                Employee Dashboard
              </h1>
              <p className="text-gray-600">Manage and monitor patient progress</p>
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
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                <Users className="inline w-4 h-4 mr-1" />
                Total Patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{patients.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                <Activity className="inline w-4 h-4 mr-1" />
                Active Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {patients.filter(p =>
                  getActivityStatus(p.patient_progress[0]?.last_activity_date) === 'active'
                ).length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                <TrendingUp className="inline w-4 h-4 mr-1" />
                Average Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {patients.length > 0
                  ? Math.round(
                      patients.reduce((acc, p) =>
                        acc + (p.patient_progress[0]?.streak_days || 0), 0
                      ) / patients.length
                    )
                  : 0
                } days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                <ClipboardList className="inline w-4 h-4 mr-1" />
                Pending Assessments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">3</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Dialog open={isAddPatientOpen} onOpenChange={setIsAddPatientOpen}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-lg transition">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Add New Patient
                  </CardTitle>
                  <CardDescription>
                    Create patient account and send invitation
                  </CardDescription>
                </CardHeader>
              </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Patient</DialogTitle>
                <DialogDescription>
                  Create a new patient account. They will receive an email with login credentials.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="firstName" className="text-right">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={newPatient.firstName}
                    onChange={(e) => setNewPatient(prev => ({ ...prev, firstName: e.target.value }))}
                    className="col-span-3"
                    placeholder="John"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="lastName" className="text-right">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={newPatient.lastName}
                    onChange={(e) => setNewPatient(prev => ({ ...prev, lastName: e.target.value }))}
                    className="col-span-3"
                    placeholder="Doe"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newPatient.email}
                    onChange={(e) => setNewPatient(prev => ({ ...prev, email: e.target.value }))}
                    className="col-span-3"
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
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleAddPatient}
                  disabled={addingPatient}
                >
                  {addingPatient ? (
                    'Creating...'
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

          <Card
            className="cursor-pointer hover:shadow-lg transition"
            onClick={() => router.push('/employee/assessment')}
          >
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClipboardList className="w-5 h-5 mr-2" />
                New FMS Assessment
              </CardTitle>
              <CardDescription>
                Conduct functional movement screen assessment
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Patient List */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Roster</CardTitle>
            <CardDescription>
              Click on a patient to view detailed progress and manage exercises
            </CardDescription>
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredPatients.map((patient) => {
                const progress = patient.patient_progress[0]
                return (
                  <div
                    key={patient.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => router.push(`/employee/patient/${patient.id}`)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">
                          {patient.first_name} {patient.last_name}
                        </h4>
                        <p className="text-sm text-gray-600">{patient.email}</p>
                        <div className="flex gap-2 mt-2">
                          {progress && (
                            <>
                              <Badge className={`${getPhaseColor(progress.phase)} text-white`}>
                                {progress.phase.toUpperCase()}
                              </Badge>
                              {getActivityBadge(progress.last_activity_date)}
                              <Badge variant="outline">
                                {progress.streak_days} day streak
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                )
              })}
              {filteredPatients.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No patients found
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}