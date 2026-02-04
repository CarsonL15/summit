'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Layers, Plus, ArrowLeft, Search, Activity, Calendar,
  Target, Dumbbell, ChevronRight, Heart, Zap
} from 'lucide-react'
import { Database } from '@/types/database'

type Series = Database['public']['Tables']['series']['Row']

export default function SeriesManagementPage() {
  const [series, setSeries] = useState<Series[]>([])
  const [filteredSeries, setFilteredSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'rehab' | 'strength_conditioning'>('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadSeries()
  }, [])

  useEffect(() => {
    filterSeries()
  }, [searchQuery, typeFilter, series])

  const loadSeries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase
        .from('series')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error loading series:', error)
        return
      }

      setSeries(data || [])
      setFilteredSeries(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterSeries = () => {
    let filtered = [...series]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.target_area?.toLowerCase().includes(query)
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(s => s.series_type === typeFilter)
    }

    setFilteredSeries(filtered)
  }

  const getSeriesTypeColor = (type: string | null) => {
    if (type === 'rehab') return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  }

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'advanced': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Layers className="h-16 w-16 text-purple-400 animate-pulse mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Series...</h2>
          <div className="space-y-2">
            <Skeleton className="h-4 w-48 mx-auto" />
            <Skeleton className="h-4 w-36 mx-auto" />
          </div>
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
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-black/30">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Layers className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" />
                <div>
                  <h1 className="text-base sm:text-xl font-bold text-white">Mini Series</h1>
                  <p className="text-xs sm:text-sm text-gray-400">Manage exercise programs</p>
                </div>
              </div>
            </div>
            <Link href="/clinic/series/customize">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Search & Filter */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search series by name, description, or target area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={typeFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setTypeFilter('all')}
              className={typeFilter === 'all' ? 'bg-purple-600' : 'bg-white/5 text-white border-white/20'}
            >
              All Types
            </Button>
            <Button
              size="sm"
              variant={typeFilter === 'rehab' ? 'default' : 'outline'}
              onClick={() => setTypeFilter('rehab')}
              className={typeFilter === 'rehab' ? 'bg-orange-600' : 'bg-white/5 text-white border-white/20'}
            >
              <Heart className="h-3 w-3 mr-1" />
              Rehab
            </Button>
            <Button
              size="sm"
              variant={typeFilter === 'strength_conditioning' ? 'default' : 'outline'}
              onClick={() => setTypeFilter('strength_conditioning')}
              className={typeFilter === 'strength_conditioning' ? 'bg-blue-600' : 'bg-white/5 text-white border-white/20'}
            >
              <Zap className="h-3 w-3 mr-1" />
              S&C
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-white">{series.length}</p>
              <p className="text-xs text-gray-400">Total Series</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-400">
                {series.filter(s => s.series_type === 'rehab').length}
              </p>
              <p className="text-xs text-gray-400">Rehab Programs</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">
                {series.filter(s => s.series_type === 'strength_conditioning').length}
              </p>
              <p className="text-xs text-gray-400">S&C Programs</p>
            </CardContent>
          </Card>
        </div>

        {/* Series List */}
        <div className="space-y-4">
          {filteredSeries.length > 0 ? (
            filteredSeries.map((s) => (
              <Link key={s.id} href={`/clinic/series/${s.id}`} className="block">
                <Card className="bg-white/5 border-white/10 hover:bg-black/30 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-white truncate">{s.name}</h3>
                          <Badge className={getSeriesTypeColor(s.series_type)}>
                            {s.series_type === 'rehab' ? 'Rehab' : 'S&C'}
                          </Badge>
                          {s.difficulty_level && (
                            <Badge className={getDifficultyColor(s.difficulty_level)}>
                              {s.difficulty_level}
                            </Badge>
                          )}
                        </div>
                        {s.description && (
                          <p className="text-sm text-gray-400 mb-2 line-clamp-1">{s.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {s.target_area && (
                            <span className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              {s.target_area}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {s.duration_weeks || 3} weeks
                          </span>
                          <span className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            {s.days_per_week || (s.series_type === 'rehab' ? 7 : 3)} days/week
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-8 text-center">
                <Layers className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 mb-4">
                  {searchQuery || typeFilter !== 'all'
                    ? 'No series match your filters'
                    : 'No series created yet'}
                </p>
                <Link href="/clinic/series/customize">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Series
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
