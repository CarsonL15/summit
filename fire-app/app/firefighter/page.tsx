'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AnimatedCard, AnimatedCardContent } from '@/components/ui/animated-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ProgressBar } from '@/components/ui/progress-bar'
import {
  Flame, Trophy, Target, TrendingUp, Calendar,
  Award, Clock, ChevronRight, LogOut, User,
  Zap, Shield, Star
} from 'lucide-react'
import { Database } from '@/types/database'
import {
  getLocalToday, getSessionsCompleted, getCurrentStage, didCompleteSessionToday,
  isSeriesComplete, TOTAL_SESSIONS,
  type StageInfo, type StageExerciseMap, type CompletionRecord
} from '@/lib/utils/session'

type UserData = Database['public']['Tables']['users']['Row']
type SeriesData = Database['public']['Tables']['series']['Row']
type SeriesAssignment = Database['public']['Tables']['series_assignments']['Row']
type ExerciseData = Database['public']['Tables']['exercises']['Row']
type AchievementData = Database['public']['Tables']['achievements']['Row']

interface SeriesWithAssignment extends SeriesData {
  assignment: SeriesAssignment
}

interface ExerciseWithCompletion extends ExerciseData {
  completed_today: boolean
  sets_display: number
  reps_display: number | null
  duration_display: number | null
}

interface UserAchievement extends AchievementData {
  earned_at: string
}

