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
import { Flame, Shield, AlertCircle, User, Lock, Activity, ClipboardCheck, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDemo, setSelectedDemo] = useState<'chief' | 'firefighter' | 'clinic' | 'assessor' | null>(null)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetStep, setResetStep] = useState<'email' | 'code' | 'success'>('email')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
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
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim())

      if (error) {
        setResetError(error.message)
        return
      }

      setResetStep('code')
    } catch {
      setResetError('An unexpected error occurred')
    } finally {
      setResetLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetError('')

    if (newPassword.length < 8) {
      setResetError('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setResetError('Passwords do not match')
      return
    }

    setVerifyLoading(true)
    try {
      const { error: otpError } = await supabase.auth.verifyOtp({
        email: resetEmail.trim(),
        token: otpCode.trim(),
        type: 'recovery',
      })

      if (otpError) {
        setResetError(otpError.message.includes('expired')
          ? 'Code has expired. Please request a new one.'
          : 'Invalid code. Please check and try again.')
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        setResetError(updateError.message)
        return
      }

      setResetStep('success')

      const { data: { user } } = await supabase.auth.getUser()
      let redirectPath = '/firefighter'
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single() as { data: { role: string } | null }
        if (profile?.role === 'chief') redirectPath = '/chief'
        else if (profile?.role === 'clinic') redirectPath = '/clinic'
        else if (profile?.role === 'assessor') redirectPath = '/assessor'
      }

      setTimeout(() => router.push(redirectPath), 2000)
    } catch {
      setResetError('An unexpected error occurred')
    } finally {
      setVerifyLoading(false)
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
                      setResetStep('email')
                      setResetError('')
                      setOtpCode('')
                      setNewPassword('')
                      setConfirmNewPassword('')
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
                  {resetStep === 'success' ? 'Password Reset!' : resetStep === 'code' ? 'Enter Reset Code' : 'Reset Password'}
                </CardTitle>
                {resetStep === 'email' && (
                  <CardDescription className="text-gray-400">
                    Enter your email and we&apos;ll send you a 6-digit code to reset your password.
                  </CardDescription>
                )}
                {resetStep === 'code' && (
                  <CardDescription className="text-gray-400">
                    We sent a 6-digit code to <strong className="text-gray-300">{resetEmail}</strong>. Enter it below with your new password.
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent>
                {resetStep === 'success' ? (
                  <div className="text-center py-4">
                    <div className="inline-flex p-3 bg-green-500/20 rounded-full mb-4">
                      <CheckCircle className="h-10 w-10 text-green-400" />
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">Password Updated</h3>
                    <p className="text-gray-400 text-sm">Redirecting to your dashboard...</p>
                  </div>
                ) : resetStep === 'code' ? (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    {resetError && (
                      <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{resetError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="otp-code" className="text-gray-300">6-Digit Code</Label>
                      <Input
                        id="otp-code"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        required
                        disabled={verifyLoading}
                        className="bg-white/10 border-white/20 text-white text-center text-2xl tracking-[0.3em] font-mono placeholder:text-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-gray-300">New Password</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 8 characters"
                          required
                          disabled={verifyLoading}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-new-password" className="text-gray-300">Confirm Password</Label>
                      <Input
                        id="confirm-new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Confirm your password"
                        required
                        disabled={verifyLoading}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={verifyLoading || otpCode.length !== 6 || !newPassword || !confirmNewPassword}
                      className="w-full bg-fire-red hover:bg-red-700 text-white"
                    >
                      {verifyLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Resetting Password...
                        </>
                      ) : (
                        'Reset Password'
                      )}
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setResetStep('email')
                          setResetError('')
                          setOtpCode('')
                        }}
                        className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        Didn&apos;t receive a code? Go back to resend
                      </button>
                    </div>
                  </form>
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
                      {resetLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Reset Code'
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>

              {resetStep !== 'success' && (
                <CardFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-gray-400 hover:text-white hover:bg-white/5"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    Cancel
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}