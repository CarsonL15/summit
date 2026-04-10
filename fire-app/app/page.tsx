'use client'

import Link from 'next/link'
import { Flame, Shield, Users, Trophy, Target, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function FireLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="relative container mx-auto px-4 py-20">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 sm:mb-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <Flame className="h-6 w-6 sm:h-8 sm:w-8 text-fire-red" />
              <h1 className="text-xl sm:text-2xl font-bold text-white">FireFMS</h1>
            </div>
            <Link href="/auth/login">
              <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-black/40 text-sm sm:text-base">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Hero Content */}
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-fire-red/20 text-fire-red border-fire-red/30 text-xs sm:text-sm">
              Functional Movement Screen for First Responders
            </Badge>

            {/* Tagline */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-fire-gold mb-4 sm:mb-6">
              Test. Target. Track. Transform.
            </h2>

            {/* Description */}
            <p className="text-sm sm:text-base text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto px-4 leading-relaxed">
              We start with real data—objective movement testing to uncover risk before injury strikes.
              From there, we deliver targeted mobility and strength training based on your department's
              specific needs. Progress is tracked over time with clear metrics that guide smarter decisions
              and better outcomes. The result? Tactical athletes who move better, perform stronger, and
              stay in the game longer—while your department saves money on injuries, lost time, and
              long-term costs.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-black/40 w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-12 sm:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
            Built for Fire Departments
          </h3>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto px-4">
            Comprehensive movement screening and training system tailored to the unique
            physical demands of firefighting.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <Card className="bg-white/5 border-white/10 p-6">
            <div className="rounded-lg bg-fire-red/20 w-12 h-12 flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-fire-red" />
            </div>
            <h4 className="text-xl font-semibold text-white mb-2">
              FMS Assessments
            </h4>
            <p className="text-gray-400">
              Professional 7-pattern movement screens to identify asymmetries and
              movement deficiencies before they become injuries.
            </p>
          </Card>

          <Card className="bg-white/5 border-white/10 p-6">
            <div className="rounded-lg bg-fire-gold/20 w-12 h-12 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-fire-gold" />
            </div>
            <h4 className="text-xl font-semibold text-white mb-2">
              3-Week Programs
            </h4>
            <p className="text-gray-400">
              Targeted mini-series programs that progressively build mobility,
              stability, and strength specific to firefighting tasks.
            </p>
          </Card>

          <Card className="bg-white/5 border-white/10 p-6">
            <div className="rounded-lg bg-blue-500/20 w-12 h-12 flex items-center justify-center mb-4">
              <Trophy className="h-6 w-6 text-blue-400" />
            </div>
            <h4 className="text-xl font-semibold text-white mb-2">
              Gamified Training
            </h4>
            <p className="text-gray-400">
              Points, streaks, leaderboards, and achievements keep your crew
              motivated and engaged with their corrective exercises.
            </p>
          </Card>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-black/30 py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            <div>
              <div className="text-2xl sm:text-4xl font-bold text-fire-gold mb-1 sm:mb-2">73%</div>
              <div className="text-xs sm:text-sm text-gray-400">Injury Reduction</div>
            </div>
            <div>
              <div className="text-2xl sm:text-4xl font-bold text-fire-gold mb-1 sm:mb-2">3-Week</div>
              <div className="text-xs sm:text-sm text-gray-400">Program Cycles</div>
            </div>
            <div>
              <div className="text-2xl sm:text-4xl font-bold text-fire-gold mb-1 sm:mb-2">10+</div>
              <div className="text-xs sm:text-sm text-gray-400">Departments Using</div>
            </div>
            <div>
              <div className="text-2xl sm:text-4xl font-bold text-fire-gold mb-1 sm:mb-2">500+</div>
              <div className="text-xs sm:text-sm text-gray-400">Firefighters Trained</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-12 sm:py-20">
        <Card className="bg-gradient-to-r from-fire-red/20 to-fire-gold/20 border-fire-red/30 p-6 sm:p-8 md:p-12">
          <div className="text-center">
            <Users className="h-8 w-8 sm:h-12 sm:w-12 text-fire-gold mx-auto mb-3 sm:mb-4" />
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">
              Ready to Get Your Department Started?
            </h3>
            <p className="text-sm sm:text-base text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              See how FireFMS can help reduce injuries and improve
              performance across your entire department.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/auth/login">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-gray-100 w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className="container mx-auto px-4 pb-12">
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            Functional Movement Screen for First Responders
          </p>
        </div>
      </div>
    </div>
  )
}