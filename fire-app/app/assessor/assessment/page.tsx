'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AnimatedCard, AnimatedCardContent, AnimatedCardHeader, AnimatedCardTitle } from '@/components/ui/animated-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import {
  Activity, Users, ArrowLeft, ArrowRight, Save, AlertCircle,
  CheckCircle, ClipboardCheck, Target, Shield
} from 'lucide-react'
import { Database } from '@/types/database'
import {
  FMSRawScores,
  FMSPainFlags,
  FMSClearingFlags,
  DEFAULT_SCORES,
  DEFAULT_PAIN,
  DEFAULT_CLEARING,
  ASSESSMENT_PAGES,
  calculateLeftMobilityScore,
  calculateRightMobilityScore,
  calculateFMSScore,
  calculateWeakAreas,
  getRiskTextColor,
} from '@/lib/utils/fms'

type UserData = Database['public']['Tables']['users']['Row']

function AssessorFMSAssessmentContent() {
  const [stationUsers, setStationUsers] = useState<UserData[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [selectedUserData, setSelectedUserData] = useState<UserData | null>(null)
  const [currentPattern, setCurrentPattern] = useState(0)
  const [scores, setScores] = useState<FMSRawScores>({ ...DEFAULT_SCORES })
  const [pain, setPain] = useState<FMSPainFlags>({ ...DEFAULT_PAIN })
  const [clearing, setClearing] = useState<FMSClearingFlags>({ ...DEFAULT_CLEARING })
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    const userParam = searchParams.get('user')
    if (userParam && stationUsers.length > 0) {
      handleUserSelect(userParam)
    }
  }, [searchParams, stationUsers])

  const loadUsers = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      const { data: assessorUser } = await supabase
        .from('users')
        .select('station_id, role')
        .eq('id', authUser.id)
        .single() as { data: { station_id: string | null; role: string } | null }

      if (!assessorUser || (assessorUser.role !== 'assessor' && assessorUser.role !== 'admin')) {
        if (assessorUser?.role === 'clinic') {
          router.push('/clinic')
        } else if (assessorUser?.role === 'chief') {
          router.push('/chief')
        } else {
          router.push('/firefighter')
        }
        return
      }

      // Get all firefighters AND chiefs across all stations
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, role, badge_number, station_id, email, points, current_streak, longest_streak, last_activity_date, created_at, updated_at')
        .in('role', ['firefighter', 'chief'])
        .order('role')
        .order('name')
        .limit(500)

      if (usersData) {
        setStationUsers(usersData)
      }
    } catch (error) {
      // Error loading users
    } finally {
      setLoading(false)
    }
  }

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId)
    const user = stationUsers.find(u => u.id === userId)
    setSelectedUserData(user || null)
    setScores({ ...DEFAULT_SCORES })
    setPain({ ...DEFAULT_PAIN })
    setClearing({ ...DEFAULT_CLEARING })
    setNotes('')
    setCurrentPattern(0)
  }

  const handleScoreChange = (field: string, value: number) => {
    setScores(prev => ({ ...prev, [field]: value } as FMSRawScores))
  }

  const handleSaveAssessment = async () => {
    if (!selectedUser) return

    setSaving(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      const { total: fmsTotal, perPattern } = calculateFMSScore(scores, pain, clearing)
      const leftMobility = calculateLeftMobilityScore(scores)
      const rightMobility = calculateRightMobilityScore(scores)
      const weakAreas = calculateWeakAreas(perPattern)

      const { data: assessment, error } = await supabase
        .from('fms_scores')
        .insert({
          user_id: selectedUser,
          assessed_by: authUser!.id,
          total_score: fmsTotal,
          deep_squat: perPattern.deep_squat,
          hurdle_step: perPattern.hurdle_step,
          inline_lunge: perPattern.inline_lunge,
          shoulder_mobility: perPattern.shoulder_mobility,
          aslr: perPattern.aslr,
          trunk_stability: perPattern.trunk_stability,
          rotary_stability: perPattern.rotary_stability,
          // Raw scores
          deep_squat_raw: scores.deep_squat,
          hurdle_step_left: scores.hurdle_step_left,
          hurdle_step_right: scores.hurdle_step_right,
          inline_lunge_left: scores.inline_lunge_left,
          inline_lunge_right: scores.inline_lunge_right,
          shoulder_mobility_left: scores.shoulder_mobility_left,
          shoulder_mobility_right: scores.shoulder_mobility_right,
          aslr_left: scores.aslr_left,
          aslr_right: scores.aslr_right,
          trunk_stability_raw: scores.trunk_stability,
          rotary_stability_left: scores.rotary_stability_left,
          rotary_stability_right: scores.rotary_stability_right,
          // Pain flags
          deep_squat_pain_left: pain.deep_squat_pain_left,
          deep_squat_pain_right: pain.deep_squat_pain_right,
          hurdle_step_pain_left: pain.hurdle_step_pain_left,
          hurdle_step_pain_right: pain.hurdle_step_pain_right,
          inline_lunge_pain_left: pain.inline_lunge_pain_left,
          inline_lunge_pain_right: pain.inline_lunge_pain_right,
          shoulder_mobility_pain_left: pain.shoulder_mobility_pain_left,
          shoulder_mobility_pain_right: pain.shoulder_mobility_pain_right,
          aslr_pain_left: pain.aslr_pain_left,
          aslr_pain_right: pain.aslr_pain_right,
          trunk_stability_pain_left: pain.trunk_stability_pain_left,
          trunk_stability_pain_right: pain.trunk_stability_pain_right,
          rotary_stability_pain_left: pain.rotary_stability_pain_left,
          rotary_stability_pain_right: pain.rotary_stability_pain_right,
          // Clearing flags
          clearing_ankle: clearing.clearing_ankle,
          clearing_shoulder: clearing.clearing_shoulder,
          clearing_extension: clearing.clearing_extension,
          clearing_flexion: clearing.clearing_flexion,
          // Mobility scores
          left_mobility_score: leftMobility,
          right_mobility_score: rightMobility,
          weak_areas: { areas: weakAreas },
          notes: notes || null,
          assessed_date: new Date().toISOString().split('T')[0]
        } as any)
        .select()
        .single()

      if (error) throw error

      // Go back to assessor dashboard to assess the next person
      router.push('/assessor')
    } catch (error) {
      alert('Failed to save assessment. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const page = ASSESSMENT_PAGES[currentPattern]
  const { total: fmsTotal, perPattern } = calculateFMSScore(scores, pain, clearing)
  const leftMobility = calculateLeftMobilityScore(scores)
  const rightMobility = calculateRightMobilityScore(scores)

  // Compute the per-page FMS score for display
  const getPageFMSScore = (): number => {
    const patternMap: Record<number, keyof typeof perPattern> = {
      0: 'deep_squat',
      1: 'hurdle_step',
      2: 'inline_lunge',
      3: 'shoulder_mobility',
      4: 'aslr',
      5: 'trunk_stability',
      6: 'rotary_stability',
    }
    return perPattern[patternMap[currentPattern]]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-16 w-16 text-teal-400 animate-pulse mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Assessment...</h2>
          <Skeleton className="h-4 w-48 mx-auto" />
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/assessor')}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-6 w-6 text-teal-400" />
              <h1 className="text-lg font-bold text-white">FMS Assessment</h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">FMS Score</p>
              <p className={`text-2xl font-bold ${getRiskTextColor(fmsTotal)}`}>{fmsTotal}/21</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* User Selection */}
        {!selectedUser ? (
          <AnimatedCard className="bg-white/5 border-white/10">
            <AnimatedCardHeader>
              <AnimatedCardTitle className="text-white flex items-center gap-2">
                <Users className="h-6 w-6 text-teal-400" />
                Select Person to Assess
              </AnimatedCardTitle>
            </AnimatedCardHeader>
            <AnimatedCardContent>
              <div className="grid gap-3">
                {stationUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user.id)}
                    className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-black/30 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${user.role === 'chief' ? 'bg-fire-gold/20' : 'bg-fire-red/20'}`}>
                          {user.role === 'chief' ? (
                            <Shield className="h-4 w-4 text-fire-gold" />
                          ) : (
                            <Users className="h-4 w-4 text-fire-red" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.name}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            {user.badge_number && <span>Badge #{user.badge_number}</span>}
                            <Badge
                              variant="outline"
                              className={user.role === 'chief' ? 'text-fire-gold border-fire-gold/30' : 'text-gray-400 border-white/20'}
                            >
                              {user.role === 'chief' ? 'Chief' : 'Firefighter'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </button>
                ))}
                {stationUsers.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No personnel found</p>
                  </div>
                )}
              </div>
            </AnimatedCardContent>
          </AnimatedCard>
        ) : (
          <>
            {/* Assessment Header */}
            <Card className="bg-white/5 border-white/10 mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${selectedUserData?.role === 'chief' ? 'bg-fire-gold/20' : 'bg-fire-red/20'}`}>
                      {selectedUserData?.role === 'chief' ? (
                        <Shield className="h-5 w-5 text-fire-gold" />
                      ) : (
                        <Users className="h-5 w-5 text-fire-red" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Assessing</p>
                      <p className="text-xl font-bold text-white">{selectedUserData?.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-400">Badge #{selectedUserData?.badge_number}</p>
                        <Badge
                          variant="outline"
                          className={selectedUserData?.role === 'chief' ? 'text-fire-gold border-fire-gold/30' : 'text-gray-400 border-white/20'}
                        >
                          {selectedUserData?.role === 'chief' ? 'Chief' : 'Firefighter'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedUser('')}
                    className="bg-white/5 text-white border-white/30 hover:bg-black/30 hover:border-white/50"
                  >
                    Change Person
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Movement Pattern Assessment */}
            <AnimatedCard className="bg-white/5 border-white/10 mb-6">
              <AnimatedCardHeader>
                <AnimatedCardTitle className="text-white">
                  {page.name}
                </AnimatedCardTitle>
              </AnimatedCardHeader>
              <AnimatedCardContent>
                <p className="text-gray-400 mb-6">{page.description}</p>

                {page.bilateral ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Left Side */}
                    <div>
                      <Label className="text-white mb-3 block">Left Side</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map(score => (
                          <Button
                            key={score}
                            variant="outline"
                            className={`h-16 text-lg font-bold ${
                              scores[page.leftScoreKey!] === score
                                ? score === 1 ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600' :
                                  score === 2 ? 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600' :
                                  'bg-green-600 hover:bg-green-700 text-white border-green-600'
                                : 'bg-white/5 text-white border-white/20 hover:bg-black/30'
                            }`}
                            onClick={() => handleScoreChange(page.leftScoreKey!, score)}
                          >
                            {score}
                          </Button>
                        ))}
                      </div>
                      {/* Left Pain Toggle */}
                      <div className="mt-3">
                        <button
                          onClick={() => setPain(prev => ({ ...prev, [page.painLeftKey]: !prev[page.painLeftKey as keyof FMSPainFlags] } as FMSPainFlags))}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            pain[page.painLeftKey as keyof FMSPainFlags]
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-white/5 text-gray-400 border-white/20 hover:bg-white/10'
                          } border`}
                        >
                          {pain[page.painLeftKey as keyof FMSPainFlags] ? '\u26A0 Left Pain' : 'Left: No Pain'}
                        </button>
                      </div>
                    </div>

                    {/* Right Side */}
                    <div>
                      <Label className="text-white mb-3 block">Right Side</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map(score => (
                          <Button
                            key={score}
                            variant="outline"
                            className={`h-16 text-lg font-bold ${
                              scores[page.rightScoreKey!] === score
                                ? score === 1 ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600' :
                                  score === 2 ? 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600' :
                                  'bg-green-600 hover:bg-green-700 text-white border-green-600'
                                : 'bg-white/5 text-white border-white/20 hover:bg-black/30'
                            }`}
                            onClick={() => handleScoreChange(page.rightScoreKey!, score)}
                          >
                            {score}
                          </Button>
                        ))}
                      </div>
                      {/* Right Pain Toggle */}
                      <div className="mt-3">
                        <button
                          onClick={() => setPain(prev => ({ ...prev, [page.painRightKey]: !prev[page.painRightKey as keyof FMSPainFlags] } as FMSPainFlags))}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            pain[page.painRightKey as keyof FMSPainFlags]
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-white/5 text-gray-400 border-white/20 hover:bg-white/10'
                          } border`}
                        >
                          {pain[page.painRightKey as keyof FMSPainFlags] ? '\u26A0 Right Pain' : 'Right: No Pain'}
                        </button>
                      </div>
                    </div>

                    {/* Clearing Test (if applicable) */}
                    {page.clearingTest && (
                      <div className="md:col-span-2">
                        <div className="mt-2 p-4 rounded-lg border border-white/10 bg-white/5">
                          <p className="text-sm font-medium text-gray-300 mb-3">{page.clearingTest.label}</p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className={clearing[page.clearingTest.key as keyof FMSClearingFlags]
                                ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                                : 'bg-white/5 text-gray-400 border-white/20 hover:bg-white/10'}
                              onClick={() => setClearing(prev => ({ ...prev, [page.clearingTest!.key]: true } as FMSClearingFlags))}
                            >
                              Pass
                            </Button>
                            <Button
                              variant="outline"
                              className={!clearing[page.clearingTest.key as keyof FMSClearingFlags]
                                ? 'bg-red-600 hover:bg-red-700 text-white border-red-600'
                                : 'bg-white/5 text-gray-400 border-white/20 hover:bg-white/10'}
                              onClick={() => setClearing(prev => ({ ...prev, [page.clearingTest!.key]: false } as FMSClearingFlags))}
                            >
                              Fail
                            </Button>
                          </div>
                          {!clearing[page.clearingTest.key as keyof FMSClearingFlags] && (
                            <p className="mt-2 text-sm text-red-400">{'\u26A0'} {page.clearingTest.warningText}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Final Score Display */}
                    <div className="md:col-span-2 mt-4">
                      <div className="bg-white/10 rounded-lg p-4">
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-sm text-gray-400">Raw L: {scores[page.leftScoreKey!]}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Raw R: {scores[page.rightScoreKey!]}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">FMS Score for this pattern</p>
                        <p className="text-2xl font-bold text-white">{getPageFMSScore()}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label className="text-white mb-3 block">Score</Label>
                    <div className="grid grid-cols-3 gap-2 max-w-md">
                      {[1, 2, 3].map(score => (
                        <Button
                          key={score}
                          variant="outline"
                          className={`h-16 text-lg font-bold ${
                            scores[page.scoreKey!] === score
                              ? score === 1 ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600' :
                                score === 2 ? 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600' :
                                'bg-green-600 hover:bg-green-700 text-white border-green-600'
                              : 'bg-white/5 text-white border-white/20 hover:bg-black/30'
                          }`}
                          onClick={() => handleScoreChange(page.scoreKey!, score)}
                        >
                          {score}
                        </Button>
                      ))}
                    </div>

                    {/* Pain Toggle (single for non-bilateral) */}
                    <div className="mt-4">
                      <button
                        onClick={() => {
                          const current = pain[page.painLeftKey as keyof FMSPainFlags]
                          setPain(prev => ({ ...prev, [page.painLeftKey]: !current, [page.painRightKey]: !current } as FMSPainFlags))
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          pain[page.painLeftKey as keyof FMSPainFlags]
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white/5 text-gray-400 border-white/20 hover:bg-white/10'
                        } border`}
                      >
                        {pain[page.painLeftKey as keyof FMSPainFlags] ? '\u26A0 Pain' : 'No Pain'}
                      </button>
                    </div>

                    {/* Clearing Test (if applicable) */}
                    {page.clearingTest && (
                      <div className="mt-6 p-4 rounded-lg border border-white/10 bg-white/5">
                        <p className="text-sm font-medium text-gray-300 mb-3">{page.clearingTest.label}</p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className={clearing[page.clearingTest.key as keyof FMSClearingFlags]
                              ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                              : 'bg-white/5 text-gray-400 border-white/20 hover:bg-white/10'}
                            onClick={() => setClearing(prev => ({ ...prev, [page.clearingTest!.key]: true } as FMSClearingFlags))}
                          >
                            Pass
                          </Button>
                          <Button
                            variant="outline"
                            className={!clearing[page.clearingTest.key as keyof FMSClearingFlags]
                              ? 'bg-red-600 hover:bg-red-700 text-white border-red-600'
                              : 'bg-white/5 text-gray-400 border-white/20 hover:bg-white/10'}
                            onClick={() => setClearing(prev => ({ ...prev, [page.clearingTest!.key]: false } as FMSClearingFlags))}
                          >
                            Fail
                          </Button>
                        </div>
                        {!clearing[page.clearingTest.key as keyof FMSClearingFlags] && (
                          <p className="mt-2 text-sm text-red-400">{'\u26A0'} {page.clearingTest.warningText}</p>
                        )}
                      </div>
                    )}

                    {/* Final Score Display */}
                    <div className="mt-4">
                      <div className="bg-white/10 rounded-lg p-4">
                        <p className="text-sm text-gray-400">Raw Score: {scores[page.scoreKey!]}</p>
                        <p className="text-sm text-gray-400 mt-1">FMS Score for this pattern</p>
                        <p className="text-2xl font-bold text-white">{getPageFMSScore()}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Score Legend */}
                <div className="mt-6 grid grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-600 rounded"></div>
                    <span className="text-gray-400">1 = Poor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-600 rounded"></div>
                    <span className="text-gray-400">2 = Average</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-600 rounded"></div>
                    <span className="text-gray-400">3 = Good</span>
                  </div>
                </div>
              </AnimatedCardContent>
            </AnimatedCard>

            {/* Navigation */}
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPattern(Math.max(0, currentPattern - 1))}
                disabled={currentPattern === 0}
                className="bg-white/5 text-white border-white/20 hover:bg-black/30 disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-1">
                {ASSESSMENT_PAGES.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPattern(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentPattern ? 'bg-teal-400' :
                      index < currentPattern ? 'bg-green-500' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>

              {currentPattern < ASSESSMENT_PAGES.length - 1 ? (
                <Button
                  onClick={() => setCurrentPattern(currentPattern + 1)}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>All patterns scored</span>
                </div>
              )}
            </div>

            {/* Summary & Notes (shown when on last pattern) */}
            {currentPattern === ASSESSMENT_PAGES.length - 1 && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Assessment Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-3 gap-4 mb-6">
                    {/* FMS Score */}
                    <div className={`p-4 rounded-lg border ${
                      fmsTotal >= 18 ? 'bg-green-500/10 border-green-500/30' :
                      fmsTotal >= 15 ? 'bg-yellow-500/10 border-yellow-500/30' :
                      'bg-red-500/10 border-red-500/30'
                    }`}>
                      <p className="text-sm text-gray-400">FMS Score</p>
                      <p className={`text-3xl font-bold ${getRiskTextColor(fmsTotal)}`}>{fmsTotal}/21</p>
                      <p className={`text-sm mt-1 ${getRiskTextColor(fmsTotal)}`}>
                        {fmsTotal >= 18 ? 'Low Risk' :
                         fmsTotal >= 15 ? 'Moderate' : 'High Risk'}
                      </p>
                    </div>

                    {/* Left Mobility */}
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-sm text-gray-400">Left Mobility</p>
                      <p className="text-3xl font-bold text-white">{leftMobility}/21</p>
                      <p className="text-sm mt-1 text-gray-500">Raw left-side total</p>
                    </div>

                    {/* Right Mobility */}
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-sm text-gray-400">Right Mobility</p>
                      <p className="text-3xl font-bold text-white">{rightMobility}/21</p>
                      <p className="text-sm mt-1 text-gray-500">Raw right-side total</p>
                    </div>
                  </div>

                  {/* Weak Areas */}
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10 mb-6">
                    <p className="text-sm text-gray-400 mb-2">Weak Areas</p>
                    <div className="flex flex-wrap gap-1">
                      {calculateWeakAreas(perPattern).map(area => (
                        <Badge key={area} className="bg-red-500/20 text-red-400 border-red-500/30">
                          {area.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {calculateWeakAreas(perPattern).length === 0 && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          No significant weaknesses
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <Label htmlFor="notes" className="text-white mb-2 block">
                      Assessment Notes (Optional)
                    </Label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full h-24 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                      placeholder="Enter any observations or recommendations..."
                    />
                  </div>

                  <Button
                    onClick={handleSaveAssessment}
                    disabled={saving}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    {saving ? (
                      <>
                        <Activity className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Assessment
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function AssessorFMSAssessment() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-16 w-16 text-teal-400 animate-pulse mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Assessment...</h2>
        </div>
      </div>
    }>
      <AssessorFMSAssessmentContent />
    </Suspense>
  )
}
