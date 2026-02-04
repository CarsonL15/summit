'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AnimatedCard, AnimatedCardContent, AnimatedCardDescription, AnimatedCardFooter, AnimatedCardHeader, AnimatedCardTitle } from '@/components/ui/animated-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Mountain, Mail, Lock, AlertCircle, ArrowRight, Loader2 } from 'lucide-react'
import Image from 'next/image'

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

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      // Get user role and redirect accordingly
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (userData) {
          router.push(`/${userData.role}`)
        } else {
          router.push('/')
        }
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
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-summit-blue to-summit-blue-light rounded-2xl flex items-center justify-center shadow-lg">
                <Mountain className="w-10 h-10 text-white" />
              </div>
            </motion.div>

            <AnimatedCardTitle className="text-3xl font-bold font-display bg-gradient-to-r from-summit-blue to-summit-blue-light bg-clip-text text-transparent">
              Welcome to Summit
            </AnimatedCardTitle>
            <AnimatedCardDescription className="text-base">
              Begin your journey to recovery
            </AnimatedCardDescription>
          </AnimatedCardHeader>

          <form onSubmit={handleLogin}>
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

                <motion.div variants={item} className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-foreground/90 font-medium">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 rounded-xl border-2 focus:border-summit-blue transition-colors"
                  />
                </motion.div>

                <motion.div variants={item} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="flex items-center gap-2 text-foreground/90 font-medium">
                      <Lock className="w-4 h-4" />
                      Password
                    </Label>
                    <Link
                      href="/auth/reset-password"
                      className="text-xs text-summit-blue hover:text-summit-blue-light transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 rounded-xl border-2 focus:border-summit-blue transition-colors"
                  />
                </motion.div>
              </motion.div>
            </AnimatedCardContent>

            <AnimatedCardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-summit-blue to-summit-blue-light hover:from-summit-blue-light hover:to-summit-blue text-white font-semibold text-base shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
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
                Don't have an account?{' '}
                <Link
                  href="/auth/signup"
                  className="font-semibold text-summit-blue hover:text-summit-blue-light transition-colors"
                >
                  Create one
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
          By signing in, you agree to our Terms of Service and Privacy Policy
        </motion.p>
      </motion.div>
    </div>
  )
}