'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Shield, Stethoscope, ClipboardCheck, Flame, UserCog,
  LogOut, ChevronRight, User
} from 'lucide-react'
import { Database } from '@/types/database'

type UserData = Database['public']['Tables']['users']['Row']

export default function AdminDashboard() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (!userData || userData.role !== 'admin') {
        router.push('/auth/login')
        return
      }

      setUser(userData)
    } catch {
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-purple-400 animate-pulse mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading...</h2>
        </div>
      </div>
    )
  }

  const views = [
    {
      title: 'Clinic',
      description: 'Conduct FMS assessments, manage team, assign series',
      href: '/clinic',
      icon: Stethoscope,
      color: 'from-blue-600 to-blue-700',
      iconColor: 'text-blue-400',
    },
    {
      title: 'Assessor',
      description: 'Quick FMS assessments, one after another',
      href: '/assessor',
      icon: ClipboardCheck,
      color: 'from-teal-600 to-teal-700',
      iconColor: 'text-teal-400',
    },
    {
      title: 'Chief',
      description: 'Station analytics, team overview, injury reports',
      href: '/chief',
      icon: Shield,
      color: 'from-red-600 to-red-700',
      iconColor: 'text-red-400',
    },
    {
      title: 'Firefighter',
      description: 'Exercise dashboard, series progress, achievements',
      href: '/firefighter',
      icon: Flame,
      color: 'from-orange-600 to-orange-700',
      iconColor: 'text-orange-400',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <UserCog className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-xs sm:text-sm text-gray-400">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-black/30">
                  <User className="h-4 w-4 mr-1" />
                  Profile
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-white/80 hover:text-white hover:bg-black/30"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Select a View</h2>
            <p className="text-gray-400">Choose which dashboard to view</p>
          </div>

          <div className="grid gap-4">
            {views.map((view) => (
              <Link key={view.href} href={view.href}>
                <Card className="bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07] transition-all duration-200 cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${view.color} flex items-center justify-center flex-shrink-0`}>
                        <view.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{view.title}</h3>
                        <p className="text-sm text-gray-400">{view.description}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
