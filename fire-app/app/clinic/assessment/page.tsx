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

type UserData = Database['public']['Tables']['users']['Row']

interface MovementPattern {
  name: string
  field: keyof FMSScores
  description: string
  bilateral: boolean
  leftField?: keyof FMSScores
  rightField?: keyof FMSScores
}

interface FMSScores {
  deep_squat: number
  hurdle_step_left: number
  hurdle_step_right: number
  inline_lunge_left: number
  inline_lunge_right: number
  shoulder_mobility_left: number
  shoulder_mobility_right: number
  aslr_left: number
  aslr_right: number
  trunk_stability: number
  rotary_stability_left: number
  rotary_stability_right: number
  [key: string]: number
}

const movementPatterns: MovementPattern[] = [
  {
    name: 'Deep Squat',
    field: 'deep_squat',
    description: 'Tests bilateral, symmetrical, functional mobility of the hips, knees, and ankles',
    bilateral: false
  },
  {
    name: 'Hurdle Step',
    field: 'hurdle_step_left',
    description: 'Challenges body\'s stride mechanics during stepping',
    bilateral: true,
    leftField: 'hurdle_step_left',
    rightField: 'hurdle_step_right'
  },
  {
    name: 'Inline Lunge',
    field: 'inline_lunge_left',
    description: 'Tests hip and ankle mobility and stability, quadriceps flexibility, and knee stability',
    bilateral: true,
    leftField: 'inline_lunge_left',
    rightField: 'inline_lunge_right'
  },
  {
    name: 'Shoulder Mobility',
    field: 'shoulder_mobility_left',
    description: 'Assesses bilateral shoulder range of motion',
    bilateral: true,
    leftField: 'shoulder_mobility_left',
    rightField: 'shoulder_mobility_right'
  },
  {
    name: 'Active Straight Leg Raise',
    field: 'aslr_left',
    description: 'Tests active hamstring and gastroc-soleus flexibility',
    bilateral: true,
    leftField: 'aslr_left',
    rightField: 'aslr_right'
  },
  {
    name: 'Trunk Stability Push-Up',
    field: 'trunk_stability',
    description: 'Tests trunk stability in the sagittal plane during upper body movement',
    bilateral: false
  },
  {
    name: 'Rotary Stability',
    field: 'rotary_stability_left',
    description: 'Tests multi-planar trunk stability during upper/lower body movement',
    bilateral: true,
    leftField: 'rotary_stability_left',
    rightField: 'rotary_stability_right'
  }
]

