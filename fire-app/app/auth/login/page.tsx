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
import { Flame, Shield, AlertCircle, User, Lock, Activity, ClipboardCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDemo, setSelectedDemo] = useState<'chief' | 'firefighter' | 'clinic' | 'assessor' | null>(null)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      // Get user role from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('email', email)
        .single()

      if (userError) {
        router.push('/firefighter') // Default to firefighter dashboard
        return
      }

      // Redirect based on role
      if (userData?.role === 'assessor') {
        router.push('/assessor')
      } else if (userData?.role === 'clinic') {
        router.push('/clinic')
      } else if (userData?.role === 'admin') {
        router.push('/admin')
      } else if (userData?.role === 'chief') {
        router.push('/chief')
      } else {
        router.push('/firefighter')
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = (type: 'chief' | 'firefighter' | 'clinic' | 'assessor') => {
    setSelectedDemo(type)
    if (type === 'chief') {
      setEmail('chief@firestation1.com')
      setPassword('demo123')
    } else if (type === 'clinic') {
      setEmail('clinic@firestation1.com')
      setPassword('demo123')
    } else if (type === 'assessor') {
      setEmail('assessor@firestation1.com')
      setPassword('demo123')
    } else {
      setEmail('john@firestation1.com')
      setPassword('demo123')
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    setResetError('')

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${appUrl}/auth/reset-password`,
      })

      if (error) {
        setResetError(error.message)
        return
      }

      setResetSent(true)
    } catch {
      setResetError('An unexpected error occurred')
    } finally {
      setResetLoading(false)
    }
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
          <p className="text-gray-400">Functional Movement Screen for First Responders</p>
        </div>

        <Card className="bg-white/5 backdrop-blur border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Sign In</CardTitle>
            <CardDescription className="text-gray-400">
              Access your training dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Demo Account Selector - only shown in development */}
            {process.env.NODE_ENV === 'development' && (
              <>
                <div className="space-y-3">
                  <Label className="text-gray-300">Quick Demo Access</Label>
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      type="button"
                      variant={selectedDemo === 'clinic' ? 'default' : 'outline'}
                      className={selectedDemo === 'clinic'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-white/10 text-white border-white/20 hover:bg-black/40'}
                      onClick={() => fillDemoCredentials('clinic')}
                    >
                      <Activity className="mr-1 h-4 w-4" />
                      Clinic
                    </Button>
                    <Button
                      type="button"
                      variant={selectedDemo === 'assessor' ? 'default' : 'outline'}
                      className={selectedDemo === 'assessor'
                        ? 'bg-teal-600 hover:bg-teal-700 text-white'
                        : 'bg-white/10 text-white border-white/20 hover:bg-black/40'}
                      onClick={() => fillDemoCredentials('assessor')}
                    >
                      <ClipboardCheck className="mr-1 h-4 w-4" />
                      Assessor
                    </Button>
                    <Button
                      type="button"
                      variant={selectedDemo === 'chief' ? 'default' : 'outline'}
                      className={selectedDemo === 'chief'
                        ? 'bg-fire-red hover:bg-red-700 text-white'
                        : 'bg-white/10 text-white border-white/20 hover:bg-black/40'}
                      onClick={() => fillDemoCredentials('chief')}
                    >
                      <Shield className="mr-1 h-4 w-4" />
                      Chief
                    </Button>
                    <Button
                      type="button"
                      variant={selectedDemo === 'firefighter' ? 'default' : 'outline'}
                      className={selectedDemo === 'firefighter'
                        ? 'bg-fire-gold hover:bg-yellow-600 text-black'
                        : 'bg-white/10 text-white border-white/20 hover:bg-black/40'}
                      onClick={() => fillDemoCredentials('firefighter')}
                    >
                      <Flame className="mr-1 h-4 w-4" />
                      FF
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-gray-500">Or sign in manually</span>
                  </div>
                </div>
              </>
            )}

            {error && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-300">Password</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true)
                      setResetEmail(email)
                      setResetSent(false)
                      setResetError('')
                    }}
                    className="text-xs text-fire-gold hover:text-yellow-400 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-gray-400">
              <Link href="/" className="hover:text-white transition-colors">
                ← Back to Home
              </Link>
            </div>

            {/* Demo Info - only shown in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="w-full p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5" />
                  <div className="text-xs text-blue-300">
                    <p className="font-semibold mb-1">Demo Accounts:</p>
                    <p>Clinic: clinic@firestation1.com</p>
                    <p>Assessor: assessor@firestation1.com</p>
                    <p>Chief: chief@firestation1.com</p>
                    <p>Firefighter: john@firestation1.com</p>
                    <p className="mt-1">Password: demo123</p>
                  </div>
                </div>
              </div>
            )}
          </CardFooter>
        </Card>

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <Card className="w-full max-w-md bg-slate-900 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">
                  {resetSent ? 'Check Your Email' : 'Reset Password'}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {resetSent
                    ? 'If an account exists with that email, you\'ll receive a password reset link.'
                    : 'Enter your email and we\'ll send you a link to reset your password.'}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {resetSent ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="text-sm text-green-400">
                        A reset link has been sent to <strong>{resetEmail}</strong>. Check your inbox and spam folder.
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      The link will expire in 1 hour. If you don't receive it, try again or contact your administrator.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    {resetError && (
                      <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{resetError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="text-gray-300">Email</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="your.email@firestation.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={resetLoading || !resetEmail.trim()}
                      className="w-full bg-fire-red hover:bg-red-700 text-white"
                    >
                      {resetLoading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                  </form>
                )}
              </CardContent>

              <CardFooter>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-gray-400 hover:text-white hover:bg-white/5"
                  onClick={() => setShowForgotPassword(false)}
                >
                  {resetSent ? 'Back to Sign In' : 'Cancel'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}