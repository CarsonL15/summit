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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Flame, AlertTriangle, TrendingDown, DollarSign, Calendar,
  ChevronLeft, Users, Activity, Shield, CheckCircle, XCircle,
  Plus, X, ShieldCheck, Target, TrendingUp
} from 'lucide-react'
import { Database } from '@/types/database'
import { getRiskLevel, getRiskBadgeClasses } from '@/lib/utils/fms'

type InjuryData = Database['public']['Tables']['injuries']['Row']
type UserData = Database['public']['Tables']['users']['Row']
type FMSScoreData = Database['public']['Tables']['fms_scores']['Row']

interface InjuryWithUser extends InjuryData {
  user: UserData
}

interface InjuryFormData {
  user_id: string
  injury_type: string
  body_location: string
  injury_date: string
  severity: 'minor' | 'moderate' | 'severe'
  days_out: number
  followed_protocol: boolean
  notes: string
}

export default function ChiefInjuriesPage() {
  const [injuries, setInjuries] = useState<InjuryWithUser[]>([])
  const [firefighters, setFirefighters] = useState<UserData[]>([])
  const [fmsScores, setFmsScores] = useState<Map<string, FMSScoreData>>(new Map())
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'active' | '30days' | '90days' | 'all'>('active')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showClosed, setShowClosed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<InjuryFormData>({
    user_id: '',
    injury_type: '',
    body_location: '',
    injury_date: new Date().toISOString().split('T')[0],
    severity: 'minor',
    days_out: 0,
    followed_protocol: false,
    notes: ''
  })
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

      // Load firefighters for the station
      const { data: stationFirefighters } = await supabase
        .from('users')
        .select('*')
        .eq('station_id', currentUser.station_id)
        .in('role', ['firefighter', 'chief'])

      if (stationFirefighters) {
        setFirefighters(stationFirefighters)

        // Load latest FMS scores for each firefighter
        const { data: fmsData } = await supabase
          .from('fms_scores')
          .select('*')
          .in('user_id', stationFirefighters.map(f => f.id))
          .order('assessed_date', { ascending: false })

        if (fmsData) {
          const scoreMap = new Map<string, FMSScoreData>()
          fmsData.forEach(score => {
            if (!scoreMap.has(score.user_id)) {
              scoreMap.set(score.user_id, score)
            }
          })
          setFmsScores(scoreMap)
        }
      }

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

      // Apply active filter (only active injuries)
      if (timeRange === 'active') {
        query = query.or('return_date.is.null,status.eq.active')
      } else if (dateFilter) {
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

  const handleAddInjury = async () => {
    if (!formData.user_id || !formData.injury_type || !formData.body_location) {
      alert('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      // Get the user's current FMS score
      const userFms = fmsScores.get(formData.user_id)

      const { error } = await supabase
        .from('injuries')
        .insert({
          user_id: formData.user_id,
          injury_type: formData.injury_type,
          body_location: formData.body_location,
          injury_date: formData.injury_date,
          severity: formData.severity,
          days_out: formData.days_out,
          followed_protocol: formData.followed_protocol,
          fms_score_at_time: userFms?.total_score || null,
          status: 'active',
          notes: formData.notes || null
        })

      if (error) throw error

      // Reset form and close modal
      setFormData({
        user_id: '',
        injury_type: '',
        body_location: '',
        injury_date: new Date().toISOString().split('T')[0],
        severity: 'minor',
        days_out: 0,
        followed_protocol: false,
        notes: ''
      })
      setShowAddModal(false)
      loadInjuryData() // Refresh data
    } catch (error) {
      console.error('Error adding injury:', error)
      alert('Failed to add injury. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCloseInjury = async (injuryId: string) => {
    const confirm = window.confirm('Mark this injury as closed/returned to duty?')
    if (!confirm) return

    try {
      await supabase
        .from('injuries')
        .update({
          status: 'closed',
          return_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', injuryId)

      loadInjuryData()
    } catch (error) {
      console.error('Error closing injury:', error)
    }
  }

  // Filter injuries by active/closed status
  const activeInjuries = injuries.filter(inj => !inj.return_date && inj.status !== 'closed')
  const closedInjuries = injuries.filter(inj => inj.return_date || inj.status === 'closed')
  const displayedInjuries = showClosed ? closedInjuries : activeInjuries

  // Calculate statistics
  const totalInjuries = injuries.length
  const totalDaysMissed = injuries.reduce((sum, inj) => sum + (inj.days_out || 0), 0)

  // FMS Correlation Analysis (High Risk = FMS < 15)
  const injuriesWithFMS = injuries.filter(inj => inj.fms_score_at_time !== null)
  const highRiskInjuries = injuriesWithFMS.filter(inj => getRiskLevel(inj.fms_score_at_time!) === 'high').length
  const lowRiskInjuries = injuriesWithFMS.filter(inj => getRiskLevel(inj.fms_score_at_time!) !== 'high').length
  const correlationPercentage = injuriesWithFMS.length > 0
    ? Math.round((highRiskInjuries / injuriesWithFMS.length) * 100)
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

  // Prevention Metrics
  const highRiskPersonnel = Array.from(fmsScores.values()).filter(score => getRiskLevel(score.total_score) === 'high').length
  const adherenceRate = firefighters.length > 0 ? Math.round((followedProtocol / Math.max(totalInjuries, 1)) * 100) : 0
  const estimatedPreventedInjuries = Math.round(highRiskPersonnel * 0.3 * (adherenceRate / 100)) // Rough estimate

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
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-fire-red hover:bg-red-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Injury
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Time Range Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={timeRange === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('active')}
            className={timeRange === 'active'
              ? 'bg-fire-red text-white hover:bg-red-700'
              : 'bg-black/50 text-white border-white/30 hover:bg-white/20 hover:border-white/50'}
          >
            Active ({activeInjuries.length})
          </Button>
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

        {/* Prevention-Focused Metrics */}
        <AnimatedCard className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border-green-500/30 mb-6" delay={0}>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-400" />
              Prevention Focus
            </CardTitle>
            <CardDescription className="text-gray-400">
              Proactive injury prevention through FMS-based protocols
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-black/20 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-blue-400" />
                  <span className="text-2xl font-bold text-blue-400">{highRiskPersonnel}</span>
                </div>
                <p className="text-xs text-gray-400">High-Risk Personnel</p>
                <p className="text-xs text-gray-500 mt-1">Identified via FMS</p>
              </div>
              <div className="bg-black/20 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <ShieldCheck className="h-4 w-4 text-green-400" />
                  <span className="text-2xl font-bold text-green-400">{adherenceRate}%</span>
                </div>
                <p className="text-xs text-gray-400">Protocol Adherence</p>
                <p className="text-xs text-gray-500 mt-1">Following exercises</p>
              </div>
              <div className="bg-black/20 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-2xl font-bold text-green-400">~{estimatedPreventedInjuries}</span>
                </div>
                <p className="text-xs text-gray-400">Est. Prevented</p>
                <p className="text-xs text-gray-500 mt-1">Injuries avoided</p>
              </div>
              <div className="bg-black/20 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-green-400" />
                  <span className="text-2xl font-bold text-green-400">
                    ${Math.round(estimatedPreventedInjuries * avgDaysNotFollowed * 450 / 1000)}k
                  </span>
                </div>
                <p className="text-xs text-gray-400">Est. Savings</p>
                <p className="text-xs text-gray-500 mt-1">From prevention</p>
              </div>
            </div>
          </CardContent>
        </AnimatedCard>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <AnimatedCard className="bg-white/5 border-white/10" delay={0}>
            <AnimatedCardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="h-5 w-5 text-fire-red" />
                <span className="text-3xl font-bold text-white">{totalInjuries}</span>
              </div>
              <p className="text-sm text-gray-400">Total Injuries</p>
              <p className="text-xs text-fire-red mt-1">{activeInjuries.length} currently out</p>
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
                <Activity className="h-5 w-5 text-red-400" />
                <span className="text-3xl font-bold text-red-400">{correlationPercentage}%</span>
              </div>
              <p className="text-sm text-gray-400">High-Risk FMS</p>
              <p className="text-xs text-gray-500 mt-1">Of injured had FMS &lt;15</p>
            </AnimatedCardContent>
          </AnimatedCard>

          <AnimatedCard className="bg-white/5 border-white/10" delay={0.3}>
            <AnimatedCardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingDown className="h-5 w-5 text-green-400" />
                <span className="text-3xl font-bold text-green-400">{dayReduction}%</span>
              </div>
              <p className="text-sm text-gray-400">Faster Recovery</p>
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
              {/* High Risk FMS Score Injuries */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-red-400">High Risk FMS (&lt;15)</h4>
                  <Badge variant="destructive" className="bg-red-600">
                    {highRiskInjuries} injuries
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-white mb-1">{correlationPercentage}%</p>
                <p className="text-xs text-gray-400">of all FMS-tracked injuries</p>
                <p className="text-xs text-red-400 mt-2">
                  High-risk firefighters 3x more likely to be injured
                </p>
              </div>

              {/* Lower Risk FMS Score Injuries */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-green-400">Lower Risk FMS (15+)</h4>
                  <Badge className="bg-green-600 text-white">
                    {lowRiskInjuries} injuries
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-white mb-1">{100 - correlationPercentage}%</p>
                <p className="text-xs text-gray-400">of all FMS-tracked injuries</p>
                <p className="text-xs text-green-400 mt-2">
                  Lower risk when movement quality is good
                </p>
              </div>

              {/* Protocol Adherence */}
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

        {/* Injury Log */}
        <AnimatedCard className="bg-white/5 border-white/10" delay={0.5}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Injury Log</CardTitle>
                <CardDescription className="text-gray-400">
                  {showClosed ? 'Closed/Returned to Duty' : 'Currently Active Injuries'}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClosed(!showClosed)}
                className="bg-black/50 text-white border-white/30 hover:bg-white/20"
              >
                {showClosed ? 'Show Active' : `Show Closed (${closedInjuries.length})`}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {displayedInjuries.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                <p className="text-lg font-semibold text-white mb-1">
                  {showClosed ? 'No closed injuries' : 'No active injuries'}
                </p>
                <p className="text-sm text-gray-400">
                  {showClosed ? 'All injuries are currently active' : 'Excellent work maintaining safety!'}
                </p>
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
                      {!showClosed && <th className="text-center py-3 px-2 text-gray-400 font-medium">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {displayedInjuries.map((injury) => (
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
                              className={getRiskBadgeClasses(injury.fms_score_at_time)}
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
                        {!showClosed && (
                          <td className="py-3 px-2 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCloseInjury(injury.id)}
                              className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30 text-xs"
                            >
                              Close
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </AnimatedCard>
      </div>

      {/* Add Injury Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-fire-red" />
                  Log New Injury
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-400">Firefighter *</Label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-md p-2 text-white"
                >
                  <option value="">Select firefighter...</option>
                  {firefighters.map(ff => (
                    <option key={ff.id} value={ff.id}>{ff.name}</option>
                  ))}
                </select>
                {formData.user_id && fmsScores.get(formData.user_id) && (
                  <p className="text-xs text-gray-400 mt-1">
                    Current FMS Score: {fmsScores.get(formData.user_id)?.total_score}/21
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Injury Type *</Label>
                  <select
                    value={formData.injury_type}
                    onChange={(e) => setFormData({ ...formData, injury_type: e.target.value })}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-md p-2 text-white"
                  >
                    <option value="">Select type...</option>
                    <option value="Strain">Strain</option>
                    <option value="Sprain">Sprain</option>
                    <option value="Tear">Tear</option>
                    <option value="Fracture">Fracture</option>
                    <option value="Contusion">Contusion</option>
                    <option value="Dislocation">Dislocation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <Label className="text-gray-400">Body Location *</Label>
                  <select
                    value={formData.body_location}
                    onChange={(e) => setFormData({ ...formData, body_location: e.target.value })}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-md p-2 text-white"
                  >
                    <option value="">Select location...</option>
                    <option value="Shoulder">Shoulder</option>
                    <option value="Back - Lower">Back - Lower</option>
                    <option value="Back - Upper">Back - Upper</option>
                    <option value="Knee">Knee</option>
                    <option value="Ankle">Ankle</option>
                    <option value="Hip">Hip</option>
                    <option value="Neck">Neck</option>
                    <option value="Wrist">Wrist</option>
                    <option value="Elbow">Elbow</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Injury Date *</Label>
                  <Input
                    type="date"
                    value={formData.injury_date}
                    onChange={(e) => setFormData({ ...formData, injury_date: e.target.value })}
                    className="mt-1 bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <Label className="text-gray-400">Severity *</Label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-md p-2 text-white"
                  >
                    <option value="minor">Minor</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Days Out (Estimated)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.days_out}
                    onChange={(e) => setFormData({ ...formData, days_out: parseInt(e.target.value) || 0 })}
                    className="mt-1 bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <Label className="text-gray-400">Following Protocol?</Label>
                  <select
                    value={formData.followed_protocol ? 'yes' : 'no'}
                    onChange={(e) => setFormData({ ...formData, followed_protocol: e.target.value === 'yes' })}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-md p-2 text-white"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-gray-400">Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional details about the injury..."
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-black/50 text-white border-white/30"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddInjury}
                  disabled={saving}
                  className="flex-1 bg-fire-red hover:bg-red-700 text-white"
                >
                  {saving ? (
                    <>
                      <Activity className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Injury
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
