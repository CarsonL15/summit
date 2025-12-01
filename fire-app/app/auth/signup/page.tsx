'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Flame, User, Mail, Lock, Shield, AlertCircle, CheckCircle } from 'lucide-react'

export default function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [badgeNumber, setBadgeNumber] = useState('')
  const [role, setRole] = useState<'firefighter' | 'chief'>('firefighter')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Validation
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match')
      }

      if (!name.trim()) {
        throw new Error('Name is required')
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .single()

      if (existingUser) {
        throw new Error('An account with this email already exists')
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password: password,
        options: {
          data: {
            name: name.trim(),
            role: role
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to create account')

      // Get or create default station for new users
      let stationId: string | null = null

      // Check if there's a default station
      const { data: stations } = await supabase
        .from('stations')
        .select('id')
        .limit(1)
        .single()

      if (stations) {
        stationId = stations.id
      } else {
        // Create a default station if none exists
        const { data: newStation } = await supabase
          .from('stations')
          .insert({
            name: 'Fire Station 1',
            department: 'fire',
            city: 'Unassigned',
            state: 'Unassigned'
          })
          .select()
          .single()

        stationId = newStation?.id || null
      }

      // Create user profile
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          name: name.trim(),
          email: email.toLowerCase().trim(),
          badge_number: badgeNumber.trim() || null,
          role: role,
          station_id: stationId,
          points: 0,
          current_streak: 0,
          longest_streak: 0
        })

      if (insertError) throw insertError

      setSuccess(true)

      // Wait 2 seconds then redirect to appropriate dashboard
      setTimeout(() => {
        if (role === 'chief') {
          router.push('/chief')
        } else {
          router.push('/firefighter')
        }
      }, 2000)

    } catch (error: any) {
      console.error('Sign up error:', error)
      setError(error.message || 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-white/5 backdrop-blur border-white/10">
            <CardContent className="p-8 text-center">
              <div className="p-4 bg-green-500/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Account Created!</h2>
              <p className="text-gray-400 mb-4">
                Welcome to FireFMS, {name}! Redirecting you to your dashboard...
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="h-2 w-2 bg-fire-gold rounded-full animate-bounce"></div>
                <div className="h-2 w-2 bg-fire-gold rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="h-2 w-2 bg-fire-gold rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-fire-red/20 rounded-full">
              <Flame className="h-10 w-10 text-fire-red" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">FireFMS</h1>
          <p className="text-gray-400">Create Your Account</p>
        </div>

        <Card className="bg-white/5 backdrop-blur border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Sign Up</CardTitle>
            <CardDescription className="text-gray-400">
              Join your department's training program
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSignUp} className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label className="text-gray-300">I am a:</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={role === 'firefighter' ? 'default' : 'outline'}
                    className={role === 'firefighter'
                      ? 'bg-fire-gold hover:bg-yellow-600 text-black'
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}
                    onClick={() => setRole('firefighter')}
                  >
                    <Flame className="mr-2 h-4 w-4" />
                    Firefighter
                  </Button>
                  <Button
                    type="button"
                    variant={role === 'chief' ? 'default' : 'outline'}
                    className={role === 'chief'
                      ? 'bg-fire-red hover:bg-red-700 text-white'
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}
                    onClick={() => setRole('chief')}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Fire Chief
                  </Button>
                </div>
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@firestation.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Badge Number (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="badge" className="text-gray-300">
                  Badge Number <span className="text-xs text-gray-500">(optional)</span>
                </Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="badge"
                    type="text"
                    placeholder="FF-1234"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>
                <p className="text-xs text-gray-500">At least 6 characters</p>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-fire-red hover:bg-red-700 text-white"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-gray-400">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-fire-gold hover:text-yellow-500 transition-colors">
                Sign in
              </Link>
            </div>

            <div className="text-center text-sm text-gray-400">
              <Link href="/" className="hover:text-white transition-colors">
                ← Back to Home
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