function ClinicFMSAssessmentContent() {
  const [stationUsers, setStationUsers] = useState<UserData[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [selectedUserData, setSelectedUserData] = useState<UserData | null>(null)
  const [currentPattern, setCurrentPattern] = useState(0)
  const [scores, setScores] = useState<FMSScores>({
    deep_squat: 0,
    hurdle_step_left: 0,
    hurdle_step_right: 0,
    inline_lunge_left: 0,
    inline_lunge_right: 0,
    shoulder_mobility_left: 0,
    shoulder_mobility_right: 0,
    aslr_left: 0,
    aslr_right: 0,
    trunk_stability: 0,
    rotary_stability_left: 0,
    rotary_stability_right: 0
  })
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    loadUsers()
  }, [])

  // Auto-select user if passed via query param
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

      // Get clinic user's station
      const { data: clinicUser } = await supabase
        .from('users')
        .select('station_id, role')
        .eq('id', authUser.id)
        .single()

      if (!clinicUser || (clinicUser.role !== 'clinic' && clinicUser.role !== 'admin')) {
        if (clinicUser?.role === 'chief') {
          router.push('/chief')
        } else {
          router.push('/firefighter')
        }
        return
      }

      // Get all firefighters AND chiefs in station
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .eq('station_id', clinicUser.station_id)
        .in('role', ['firefighter', 'chief'])
        .order('role')
        .order('name')

      if (usersData) {
        setStationUsers(usersData)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId)
    const user = stationUsers.find(u => u.id === userId)
    setSelectedUserData(user || null)
    // Reset scores when changing user
    setScores({
      deep_squat: 0,
      hurdle_step_left: 0,
      hurdle_step_right: 0,
      inline_lunge_left: 0,
      inline_lunge_right: 0,
      shoulder_mobility_left: 0,
      shoulder_mobility_right: 0,
      aslr_left: 0,
      aslr_right: 0,
      trunk_stability: 0,
      rotary_stability_left: 0,
      rotary_stability_right: 0
    })
    setNotes('')
    setCurrentPattern(0)
  }

  const handleScoreChange = (field: string, value: number) => {
    setScores(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const calculateTotalScore = () => {
    let total = 0

    // Non-bilateral movements
    total += scores.deep_squat
    total += scores.trunk_stability

    // Bilateral movements - take lower of L/R
    total += Math.min(scores.hurdle_step_left, scores.hurdle_step_right)
    total += Math.min(scores.inline_lunge_left, scores.inline_lunge_right)
    total += Math.min(scores.shoulder_mobility_left, scores.shoulder_mobility_right)
    total += Math.min(scores.aslr_left, scores.aslr_right)
    total += Math.min(scores.rotary_stability_left, scores.rotary_stability_right)

    return total
  }

  const identifyWeakAreas = () => {
    const areas = []

    if (scores.deep_squat <= 1) areas.push('deep_squat')
    if (Math.min(scores.hurdle_step_left, scores.hurdle_step_right) <= 1) areas.push('hurdle_step')
    if (Math.min(scores.inline_lunge_left, scores.inline_lunge_right) <= 1) areas.push('inline_lunge')
    if (Math.min(scores.shoulder_mobility_left, scores.shoulder_mobility_right) <= 1) areas.push('shoulder_mobility')
    if (Math.min(scores.aslr_left, scores.aslr_right) <= 1) areas.push('aslr')
    if (scores.trunk_stability <= 1) areas.push('trunk_stability')
    if (Math.min(scores.rotary_stability_left, scores.rotary_stability_right) <= 1) areas.push('rotary_stability')

    return { areas }
  }

  const handleSaveAssessment = async () => {
    if (!selectedUser) return

    setSaving(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      const totalScore = calculateTotalScore()
      const weakAreas = identifyWeakAreas()

      // Save FMS assessment - store final scores (lower of L/R for bilateral)
      const { data: assessment, error } = await supabase
        .from('fms_scores')
        .insert({
          user_id: selectedUser,
          assessed_by: authUser?.id,
          total_score: totalScore,
          deep_squat: scores.deep_squat,
          hurdle_step: Math.min(scores.hurdle_step_left, scores.hurdle_step_right),
          inline_lunge: Math.min(scores.inline_lunge_left, scores.inline_lunge_right),
          shoulder_mobility: Math.min(scores.shoulder_mobility_left, scores.shoulder_mobility_right),
          aslr: Math.min(scores.aslr_left, scores.aslr_right),
          trunk_stability: scores.trunk_stability,
          rotary_stability: Math.min(scores.rotary_stability_left, scores.rotary_stability_right),
          weak_areas: weakAreas,
          notes: notes || null,
          assessed_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single()

      if (error) throw error

      // Redirect to review page to assign series
      router.push(`/clinic/assessment/review/${assessment.id}`)
    } catch (error) {
      console.error('Error saving assessment:', error)
      alert('Failed to save assessment. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const pattern = movementPatterns[currentPattern]
  const totalScore = calculateTotalScore()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-16 w-16 text-blue-400 animate-pulse mx-auto mb-4" />
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
                onClick={() => router.push('/clinic')}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-blue-400" />
              <h1 className="text-lg font-bold text-white">FMS Assessment</h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Total Score</p>
              <p className="text-2xl font-bold text-white">{totalScore}/21</p>
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
                <Users className="h-6 w-6 text-blue-400" />
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
                    <p className="text-gray-400">No personnel found in this station</p>
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
                  Pattern {currentPattern + 1} of {movementPatterns.length}: {pattern.name}
                </AnimatedCardTitle>
              </AnimatedCardHeader>
              <AnimatedCardContent>
                <p className="text-gray-400 mb-6">{pattern.description}</p>

                {pattern.bilateral ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-white mb-3 block">Left Side</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {[0, 1, 2, 3].map(score => (
                          <Button
                            key={score}
                            variant="outline"
                            className={`h-16 text-lg font-bold ${
                              scores[pattern.leftField!] === score
                                ? score === 0 ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' :
                                  score === 1 ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600' :
                                  score === 2 ? 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600' :
                                  'bg-green-600 hover:bg-green-700 text-white border-green-600'
                                : 'bg-white/5 text-white border-white/20 hover:bg-black/30'
                            }`}
                            onClick={() => handleScoreChange(pattern.leftField!, score)}
                          >
                            {score}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-white mb-3 block">Right Side</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {[0, 1, 2, 3].map(score => (
                          <Button
                            key={score}
                            variant="outline"
                            className={`h-16 text-lg font-bold ${
                              scores[pattern.rightField!] === score
                                ? score === 0 ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' :
                                  score === 1 ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600' :
                                  score === 2 ? 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600' :
                                  'bg-green-600 hover:bg-green-700 text-white border-green-600'
                                : 'bg-white/5 text-white border-white/20 hover:bg-black/30'
                            }`}
                            onClick={() => handleScoreChange(pattern.rightField!, score)}
                          >
                            {score}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2 mt-4">
                      <div className="bg-white/10 rounded-lg p-4">
                        <p className="text-sm text-gray-400">Final Score (Lower of L/R)</p>
                        <p className="text-2xl font-bold text-white">
                          {Math.min(scores[pattern.leftField!], scores[pattern.rightField!])}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label className="text-white mb-3 block">Score</Label>
                    <div className="grid grid-cols-4 gap-2 max-w-md">
                      {[0, 1, 2, 3].map(score => (
                        <Button
                          key={score}
                          variant="outline"
                          className={`h-16 text-lg font-bold ${
                            scores[pattern.field] === score
                              ? score === 0 ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' :
                                score === 1 ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600' :
                                score === 2 ? 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600' :
                                'bg-green-600 hover:bg-green-700 text-white border-green-600'
                              : 'bg-white/5 text-white border-white/20 hover:bg-black/30'
                          }`}
                          onClick={() => handleScoreChange(pattern.field, score)}
                        >
                          {score}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Score Legend */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-600 rounded"></div>
                    <span className="text-gray-400">0 = Pain</span>
                  </div>
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
                {movementPatterns.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPattern(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentPattern ? 'bg-blue-400' :
                      index < currentPattern ? 'bg-green-500' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>

              {currentPattern < movementPatterns.length - 1 ? (
                <Button
                  onClick={() => setCurrentPattern(currentPattern + 1)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
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

            {/* Summary & Notes (shown when all patterns complete) */}
            {currentPattern === movementPatterns.length - 1 && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Assessment Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className={`p-4 rounded-lg border ${
                      totalScore >= 17 ? 'bg-green-500/10 border-green-500/30' :
                      totalScore >= 14 ? 'bg-yellow-500/10 border-yellow-500/30' :
                      'bg-red-500/10 border-red-500/30'
                    }`}>
                      <p className="text-sm text-gray-400">Total Score</p>
                      <p className="text-3xl font-bold text-white">{totalScore}/21</p>
                      <p className={`text-sm mt-1 ${
                        totalScore >= 17 ? 'text-green-400' :
                        totalScore >= 14 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {totalScore >= 17 ? 'Good' :
                         totalScore >= 14 ? 'Average' : 'Needs Improvement'}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-sm text-gray-400">Weak Areas</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {identifyWeakAreas().areas.map(area => (
                          <Badge key={area} className="bg-red-500/20 text-red-400 border-red-500/30">
                            {area.replace('_', ' ')}
                          </Badge>
                        ))}
                        {identifyWeakAreas().areas.length === 0 && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            No significant weaknesses
                          </Badge>
                        )}
                      </div>
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
                      className="w-full h-24 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Enter any observations or recommendations..."
                    />
                  </div>

                  <Button
                    onClick={handleSaveAssessment}
                    disabled={saving}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saving ? (
                      <>
                        <Activity className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Assessment & Assign Series
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

export default function ClinicFMSAssessment() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-16 w-16 text-blue-400 animate-pulse mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Assessment...</h2>
        </div>
      </div>
    }>
      <ClinicFMSAssessmentContent />
    </Suspense>
  )
}
