'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AnimatedCard, AnimatedCardContent, AnimatedCardHeader, AnimatedCardTitle } from '@/components/ui/animated-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  UserPlus, ChevronLeft, Mail, User, Shield,
  CheckCircle, AlertCircle, Loader2, Users, Flame
} from 'lucide-react'

function ClinicAddUserPageContent() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [badgeNumber, setBadgeNumber] = useState('')
  const [selectedRole, setSelectedRole] = useState<'firefighter' | 'chief'>('firefighter')
  const [isCreating, setIsCreating] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Set role from URL parameter
  useEffect(() => {
    const roleParam = searchParams.get('role')
    if (roleParam === 'chief' || roleParam === 'firefighter') {
      setSelectedRole(roleParam)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError('')
    setSuccess('')

    try {
      // Get current clinic user
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      // Get clinic user's profile to get station_id
      const { data: clinicData } = await supabase
        .from('users')
        .select('station_id, role')
        .eq('id', authUser.id)
        .single()

      if (!clinicData || !clinicData.station_id) {
        throw new Error('Clinic profile not found or no station assigned')
      }

      if (clinicData.role !== 'clinic' && clinicData.role !== 'admin') {
        throw new Error('Only clinic staff can create new users')
      }

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .single()

      if (existingUser) {
        throw new Error('A user with this email already exists')
      }

      // Generate a temporary password
      const tempPassword = `FireFMS${Math.random().toString(36).slice(-8)}`

      // Create auth user
      const { data: newAuthUser, error: authError } = await supabase.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name: name.trim()
        }
      })

      if (authError) {
        // If admin.createUser is not available, use signUp
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.toLowerCase().trim(),
          password: tempPassword,
          options: {
            data: {
              name: name.trim()
            }
          }
        })

        if (signUpError) throw signUpError
        if (!signUpData.user) throw new Error('Failed to create user account')

        // Insert user record
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: signUpData.user.id,
            name: name.trim(),
            email: email.toLowerCase().trim(),
            badge_number: badgeNumber.trim() || null,
            role: selectedRole,
            station_id: clinicData.station_id,
            points: 0,
            current_streak: 0,
            longest_streak: 0
          })

        if (insertError) throw insertError

      } else {
        if (!newAuthUser.user) throw new Error('Failed to create user account')

        // Insert user record
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: newAuthUser.user.id,
            name: name.trim(),
            email: email.toLowerCase().trim(),
            badge_number: badgeNumber.trim() || null,
            role: selectedRole,
            station_id: clinicData.station_id,
            points: 0,
            current_streak: 0,
            longest_streak: 0
          })

        if (insertError) throw insertError
      }

      const roleLabel = selectedRole === 'chief' ? 'Chief' : 'Firefighter'
      setSuccess(`${roleLabel} created successfully! Temporary password: ${tempPassword}`)

      // Clear form
      setName('')
      setEmail('')
      setBadgeNumber('')

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/clinic/team')
      }, 3000)

    } catch (error: any) {
      console.error('Error creating user:', error)
      setError(error.message || 'Failed to create account')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/clinic/team">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-black/30">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-base sm:text-xl font-bold text-white">Add New User</h1>
              <p className="text-xs sm:text-sm text-gray-400">Create a new account for the station</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl">
        {/* Success/Error Messages */}
        {success && (
          <Alert className="mb-6 bg-green-500/20 border-green-500/50 text-green-400">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              {success}
              <br />
              <span className="text-xs mt-1 block">
                Please share this password with the user securely.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 bg-red-500/20 border-red-500/50 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form Card */}
        <AnimatedCard className="bg-white/5 border-white/10">
          <AnimatedCardHeader>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${selectedRole === 'chief' ? 'bg-fire-gold/20' : 'bg-fire-red/20'}`}>
                {selectedRole === 'chief' ? (
                  <Shield className="h-6 w-6 text-fire-gold" />
                ) : (
                  <UserPlus className="h-6 w-6 text-fire-red" />
                )}
              </div>
              <AnimatedCardTitle className="text-white">
                New {selectedRole === 'chief' ? 'Chief' : 'Firefighter'} Account
              </AnimatedCardTitle>
            </div>
          </AnimatedCardHeader>

          <AnimatedCardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label className="text-gray-300">
                  User Role <span className="text-red-400">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={selectedRole === 'chief' ? 'default' : 'outline'}
                    onClick={() => setSelectedRole('chief')}
                    className={selectedRole === 'chief'
                      ? 'bg-fire-gold hover:bg-yellow-600 text-black'
                      : 'bg-white/10 text-white border-white/20 hover:bg-black/40'}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Fire Chief
                  </Button>
                  <Button
                    type="button"
                    variant={selectedRole === 'firefighter' ? 'default' : 'outline'}
                    onClick={() => setSelectedRole('firefighter')}
                    className={selectedRole === 'firefighter'
                      ? 'bg-fire-red hover:bg-red-700 text-white'
                      : 'bg-white/10 text-white border-white/20 hover:bg-black/40'}
                  >
                    <Flame className="mr-2 h-4 w-4" />
                    Firefighter
                  </Button>
                </div>
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">
                  Full Name <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                    placeholder="John Smith"
                    required
                    disabled={isCreating}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">
                  Email Address <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                    placeholder="john.smith@firestation.com"
                    required
                    disabled={isCreating}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  A temporary password will be generated for the new user
                </p>
              </div>

              {/* Badge Number Field */}
              <div className="space-y-2">
                <Label htmlFor="badge" className="text-gray-300">
                  Badge Number
                </Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="badge"
                    type="text"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                    placeholder={selectedRole === 'chief' ? 'C-001' : 'FF-1234'}
                    disabled={isCreating}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Optional - can be added later
                </p>
              </div>

              {/* Info Box */}
              <div className={`p-4 rounded-lg border ${
                selectedRole === 'chief' ? 'bg-fire-gold/10 border-fire-gold/20' : 'bg-blue-500/10 border-blue-500/20'
              }`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                    selectedRole === 'chief' ? 'text-fire-gold' : 'text-blue-400'
                  }`} />
                  <div className={`text-sm ${selectedRole === 'chief' ? 'text-fire-gold/90' : 'text-blue-300'}`}>
                    <p className="font-semibold mb-1">Account Creation Process:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>A temporary password will be automatically generated</li>
                      <li>The {selectedRole === 'chief' ? 'chief' : 'firefighter'} will be added to your station</li>
                      <li>They can log in immediately using their email and temp password</li>
                      <li>They should change their password after first login</li>
                      {selectedRole === 'chief' && (
                        <li className="text-fire-gold">Chiefs will have view-only access to their team</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isCreating || !name.trim() || !email.trim()}
                  className={`flex-1 ${
                    selectedRole === 'chief'
                      ? 'bg-fire-gold hover:bg-yellow-600 text-black'
                      : 'bg-fire-red hover:bg-red-700'
                  }`}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create {selectedRole === 'chief' ? 'Chief' : 'Firefighter'}
                    </>
                  )}
                </Button>
                <Link href="/clinic/team" className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isCreating}
                    className="w-full bg-white/10 text-white border-white/20 hover:bg-black/40"
                  >
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </AnimatedCardContent>
        </AnimatedCard>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Need help? Contact your FireFMS administrator
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ClinicAddUserPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-blue-400 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading...</h2>
        </div>
      </div>
    }>
      <ClinicAddUserPageContent />
    </Suspense>
  )
}
