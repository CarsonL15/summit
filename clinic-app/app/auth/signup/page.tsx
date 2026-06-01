'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AnimatedCard, AnimatedCardContent, AnimatedCardDescription, AnimatedCardFooter, AnimatedCardHeader, AnimatedCardTitle } from '@/components/ui/animated-card'
import { Mountain, Mail, Lock, User, AlertCircle, ArrowRight, Loader2, UserPlus, CheckCircle } from 'lucide-react'

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

export default function SignupPage() {
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get('invite') // Invite code from employee

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // For MVP, we'll create a simple patient signup
      // In production, this would validate the invite code
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: 'patient', // Default to patient for now
          }
        }
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            role: 'patient',
            // clinic_id would be set based on invite code in production
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          setError(`Failed to create user profile: ${profileError.message}`)
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

        router.push('/patient')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-summit-blue/10 via-background to-summit-gold/10 p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-summit-blue/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-summit-gold/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full max-w-md"
      >
        <AnimatedCard className="border-2" hover={false}>
          <AnimatedCardHeader className="space-y-3 text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                delay: 0.1
              }}
              className="mx-auto"
            >
              {/* Logo or Mountain Icon */}
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-summit-gold to-summit-gold-light rounded-2xl flex items-center justify-center shadow-lg">
                <UserPlus className="w-10 h-10 text-white" />
              </div>
            </motion.div>

            <AnimatedCardTitle className="text-3xl font-bold font-display bg-gradient-to-r from-summit-blue to-summit-blue-light bg-clip-text text-transparent">
              Join Summit
            </AnimatedCardTitle>
            <AnimatedCardDescription className="text-base">
              {inviteCode
                ? 'Complete your registration to begin your recovery journey'
                : 'Create your account to reach new heights'
              }
            </AnimatedCardDescription>
          </AnimatedCardHeader>

          <form onSubmit={handleSignup}>
            <AnimatedCardContent className="space-y-4">
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-4"
              >
                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-xl flex items-start gap-2"
                  >
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </motion.div>
                )}

                {inviteCode && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-success/10 border border-success/30 text-success px-4 py-3 rounded-xl flex items-start gap-2"
                  >
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">You've been invited by your healthcare provider</span>
                  </motion.div>
                )}

                <motion.div variants={item} className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="flex items-center gap-2 text-foreground/90 font-medium">
                      <User className="w-4 h-4" />
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      disabled={loading}
                      className="h-12 rounded-xl border-2 focus:border-summit-blue transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-foreground/90 font-medium">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      disabled={loading}
                      className="h-12 rounded-xl border-2 focus:border-summit-blue transition-colors"
                    />
                  </div>
                </motion.div>

                <motion.div variants={item} className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-foreground/90 font-medium">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 rounded-xl border-2 focus:border-summit-blue transition-colors"
                  />
                </motion.div>

                <motion.div variants={item} className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2 text-foreground/90 font-medium">
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                    className="h-12 rounded-xl border-2 focus:border-summit-blue transition-colors"
                  />
                  <p className="text-xs text-muted-foreground pl-6">
                    Must be at least 6 characters
                  </p>
                </motion.div>
              </motion.div>
            </AnimatedCardContent>

            <AnimatedCardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-summit-gold to-summit-gold-light hover:from-summit-gold-light hover:to-summit-gold text-white font-semibold text-base shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-center text-muted-foreground"
              >
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="font-semibold text-summit-blue hover:text-summit-blue-light transition-colors"
                >
                  Sign in instead
                </Link>
              </motion.p>
            </AnimatedCardFooter>
          </form>
        </AnimatedCard>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-center text-muted-foreground mt-6"
        >
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </motion.p>
      </motion.div>
    </div>
  )
}