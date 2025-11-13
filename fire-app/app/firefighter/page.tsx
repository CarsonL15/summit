'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Flame, Trophy, Target, TrendingUp, Calendar,
  Award, Clock, ChevronRight, LogOut, User,
  Zap, Shield, Star
} from 'lucide-react'

interface UserData {
  id: string
  name: string
  email: string
  role: string
  badge_number: string
  points: number
  current_streak: number
  longest_streak: number
  station_id: string
}

interface Series {
  id: string
  name: string
  description: string
  current_week: number
  completion_percentage: number
  start_date: string
  end_date: string
}

interface Exercise {
  id: string
  name: string
  sets: number
  reps: number
  completed_today: boolean
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  earned_at: string
}

export default function FirefighterDashboard() {
  const [user, setUser] = useState<UserData | null>(null)
  const [currentSeries, setCurrentSeries] = useState<Series | null>(null)
  const [todaysExercises, setTodaysExercises] = useState<Exercise[]>([])
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([])
  const [leaderboardRank, setLeaderboardRank] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      // For demo, create mock data
      // In production, these would be actual database queries

      const mockUser: UserData = {
        id: '1',
        name: 'John Smith',
        email: 'john@firestation1.com',
        role: 'firefighter',
        badge_number: 'F101',
        points: 250,
        current_streak: 5,
        longest_streak: 12,
        station_id: '1'
      }

      const mockSeries: Series = {
        id: '1',
        name: 'Core Power Series',
        description: 'Build core strength and power for equipment handling',
        current_week: 2,
        completion_percentage: 45,
        start_date: '2025-11-01',
        end_date: '2025-11-22'
      }

      const mockExercises: Exercise[] = [
        { id: '1', name: 'Farmers Carry', sets: 3, reps: 0, completed_today: true },
        { id: '2', name: 'Pallof Press', sets: 3, reps: 12, completed_today: true },
        { id: '3', name: 'Dead Bug', sets: 3, reps: 10, completed_today: false },
        { id: '4', name: 'Plank to Downward Dog', sets: 3, reps: 10, completed_today: false }
      ]

      const mockAchievements: Achievement[] = [
        { id: '1', name: 'Week Warrior', description: 'Complete exercises for 7 days straight', icon: '🔥', earned_at: '2025-11-10' },
        { id: '2', name: 'Century Mark', description: 'Earn 100 points', icon: '💯', earned_at: '2025-11-05' },
        { id: '3', name: 'Quarter K', description: 'Earn 250 points', icon: '🎯', earned_at: '2025-11-12' }
      ]

      setUser(mockUser)
      setCurrentSeries(mockSeries)
      setTodaysExercises(mockExercises)
      setRecentAchievements(mockAchievements)
      setLeaderboardRank(3)
    } catch (error) {
      console.error('Error loading dashboard:', error)
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
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Flame className="h-8 w-8 text-fire-red" />
              <div>
                <h1 className="text-xl font-bold text-white">FireFMS</h1>
                <p className="text-sm text-gray-400">Station 1</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-gray-400">Badge #{user?.badge_number}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-400 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="h-5 w-5 text-fire-gold" />
                <span className="text-2xl font-bold text-white">{user?.points}</span>
              </div>
              <p className="text-sm text-gray-400">Total Points</p>
              <p className="text-xs text-fire-gold mt-1">Rank #{leaderboardRank} in Station</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Flame className="h-5 w-5 text-fire-red" />
                <span className="text-2xl font-bold text-white">{user?.current_streak}</span>
              </div>
              <p className="text-sm text-gray-400">Day Streak</p>
              <p className="text-xs text-gray-500 mt-1">Best: {user?.longest_streak} days</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Target className="h-5 w-5 text-blue-400" />
                <span className="text-2xl font-bold text-white">{currentSeries?.completion_percentage}%</span>
              </div>
              <p className="text-sm text-gray-400">Series Progress</p>
              <p className="text-xs text-blue-400 mt-1">Week {currentSeries?.current_week} of 3</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Award className="h-5 w-5 text-green-400" />
                <span className="text-2xl font-bold text-white">{recentAchievements.length}</span>
              </div>
              <p className="text-sm text-gray-400">Achievements</p>
              <p className="text-xs text-green-400 mt-1">+1 this week</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Current Series */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-fire-gold" />
                Current Series
              </CardTitle>
              <CardDescription className="text-gray-400">
                {currentSeries?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Week {currentSeries?.current_week} Progress</span>
                    <span className="text-white">{currentSeries?.completion_percentage}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-fire-red to-fire-gold h-2 rounded-full"
                      style={{ width: `${currentSeries?.completion_percentage}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-sm text-gray-300 mb-3">{currentSeries?.description}</p>
                  <Button className="w-full bg-fire-red hover:bg-red-700 text-white">
                    Continue Training
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Exercises */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-400" />
                Today's Exercises
              </CardTitle>
              <CardDescription className="text-gray-400">
                Week {currentSeries?.current_week} • Day {new Date().getDay() || 7}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todaysExercises.map(exercise => (
                  <div
                    key={exercise.id}
                    className={`p-3 rounded-lg border ${
                      exercise.completed_today
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {exercise.completed_today ? (
                          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-white/30" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">{exercise.name}</p>
                          <p className="text-xs text-gray-400">
                            {exercise.sets} sets × {exercise.reps || 'Time'} {exercise.reps ? 'reps' : ''}
                          </p>
                        </div>
                      </div>
                      {exercise.completed_today && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          +10 pts
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Achievements */}
        <Card className="bg-white/5 border-white/10 mt-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Star className="h-5 w-5 text-fire-gold" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {recentAchievements.map(achievement => (
                <div
                  key={achievement.id}
                  className="p-4 rounded-lg bg-gradient-to-br from-fire-gold/10 to-fire-red/10 border border-fire-gold/30"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div>
                      <h4 className="font-semibold text-white">{achievement.name}</h4>
                      <p className="text-xs text-gray-400 mt-1">{achievement.description}</p>
                      <p className="text-xs text-fire-gold mt-2">
                        Earned {new Date(achievement.earned_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}