export default function FirefighterDashboard() {
  const [user, setUser] = useState<UserData | null>(null)
  const [currentSeries, setCurrentSeries] = useState<SeriesWithAssignment | null>(null)
  const [todaysExercises, setTodaysExercises] = useState<ExerciseWithCompletion[]>([])
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(0)
  const [currentStageInfo, setCurrentStageInfo] = useState<StageInfo | null>(null)
  const [sessionDoneToday, setSessionDoneToday] = useState<boolean>(false)
  const [recentAchievements, setRecentAchievements] = useState<UserAchievement[]>([])
  const [leaderboardRank, setLeaderboardRank] = useState<number>(0)
  const [latestFmsScore, setLatestFmsScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Get current auth user
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      // Get user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, role, station_id, points, current_streak, longest_streak, last_activity_date, badge_number, email, created_at, updated_at')
        .eq('id', authUser.id)
        .single()

      if (userError || !userData) {
        router.push('/auth/login')
        return
      }

      // Check role - redirect if not a firefighter
      if (userData.role === 'chief') {
        router.push('/chief')
        return
      }
      if (userData.role === 'assessor') {
        router.push('/assessor')
        return
      }
      if (userData.role === 'clinic') {
        router.push('/clinic')
        return
      }

      setUser(userData)

      // Get current series assignment
      const today = getLocalToday()

      const { data: seriesAssignment } = await supabase
        .from('series_assignments')
        .select(`
          *,
          series:series_id (*)
        `)
        .eq('user_id', authUser.id)
        .eq('completed', false)
        .gte('end_date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .single() as { data: any; error: any }

      if (seriesAssignment && seriesAssignment.series) {
        setCurrentSeries({
          ...seriesAssignment.series as SeriesData,
          assignment: seriesAssignment
        })

        // Fetch ALL series_exercises for the series (all 3 stages, 9 rows)
        const { data: allSeriesExercises } = await supabase
          .from('series_exercises')
          .select(`
            *,
            exercises:exercise_id (*)
          `)
          .eq('series_id', seriesAssignment.series_id)
          .order('week_number')
          .order('order_in_week') as { data: any[] | null; error: any }

        // Fetch ALL completions for this assignment
        const { data: allCompletions } = await supabase
          .from('exercise_completions')
          .select('exercise_id, completed_date')
          .eq('series_assignment_id', seriesAssignment.id)

        if (allSeriesExercises) {
          // Build stage exercise map (week_number = stage number)
          const stageExerciseMap: StageExerciseMap = { 1: [], 2: [], 3: [] }
          for (const se of allSeriesExercises) {
            const stageNum = se.week_number as 1 | 2 | 3
            if (stageExerciseMap[stageNum]) {
              stageExerciseMap[stageNum].push(se.exercise_id)
            }
          }

          const completions: CompletionRecord[] = (allCompletions || []).map(c => ({
            exercise_id: c.exercise_id,
            completed_date: c.completed_date
          }))

          // Derive session state
          const sessions = getSessionsCompleted(completions, stageExerciseMap)
          const stage = getCurrentStage(sessions)
          const doneToday = didCompleteSessionToday(completions, stageExerciseMap[stage.number], today)

          setSessionsCompleted(sessions)
          setCurrentStageInfo(stage)
          setSessionDoneToday(doneToday)

          // Build exercise list for current stage
          const todayCompletedIds = new Set(
            (allCompletions || [])
              .filter(c => c.completed_date === today)
              .map(c => c.exercise_id)
          )

          const currentStageSeriesExercises = allSeriesExercises.filter(
            se => se.week_number === stage.number
          )

          const exercisesWithCompletion: ExerciseWithCompletion[] = currentStageSeriesExercises
            .filter(se => se.exercises)
            .map(se => ({
              ...(se.exercises as ExerciseData),
              completed_today: todayCompletedIds.has(se.exercise_id),
              sets_display: se.custom_sets || (se.exercises as ExerciseData).sets || 3,
              reps_display: se.custom_reps || (se.exercises as ExerciseData).reps,
              duration_display: se.custom_duration || (se.exercises as ExerciseData).duration_seconds,
            }))

          setTodaysExercises(exercisesWithCompletion)
        }
      }

      // Get recent achievements
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select(`
          earned_at,
          achievements:achievement_id (*)
        `)
        .eq('user_id', authUser.id)
        .order('earned_at', { ascending: false })
        .limit(3) as { data: any[] | null; error: any }

      if (userAchievements) {
        const achievements = userAchievements
          .filter(ua => ua.achievements)
          .map(ua => ({
            ...(ua.achievements as AchievementData),
            earned_at: ua.earned_at
          }))
        setRecentAchievements(achievements)
      }

      // Get leaderboard rank
      if (userData.station_id) {
        const { data: stationUsers } = await supabase
          .from('users')
          .select('id, points')
          .eq('station_id', userData.station_id)
          .eq('role', 'firefighter')
          .order('points', { ascending: false })

        if (stationUsers) {
          const rank = stationUsers.findIndex(u => u.id === authUser.id) + 1
          setLeaderboardRank(rank)
        }
      }

      // Get latest FMS score for injury risk warning
      const { data: fmsData } = await supabase
        .from('fms_scores')
        .select('total_score')
        .eq('user_id', authUser.id)
        .order('assessed_date', { ascending: false })
        .limit(1)
        .single()

      if (fmsData) {
        setLatestFmsScore(fmsData.total_score)
      }

    } catch (error) {
      // Error loading dashboard
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
          <Flame className="h-16 w-16 text-fire-red animate-pulse mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Dashboard...</h2>
          <div className="space-y-2">
            <Skeleton className="h-4 w-48 mx-auto" />
            <Skeleton className="h-4 w-36 mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">User not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Flame className="h-6 w-6 sm:h-8 sm:w-8 text-fire-red" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">FireFMS</h1>
                <p className="text-xs sm:text-sm text-gray-400">Station 1</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {user.role === 'admin' && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 gap-1">
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline text-xs">Admin</span>
                  </Button>
                </Link>
              )}
              <div className="text-right hidden sm:block">
                <p className="text-xs sm:text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-400">Badge #{user.badge_number}</p>
              </div>
              <Link href="/profile">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-black/30 p-2"
                >
                  <User className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-400 hover:text-white hover:bg-black/30 p-2"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Welcome Section */}
        <AnimatedCard className="bg-gradient-to-r from-fire-red/20 to-fire-gold/20 border-fire-gold/30 mb-6" delay={0}>
          <AnimatedCardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                  Welcome back, {user.name.split(' ')[0]}!
                </h2>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {latestFmsScore !== null && (
                    <Badge className={`text-sm ${
                      latestFmsScore < 15 ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      latestFmsScore < 18 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      'bg-green-500/20 text-green-400 border-green-500/30'
                    }`}>
                      {latestFmsScore < 15 ? 'High Risk' : latestFmsScore < 18 ? 'Moderate Risk' : 'Low Risk'}
                    </Badge>
                  )}
                  {currentSeries && currentStageInfo && (
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-sm">
                      Stage {currentStageInfo.number} · {currentStageInfo.name}
                    </Badge>
                  )}
                  {!currentSeries && (
                    <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-sm">
                      No Active Program
                    </Badge>
                  )}
                </div>
              </div>
              {latestFmsScore !== null && latestFmsScore < 15 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 sm:max-w-xs">
                  <p className="text-sm text-red-300">
                    <strong className="text-red-400">Recommendation:</strong> Schedule a full evaluation with Summit to address movement limitations.
                  </p>
                </div>
              )}
            </div>
          </AnimatedCardContent>
        </AnimatedCard>

        {/* High Risk Warning Banner */}
        {latestFmsScore !== null && latestFmsScore < 14 && (
          <AnimatedCard className="bg-red-500/10 border-red-500/30 mb-6" delay={0}>
            <AnimatedCardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-red-500/20 rounded-full flex-shrink-0">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base sm:text-lg font-bold text-red-400">⚠️ High Risk of Injury</h3>
                    <Badge variant="destructive" className="bg-red-600 text-white text-xs">
                      FMS Score: {latestFmsScore}/21
                    </Badge>
                  </div>
                  <p className="text-sm sm:text-base text-gray-300">
                    Your FMS score indicates elevated injury risk. Firefighters with scores below 14 are{' '}
                    <span className="font-bold text-red-400">3x more likely</span> to experience work-related injuries.
                  </p>
                </div>
              </div>
            </AnimatedCardContent>
          </AnimatedCard>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <AnimatedCard className="bg-white/5 border-white/10" delay={0}>
            <AnimatedCardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 sm:mb-2">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-fire-gold mb-1 sm:mb-0" />
                <span className="text-xl sm:text-2xl font-bold text-white">{user.points}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400">Total Points</p>
              {leaderboardRank > 0 && (
                <p className="text-xs text-fire-gold mt-1">Rank #{leaderboardRank}</p>
              )}
            </AnimatedCardContent>
          </AnimatedCard>

          <AnimatedCard className="bg-white/5 border-white/10" delay={0.1}>
            <AnimatedCardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 sm:mb-2">
                <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-fire-red mb-1 sm:mb-0" />
                <span className="text-xl sm:text-2xl font-bold text-white">{user.current_streak}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400">Day Streak</p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">Best: {user.longest_streak} days</p>
            </AnimatedCardContent>
          </AnimatedCard>

          <AnimatedCard className="bg-white/5 border-white/10" delay={0.2}>
            <AnimatedCardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 sm:mb-2">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mb-1 sm:mb-0" />
                <span className="text-xl sm:text-2xl font-bold text-white">
                  {sessionsCompleted}/{TOTAL_SESSIONS}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400">Sessions</p>
              {currentStageInfo && (
                <p className="text-xs text-blue-400 mt-1 hidden sm:block">
                  Stage {currentStageInfo.number} · {currentStageInfo.name}
                </p>
              )}
            </AnimatedCardContent>
          </AnimatedCard>

          <AnimatedCard className="bg-white/5 border-white/10" delay={0.3}>
            <AnimatedCardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 sm:mb-2">
                <Award className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 mb-1 sm:mb-0" />
                <span className="text-xl sm:text-2xl font-bold text-white">{recentAchievements.length}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400">Achievements</p>
              <p className="text-xs text-green-400 mt-1 hidden sm:block">Recent earned</p>
            </AnimatedCardContent>
          </AnimatedCard>
        </div>

        {/* Today's Exercises — full width */}
        {currentSeries && currentStageInfo ? (
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-fire-gold" />
                  Stage {currentStageInfo.number} · {currentStageInfo.name}
                </CardTitle>
                <Badge className="bg-white/10 text-gray-300 border-white/20">
                  {currentSeries.name}
                </Badge>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-white">{sessionsCompleted} of {TOTAL_SESSIONS} sessions</span>
                </div>
                <ProgressBar
                  value={Math.round((sessionsCompleted / TOTAL_SESSIONS) * 100)}
                  max={100}
                  color="fire-gold"
                />
              </div>
            </CardHeader>
            <CardContent>
              {isSeriesComplete(sessionsCompleted) ? (
                /* Series complete state */
                <div className="text-center py-8">
                  <div className="inline-flex p-4 bg-green-500/20 rounded-full mb-4">
                    <Trophy className="h-10 w-10 text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Series Complete!</h3>
                  <p className="text-gray-400">
                    You finished all {TOTAL_SESSIONS} sessions. Great work!
                  </p>
                </div>
              ) : sessionDoneToday ? (
                /* Done for today state */
                <div className="text-center py-8">
                  <div className="inline-flex p-4 bg-green-500/20 rounded-full mb-4">
                    <Target className="h-10 w-10 text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Session Complete!</h3>
                  <p className="text-gray-400">
                    Come back tomorrow for session {sessionsCompleted + 1}.
                  </p>
                </div>
              ) : (
                /* Exercises to do */
                <div className="space-y-3">
                  {todaysExercises.map(exercise => (
                    <Link
                      key={exercise.id}
                      href={`/firefighter/exercise/${exercise.id}`}
                      className="block"
                    >
                      <div
                        className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                          exercise.completed_today
                            ? 'bg-green-500/10 border-green-500/30 hover:bg-green-600/30'
                            : 'bg-white/5 border-white/10 hover:bg-black/30'
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
                                {exercise.sets_display} sets
                                {exercise.reps_display && ` × ${exercise.reps_display} reps`}
                                {exercise.duration_display && !exercise.reps_display && ` × ${exercise.duration_display}s`}
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
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">No Active Series</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">
                Ask your chief for an FMS assessment to get started.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Recent Achievements */}
        {recentAchievements.length > 0 && (
          <Card className="bg-white/5 border-white/10 mt-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Star className="h-5 w-5 text-fire-gold" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {recentAchievements.map(achievement => (
                  <div
                    key={achievement.id}
                    className="p-4 rounded-lg bg-gradient-to-br from-fire-gold/10 to-fire-red/10 border border-fire-gold/30"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{achievement.icon || '🏆'}</div>
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
        )}
      </div>
    </div>
  )
}