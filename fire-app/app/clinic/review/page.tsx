'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Activity, FileText, ChevronLeft, Search,
  Calendar, User, Clock, Target, Star, CheckCircle
} from 'lucide-react'
import { Database } from '@/types/database'
import { getRiskLevel, getRiskBadgeClasses, getRiskLabel, getRiskTextColor } from '@/lib/utils/fms'

type UserData = Database['public']['Tables']['users']['Row']
type FMSScoreData = Database['public']['Tables']['fms_scores']['Row']
type StationData = Database['public']['Tables']['stations']['Row']

interface AssessmentWithDetails extends FMSScoreData {
  user?: UserData
  assessor?: UserData
  station_name?: string
}

export default function ClinicReviewTests() {
  const [user, setUser] = useState<UserData | null>(null)
  const [assessments, setAssessments] = useState<AssessmentWithDetails[]>([])
  const [filteredAssessments, setFilteredAssessments] = useState<AssessmentWithDetails[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'moderate' | 'low'>('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadAssessments()
  }, [])

  useEffect(() => {
    filterAssessments()
  }, [searchTerm, scoreFilter, assessments])

  const loadAssessments = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userError || !userData) {
        router.push('/auth/login')
        return
      }

      // Check role - only clinic and admin
      if (userData.role !== 'clinic' && userData.role !== 'admin') {
        if (userData.role === 'chief') {
          router.push('/chief')
        } else if (userData.role === 'assessor') {
          router.push('/assessor')
        } else {
          router.push('/firefighter')
        }
        return
      }

      setUser(userData)

      // Get station map for display
      const { data: stations } = await supabase
        .from('stations')
        .select('id, name')

      const stationMap = new Map<string, string>()
      stations?.forEach(s => stationMap.set(s.id, s.name))

      // Get ALL FMS assessments department-wide, sorted by most recent
      const { data: assessmentsData } = await supabase
        .from('fms_scores')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)

      if (assessmentsData) {
        // Get all unique user IDs and assessor IDs
        const userIds = new Set<string>()
        assessmentsData.forEach(a => {
          userIds.add(a.user_id)
          if (a.assessed_by) userIds.add(a.assessed_by)
        })

        // Batch fetch all users
        const { data: usersData } = await supabase
          .from('users')
          .select('*')
          .in('id', Array.from(userIds))

        const userMap = new Map<string, UserData>()
        usersData?.forEach(u => userMap.set(u.id, u))

        const enhancedAssessments: AssessmentWithDetails[] = assessmentsData.map(assessment => ({
          ...assessment,
          user: userMap.get(assessment.user_id),
          assessor: assessment.assessed_by ? userMap.get(assessment.assessed_by) : undefined,
          station_name: userMap.get(assessment.user_id)?.station_id
            ? stationMap.get(userMap.get(assessment.user_id)!.station_id!)
            : undefined
        }))

        setAssessments(enhancedAssessments)
        setFilteredAssessments(enhancedAssessments)
      }
    } catch (error) {
      // Error loading assessments
    } finally {
      setLoading(false)
    }
  }

  const filterAssessments = () => {
    let filtered = assessments

    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.user?.badge_number?.includes(searchTerm)
      )
    }

    if (scoreFilter !== 'all') {
      filtered = filtered.filter(a => {
        const risk = getRiskLevel(a.total_score)
        if (scoreFilter === 'low' && risk === 'low') return true
        if (scoreFilter === 'moderate' && risk === 'moderate') return true
        if (scoreFilter === 'high' && risk === 'high') return true
        return false
      })
    }

    setFilteredAssessments(filtered)
  }

  const getScoreColor = (score: number) => getRiskTextColor(score)

  const getScoreBadge = (score: number) => ({
    text: getRiskLabel(score),
    className: getRiskBadgeClasses(score)
  })

  const getWeakAreas = (assessment: AssessmentWithDetails) => {
    return (assessment.weak_areas as any)?.areas || []
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-blue-400 animate-pulse mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Test Results...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/clinic">
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-black/30">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-white">Review Tests</h1>
                <p className="text-xs sm:text-sm text-gray-400">{assessments.length} total assessments</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Filters */}
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name or badge number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={scoreFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScoreFilter('all')}
                  className={scoreFilter === 'all' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-black/50 text-white border-white/30 hover:bg-black/40 hover:border-white/40'}
                >
                  All Scores
                </Button>
                <Button
                  variant={scoreFilter === 'high' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScoreFilter('high')}
                  className={scoreFilter === 'high' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-black/50 text-white border-white/30 hover:bg-black/40 hover:border-white/40'}
                >
                  High Risk (&lt;15)
                </Button>
                <Button
                  variant={scoreFilter === 'moderate' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScoreFilter('moderate')}
                  className={scoreFilter === 'moderate' ? 'bg-yellow-600 text-white hover:bg-yellow-700' : 'bg-black/50 text-white border-white/30 hover:bg-black/40 hover:border-white/40'}
                >
                  Moderate (15-17)
                </Button>
                <Button
                  variant={scoreFilter === 'low' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScoreFilter('low')}
                  className={scoreFilter === 'low' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-black/50 text-white border-white/30 hover:bg-black/40 hover:border-white/40'}
                >
                  Low Risk (18+)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessments List */}
        <div className="grid gap-4">
          {filteredAssessments.length > 0 ? (
            filteredAssessments.map((assessment) => {
              const scoreBadge = getScoreBadge(assessment.total_score)
              return (
                <Link key={assessment.id} href={`/clinic/assessment/review/${assessment.id}`}>
                  <Card className="bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07] transition-all duration-200 cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <h3 className="text-white font-medium">{assessment.user?.name || 'Unknown'}</h3>
                            <Badge variant="outline" className="text-xs border-white/20">
                              Badge #{assessment.user?.badge_number || 'N/A'}
                            </Badge>
                            {assessment.user?.role === 'chief' && (
                              <Badge className="text-xs bg-fire-gold/20 text-fire-gold border-fire-gold/30">
                                Chief
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            {assessment.station_name && (
                              <span className="text-blue-400">{assessment.station_name}</span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {assessment.assessed_date && new Date(assessment.assessed_date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {assessment.created_at && new Date(assessment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {assessment.assessor && (
                              <span className="text-gray-500">
                                by {assessment.assessor.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className={`text-3xl font-bold ${getScoreColor(assessment.total_score)}`}>
                              {assessment.total_score}
                            </p>
                            <p className="text-xs text-gray-400">out of 21</p>
                          </div>
                          <Badge className={scoreBadge.className}>
                            {scoreBadge.text}
                          </Badge>
                        </div>
                      </div>

                      {/* Score Breakdown */}
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-xs text-gray-400 mb-2">Movement Scores:</p>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Squat</p>
                            <p className="text-sm font-semibold text-white">{assessment.deep_squat}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Hurdle</p>
                            <p className="text-sm font-semibold text-white">{assessment.hurdle_step}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Lunge</p>
                            <p className="text-sm font-semibold text-white">{assessment.inline_lunge}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Shoulder</p>
                            <p className="text-sm font-semibold text-white">{assessment.shoulder_mobility}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">ASLR</p>
                            <p className="text-sm font-semibold text-white">{assessment.aslr}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Trunk</p>
                            <p className="text-sm font-semibold text-white">{assessment.trunk_stability}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Rotary</p>
                            <p className="text-sm font-semibold text-white">{assessment.rotary_stability}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })
          ) : (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No assessments found</p>
                <p className="text-xs text-gray-500 mt-2">
                  {searchTerm || scoreFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'No FMS assessments have been conducted yet'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary Stats */}
        {assessments.length > 0 && (
          <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 mt-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Assessment Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{assessments.length}</p>
                  <p className="text-xs text-gray-400">Total Assessments</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">
                    {assessments.filter(a => getRiskLevel(a.total_score) === 'low').length}
                  </p>
                  <p className="text-xs text-gray-400">Low Risk (18-21)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">
                    {assessments.filter(a => getRiskLevel(a.total_score) === 'moderate').length}
                  </p>
                  <p className="text-xs text-gray-400">Moderate (15-17)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-400">
                    {assessments.filter(a => getRiskLevel(a.total_score) === 'high').length}
                  </p>
                  <p className="text-xs text-gray-400">High Risk (&lt;15)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
