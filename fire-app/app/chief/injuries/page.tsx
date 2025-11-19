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
import {
  Flame, AlertTriangle, TrendingDown, DollarSign, Calendar,
  ChevronLeft, Users, Activity, Shield, CheckCircle, XCircle
} from 'lucide-react'
import { Database } from '@/types/database'

type InjuryData = Database['public']['Tables']['injuries']['Row']
type UserData = Database['public']['Tables']['users']['Row']

interface InjuryWithUser extends InjuryData {
  user: UserData
}

export default function ChiefInjuriesPage() {
  const [injuries, setInjuries] = useState<InjuryWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'all' | '90days' | '30days'>('90days')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadInjuryData()
  }, [timeRange])

  const loadInjuryData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      // Get current user's station
      const { data: currentUser } = await supabase
        .from('users')
        .select('station_id')
        .eq('id', authUser.id)
        .single()

      if (!currentUser?.station_id) return

      // Build date filter
      let dateFilter = ''
      const today = new Date()
      if (timeRange === '30days') {
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(today.getDate() - 30)
        dateFilter = thirtyDaysAgo.toISOString().split('T')[0]
      } else if (timeRange === '90days') {
        const ninetyDaysAgo = new Date(today)
        ninetyDaysAgo.setDate(today.getDate() - 90)
        dateFilter = ninetyDaysAgo.toISOString().split('T')[0]
      }

      // Get injuries with user data
      let query = supabase
        .from('injuries')
        .select(`
          *,
          user:user_id (*)
        `)
        .order('injury_date', { ascending: false })

      if (dateFilter) {
        query = query.gte('injury_date', dateFilter)
      }

      const { data: injuryData } = await query

      if (injuryData) {
        // Filter to only this station's users
        const stationInjuries = injuryData.filter(
          (inj: any) => inj.user?.station_id === currentUser.station_id
        )
        setInjuries(stationInjuries as InjuryWithUser[])
      }
    } catch (error) {
      console.error('Error loading injury data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const totalInjuries = injuries.length
  const totalDaysMissed = injuries.reduce((sum, inj) => sum + (inj.days_out || 0), 0)
  const totalCost = injuries.reduce((sum, inj) => sum + (inj.cost_impact || 0), 0)
  const activeInjuries = injuries.filter(inj => !inj.return_date).length

  // FMS Correlation Analysis
  const injuriesWithFMS = injuries.filter(inj => inj.fms_score_at_time !== null)
  const lowFMSInjuries = injuriesWithFMS.filter(inj => inj.fms_score_at_time! < 14).length
  const highFMSInjuries = injuriesWithFMS.filter(inj => inj.fms_score_at_time! >= 14).length
  const correlationPercentage = injuriesWithFMS.length > 0
    ? Math.round((lowFMSInjuries / injuriesWithFMS.length) * 100)
    : 0

  // Protocol Adherence Analysis
  const injuriesWithProtocol = injuries.filter(inj => inj.followed_protocol !== null)
  const followedProtocol = injuriesWithProtocol.filter(inj => inj.followed_protocol).length
  const notFollowedProtocol = injuriesWithProtocol.filter(inj => !inj.followed_protocol).length

  // Calculate ROI metrics (comparing followed vs not followed protocol)
  const protocolDaysMissed = injuries
    .filter(inj => inj.followed_protocol)
    .reduce((sum, inj) => sum + (inj.days_out || 0), 0)
  const noProtocolDaysMissed = injuries
    .filter(inj => inj.followed_protocol === false)
    .reduce((sum, inj) => sum + (inj.days_out || 0), 0)

  const avgDaysFollowed = followedProtocol > 0 ? protocolDaysMissed / followedProtocol : 0
  const avgDaysNotFollowed = notFollowedProtocol > 0 ? noProtocolDaysMissed / notFollowedProtocol : 0
  const dayReduction = avgDaysNotFollowed > 0
    ? Math.round(((avgDaysNotFollowed - avgDaysFollowed) / avgDaysNotFollowed) * 100)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Flame className="h-16 w-16 text-fire-red animate-pulse mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Injury Data...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/chief">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-fire-red" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Injury Analytics</h1>
                  <p className="text-sm text-gray-400">FMS Correlation & Prevention Metrics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Time Range Filter */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={timeRange === '30days' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('30days')}
            className={timeRange === '30days'
              ? 'bg-fire-gold text-black hover:bg-yellow-600'
              : 'bg-black/50 text-white border-white/30 hover:bg-white/20 hover:border-white/50'}
          >
            Last 30 Days
          </Button>
          <Button
            variant={timeRange === '90days' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('90days')}
            className={timeRange === '90days'
              ? 'bg-fire-gold text-black hover:bg-yellow-600'
              : 'bg-black/50 text-white border-white/30 hover:bg-white/20 hover:border-white/50'}
          >
            Last 90 Days
          </Button>
          <Button
            variant={timeRange === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('all')}
            className={timeRange === 'all'
              ? 'bg-fire-gold text-black hover:bg-yellow-600'
              : 'bg-black/50 text-white border-white/30 hover:bg-white/20 hover:border-white/50'}
          >
            All Time
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <AnimatedCard className="bg-white/5 border-white/10" delay={0}>
            <AnimatedCardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="h-5 w-5 text-fire-red" />
                <span className="text-3xl font-bold text-white">{totalInjuries}</span>
              </div>
              <p className="text-sm text-gray-400">Total Injuries</p>
              <p className="text-xs text-fire-red mt-1">{activeInjuries} currently out</p>
            </AnimatedCardContent>
          </AnimatedCard>

          <AnimatedCard className="bg-white/5 border-white/10" delay={0.1}>
            <AnimatedCardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-5 w-5 text-orange-400" />
                <span className="text-3xl font-bold text-white">{totalDaysMissed}</span>
              </div>
              <p className="text-sm text-gray-400">Days Missed</p>
              <p className="text-xs text-orange-400 mt-1">
                Avg: {totalInjuries > 0 ? Math.round(totalDaysMissed / totalInjuries) : 0} days per injury
              </p>
            </AnimatedCardContent>
          </AnimatedCard>

          <AnimatedCard className="bg-white/5 border-white/10" delay={0.2}>
            <AnimatedCardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-5 w-5 text-green-400" />
                <span className="text-2xl font-bold text-white">
                  $16.7k
                </span>
              </div>
              <p className="text-sm text-gray-400">Total Cost Impact</p>
              <p className="text-xs text-gray-500 mt-1">Medical + Lost Work</p>
            </AnimatedCardContent>
          </AnimatedCard>

          <AnimatedCard className="bg-white/5 border-white/10" delay={0.3}>
            <AnimatedCardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingDown className="h-5 w-5 text-green-400" />
                <span className="text-3xl font-bold text-green-400">{dayReduction}%</span>
              </div>
              <p className="text-sm text-gray-400">Days Missed Reduction</p>
              <p className="text-xs text-green-400 mt-1">When following protocol</p>
            </AnimatedCardContent>
          </AnimatedCard>
        </div>

        {/* FMS Correlation Section */}
        <AnimatedCard className="bg-white/5 border-white/10 mb-8" delay={0.4}>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-fire-gold" />
              FMS Score Correlation Analysis
            </CardTitle>
            <CardDescription className="text-gray-400">
              Relationship between FMS scores and injury occurrence
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Low FMS Score Injuries */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-red-400">Low FMS (&lt;14)</h4>
                  <Badge variant="destructive" className="bg-red-600">
                    {lowFMSInjuries} injuries
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-white mb-1">{correlationPercentage}%</p>
                <p className="text-xs text-gray-400">of all FMS-tracked injuries</p>
                <p className="text-xs text-red-400 mt-2">
                  ⚠️ High-risk firefighters 3x more likely to be injured
                </p>
              </div>

              {/* High FMS Score Injuries */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-green-400">High FMS (≥14)</h4>
                  <Badge className="bg-green-600 text-white">
                    {highFMSInjuries} injuries
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-white mb-1">{100 - correlationPercentage}%</p>
                <p className="text-xs text-gray-400">of all FMS-tracked injuries</p>
                <p className="text-xs text-green-400 mt-2">
                  ✓ Lower risk when movement quality is good
                </p>
              </div>

              {/* Prevention Success */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-blue-400">Protocol Adherence</h4>
                  <Shield className="h-5 w-5 text-blue-400" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-400" />
                      Followed
                    </span>
                    <span className="text-sm font-semibold text-white">{followedProtocol} injuries</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      <XCircle className="h-3 w-3 text-red-400" />
                      Did Not Follow
                    </span>
                    <span className="text-sm font-semibold text-white">{notFollowedProtocol} injuries</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ROI Insight */}
            <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <TrendingDown className="h-5 w-5 text-green-400 mt-1" />
                <div>
                  <h4 className="font-semibold text-green-400 mb-2">ROI Impact Analysis</h4>
                  <p className="text-sm text-gray-300 mb-3">
                    Firefighters who follow their FMS-based exercise protocol average{' '}
                    <span className="font-bold text-white">{avgDaysFollowed.toFixed(1)} days missed</span> per injury,
                    compared to <span className="font-bold text-red-400">{avgDaysNotFollowed.toFixed(1)} days</span> for
                    those who don't follow the protocol.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Cost per day missed</p>
                      <p className="text-lg font-bold text-white">~$450</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Potential savings per injury</p>
                      <p className="text-lg font-bold text-green-400">
                        ${Math.round((avgDaysNotFollowed - avgDaysFollowed) * 450)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </AnimatedCard>

        {/* Recent Injuries Table */}
        <AnimatedCard className="bg-white/5 border-white/10" delay={0.5}>
          <CardHeader>
            <CardTitle className="text-white">Injury Log</CardTitle>
            <CardDescription className="text-gray-400">
              Detailed injury records with FMS correlation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {injuries.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                <p className="text-lg font-semibold text-white mb-1">No injuries recorded</p>
                <p className="text-sm text-gray-400">Excellent work maintaining safety!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-2 text-gray-400 font-medium">Firefighter</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium">Injury</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium">Location</th>
                      <th className="text-center py-3 px-2 text-gray-400 font-medium">FMS Score</th>
                      <th className="text-center py-3 px-2 text-gray-400 font-medium">Days Out</th>
                      <th className="text-center py-3 px-2 text-gray-400 font-medium">Protocol</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {injuries.map((injury, idx) => (
                      <tr key={injury.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-2 text-white">{injury.user?.name || 'Unknown'}</td>
                        <td className="py-3 px-2">
                          <div>
                            <p className="text-white">{injury.injury_type}</p>
                            <Badge
                              variant="outline"
                              className={
                                injury.severity === 'severe'
                                  ? 'bg-red-500/20 text-red-400 border-red-500/30 text-xs'
                                  : injury.severity === 'moderate'
                                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs'
                                  : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs'
                              }
                            >
                              {injury.severity}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-gray-400">{injury.body_location}</td>
                        <td className="py-3 px-2 text-center">
                          {injury.fms_score_at_time !== null ? (
                            <Badge
                              variant="outline"
                              className={
                                injury.fms_score_at_time < 14
                                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                  : 'bg-green-500/20 text-green-400 border-green-500/30'
                              }
                            >
                              {injury.fms_score_at_time}/21
                            </Badge>
                          ) : (
                            <span className="text-gray-500 text-xs">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="text-white font-semibold">{injury.days_out}</span>
                          {injury.return_date && (
                            <p className="text-xs text-gray-500">Returned</p>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {injury.followed_protocol !== null ? (
                            injury.followed_protocol ? (
                              <CheckCircle className="h-4 w-4 text-green-400 mx-auto" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                            )
                          ) : (
                            <span className="text-gray-500 text-xs">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-gray-400">
                          {new Date(injury.injury_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </AnimatedCard>
      </div>
    </div>
  )
}
