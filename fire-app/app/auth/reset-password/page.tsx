'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Lock, Loader2, Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [linkExpired, setLinkExpired] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check for error from callback route (e.g. expired link)
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('error') === 'link_expired') {
      setLinkExpired(true)
      return
    }

    // Also check URL hash for errors (legacy flow)
    const hash = window.location.hash.substring(1)
    const hashParams = new URLSearchParams(hash)
    if (hashParams.get('error_code') === 'otp_expired' || hashParams.get('error') === 'access_denied') {
      setLinkExpired(true)
      return
    }

    // PKCE flow: session was already set by /auth/callback route
    // Legacy flow: try to extract tokens from hash
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')

    if (accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ error }) => {
        if (error) {
          setLinkExpired(true)
        } else {
          window.history.replaceState(null, '', window.location.pathname)
          setSessionReady(true)
        }
      })
    } else {
      // Check if session exists (set by callback route or already logged in)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          window.history.replaceState(null, '', window.location.pathname)
          setSessionReady(true)
        } else {
          // No session and no tokens — link is invalid
          setLinkExpired(true)
        }
      })
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) throw updateError

      setSuccess(true)

      // Redirect based on user role
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

      setTimeout(() => {
        router.push(redirectPath)
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="bg-white/5 border-white/10 w-full max-w-md">
        <CardHeader className="text-center">
          <div className="inline-flex p-3 bg-blue-500/20 rounded-full mx-auto mb-3">
            <Lock className="h-8 w-8 text-blue-400" />
          </div>
          <CardTitle className="text-white text-xl">Set Your Password</CardTitle>
          <p className="text-gray-400 text-sm mt-2">
            Create a password to access your Tactical Athlete account
          </p>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center py-4">
              <div className="inline-flex p-3 bg-green-500/20 rounded-full mb-4">
                <CheckCircle className="h-10 w-10 text-green-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Password Set!</h3>
              <p className="text-gray-400 text-sm">Redirecting to your dashboard...</p>
            </div>
          ) : linkExpired ? (
            <div className="text-center py-6">
              <div className="inline-flex p-3 bg-red-500/20 rounded-full mb-4">
                <AlertCircle className="h-10 w-10 text-red-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Link Expired</h3>
              <p className="text-gray-400 text-sm mb-4">
                This password setup link has expired. Please contact your department to request a new one.
              </p>
              <Button
                onClick={() => router.push('/auth/login')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Go to Login
              </Button>
            </div>
          ) : !sessionReady ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Verifying your link...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="bg-red-500/20 border-red-500/50 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 pr-10"
                    placeholder="At least 8 characters"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-gray-300">Confirm Password</Label>
                <Input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  placeholder="Confirm your password"
                  required
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting Password...
                  </>
                ) : (
                  'Set Password & Sign In'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
