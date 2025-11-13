'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AnimatedCard, AnimatedCardContent, AnimatedCardDescription, AnimatedCardHeader, AnimatedCardTitle } from '@/components/ui/animated-card'
import {
  Mountain,
  Users,
  TrendingUp,
  Award,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Target,
  Heart,
  Activity,
  Brain,
  Zap,
  Shield,
  Sun,
  Moon
} from 'lucide-react'
import { useTheme } from 'next-themes'

export default function Home() {
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userData) {
        router.push(`/${userData.role}`)
      }
    }
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

  const features = [
    {
      icon: Brain,
      title: 'FMS Assessment',
      description: 'Scientific movement screening that identifies your unique needs',
      color: 'from-summit-blue to-summit-blue-light',
      iconColor: 'text-summit-blue'
    },
    {
      icon: Target,
      title: 'Personalized Programs',
      description: 'Automatically generated exercises tailored to your assessment',
      color: 'from-phase-analyze to-phase-analyze-dark',
      iconColor: 'text-phase-analyze'
    },
    {
      icon: TrendingUp,
      title: 'Track Progress',
      description: 'Visualize your journey through four phases of recovery',
      color: 'from-phase-mobilize to-phase-mobilize-dark',
      iconColor: 'text-phase-mobilize'
    },
    {
      icon: Award,
      title: 'Stay Motivated',
      description: 'Earn points, maintain streaks, and unlock achievements',
      color: 'from-summit-gold to-summit-gold-dark',
      iconColor: 'text-summit-gold'
    },
    {
      icon: Shield,
      title: 'Professional Guidance',
      description: 'Work with certified practitioners every step of the way',
      color: 'from-phase-stabilize to-phase-stabilize-dark',
      iconColor: 'text-phase-stabilize'
    },
    {
      icon: Zap,
      title: 'Real Results',
      description: 'Evidence-based approach that gets you back to peak performance',
      color: 'from-phase-optimize to-phase-optimize-dark',
      iconColor: 'text-phase-optimize'
    }
  ]

  const phases = [
    { name: 'Analyze', color: 'bg-phase-analyze' },
    { name: 'Mobilize', color: 'bg-phase-mobilize' },
    { name: 'Stabilize', color: 'bg-phase-stabilize' },
    { name: 'Optimize', color: 'bg-phase-optimize' }
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-summit-blue/5 via-background to-summit-gold/5 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-summit-blue/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-summit-gold/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-summit-blue/5 rounded-full blur-3xl" />
      </div>

      {/* Navigation Bar */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 flex justify-between items-center px-6 lg:px-12 py-6"
      >
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-summit-blue to-summit-blue-light rounded-xl flex items-center justify-center">
            <Mountain className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-display font-bold bg-gradient-to-r from-summit-blue to-summit-blue-light bg-clip-text text-transparent">
            Summit
          </span>
        </div>

        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-xl"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        )}
      </motion.nav>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 pt-16 pb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="flex justify-center mb-8"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-summit-blue to-summit-blue-light rounded-2xl flex items-center justify-center shadow-2xl">
              <Mountain className="w-12 h-12 text-white" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-7xl font-display font-bold mb-6 bg-gradient-to-r from-summit-blue via-summit-blue-light to-summit-gold bg-clip-text text-transparent"
          >
            Summit
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-muted-foreground mb-4"
          >
            Transform rehabilitation with gamified exercise management
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-2 mb-10"
          >
            {phases.map((phase, index) => (
              <motion.div
                key={phase.name}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1, type: "spring", stiffness: 300 }}
                className="flex items-center gap-2"
              >
                <div className={`w-3 h-3 rounded-full ${phase.color}`} />
                <span className="text-sm text-muted-foreground">{phase.name}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/auth/login">
              <Button
                size="lg"
                className="px-8 py-6 text-lg rounded-xl bg-gradient-to-r from-summit-blue to-summit-blue-light hover:from-summit-blue-light hover:to-summit-blue transition-all hover:scale-105 shadow-lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-6 text-lg rounded-xl border-2 hover:bg-muted transition-all hover:scale-105"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 px-4 py-1 rounded-xl bg-gradient-to-r from-summit-blue/10 to-summit-gold/10 border-summit-blue/20">
            <Sparkles className="w-3 h-3 mr-1" />
            Your Journey Starts Here
          </Badge>
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 bg-gradient-to-r from-summit-blue to-summit-gold bg-clip-text text-transparent">
            Your Path to Recovery
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience a revolutionary approach to rehabilitation that combines science,
            gamification, and personalized care
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={item}>
              <AnimatedCard className="h-full border-2 hover:border-summit-blue/30 transition-colors">
                <AnimatedCardHeader>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}
                  >
                    <feature.icon className="w-7 h-7 text-white" />
                  </motion.div>
                  <AnimatedCardTitle className="text-xl font-display">
                    {feature.title}
                  </AnimatedCardTitle>
                </AnimatedCardHeader>
                <AnimatedCardContent>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </AnimatedCardContent>
              </AnimatedCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { label: 'Active Patients', value: '500+', icon: Users },
            { label: 'Exercises Completed', value: '10,000+', icon: Activity },
            { label: 'Success Rate', value: '94%', icon: TrendingUp },
            { label: 'Partner Clinics', value: '25+', icon: Heart }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.3 + index * 0.1, type: "spring", stiffness: 200 }}
              className="text-center"
            >
              <stat.icon className="w-8 h-8 mx-auto mb-2 text-summit-gold" />
              <div className="text-3xl font-bold bg-gradient-to-r from-summit-blue to-summit-gold bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="relative z-10 bg-gradient-to-r from-summit-blue to-summit-blue-light py-20 mt-20"
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-4xl mx-auto text-center px-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center"
          >
            <Mountain className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6 }}
            className="text-4xl md:text-5xl font-display font-bold mb-4 text-white"
          >
            Ready to climb your mountain?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.7 }}
            className="text-xl mb-10 text-white/90"
          >
            Join Summit and transform your rehabilitation journey today
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="px-10 py-6 text-lg rounded-xl bg-white text-summit-blue hover:bg-gray-100 transition-all hover:scale-105 shadow-2xl"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start Your Journey
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button
                variant="outline"
                size="lg"
                className="px-10 py-6 text-lg rounded-xl border-2 border-white text-white hover:bg-white/10 transition-all hover:scale-105"
              >
                Sign In
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="relative z-10 bg-background border-t py-12 mt-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-summit-blue to-summit-blue-light rounded-lg flex items-center justify-center">
                  <Mountain className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-display font-bold">Summit</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Transforming rehabilitation through gamification and personalized care.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-foreground transition-colors">Demo</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
                <li><Link href="/careers" className="hover:text-foreground transition-colors">Careers</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link></li>
                <li><Link href="/cookies" className="hover:text-foreground transition-colors">Cookies</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Summit. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}