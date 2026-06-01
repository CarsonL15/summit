'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Layers, ArrowLeft, Save, Trash2, Calendar, Target,
  Activity, ChevronDown, ChevronUp, Plus, X, Dumbbell,
  Heart, Zap, AlertCircle
} from 'lucide-react'
import { Database } from '@/types/database'

type Series = Database['public']['Tables']['series']['Row']
type Exercise = Database['public']['Tables']['exercises']['Row']

interface SeriesExercise {
  id: string
  series_id: string
  exercise_id: string
  week_number: number
  day_number: number | null
  order_in_week: number
  custom_sets: number | null
  custom_reps: number | null
  custom_duration: number | null
  exercise?: Exercise
}

export default function SeriesDetailPage() {
  const params = useParams()
  const seriesId = params.id as string
  const router = useRouter()
  const supabase = createClient()

  const [series, setSeries] = useState<Series | null>(null)
  const [seriesExercises, setSeriesExercises] = useState<SeriesExercise[]>([])
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([1, 2, 3])
  const [showExerciseSelector, setShowExerciseSelector] = useState<number | null>(null)
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_area: '',
    difficulty_level: 'intermediate' as string,
    series_type: 'strength_conditioning' as 'rehab' | 'strength_conditioning',
    days_per_week: 3,
    duration_weeks: 3
  })

  useEffect(() => {
    loadSeriesData()
  }, [seriesId])

  const loadSeriesData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Load series
      const { data: seriesData, error: seriesError } = await supabase
        .from('series')
        .select('*')
        .eq('id', seriesId)
        .single()

      if (seriesError || !seriesData) {
        router.push('/clinic/series')
        return
      }

      setSeries(seriesData)
      setFormData({
        name: seriesData.name,
        description: seriesData.description || '',
        target_area: seriesData.target_area || '',
        difficulty_level: seriesData.difficulty_level || 'intermediate',
        series_type: seriesData.series_type || 'strength_conditioning',
        days_per_week: seriesData.days_per_week || 3,
        duration_weeks: seriesData.duration_weeks || 3
      })

      // Load series exercises with exercise details
      const { data: exercisesData } = await supabase
        .from('series_exercises')
        .select(`
          *,
          exercise:exercises(*)
        `)
        .eq('series_id', seriesId)
        .order('week_number')
        .order('order_in_week') as { data: any[] | null; error: any }

      if (exercisesData) {
        setSeriesExercises(exercisesData.map(e => ({
          ...e,
          exercise: e.exercise as Exercise
        })))
      }

      // Load all exercises for the selector
      const { data: allExercisesData } = await supabase
        .from('exercises')
        .select('*')
        .order('name')

      if (allExercisesData) {
        setAllExercises(allExercisesData)
      }
    } catch (error) {
      // Error loading series data
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!series) return
    setSaving(true)

    try {
      const { error } = await supabase
        .from('series')
        .update({
          name: formData.name,
          description: formData.description || null,
          target_area: formData.target_area || null,
          difficulty_level: formData.difficulty_level,
          series_type: formData.series_type as 'rehab' | 'strength_conditioning',
          days_per_week: formData.days_per_week,
          duration_weeks: formData.duration_weeks,
          updated_at: new Date().toISOString()
        })
        .eq('id', seriesId)

      if (error) throw error

      setSeries({ ...series, ...formData })
      setIsEditing(false)
    } catch (error) {
      alert('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      return
    }

    setSaving(true)
    try {
      // Delete series exercises first
      await supabase
        .from('series_exercises')
        .delete()
        .eq('series_id', seriesId)

      // Delete series
      const { error } = await supabase
        .from('series')
        .delete()
        .eq('id', seriesId)

      if (error) throw error

      router.push('/clinic/series')
    } catch (error) {
      alert('Failed to delete series')
      setSaving(false)
    }
  }

  const addExerciseToWeek = async (exerciseId: string, weekNumber: number) => {
    const maxOrder = seriesExercises
      .filter(e => e.week_number === weekNumber)
      .reduce((max, e) => Math.max(max, e.order_in_week), 0)

    try {
      const { data, error } = await supabase
        .from('series_exercises')
        .insert({
          series_id: seriesId,
          exercise_id: exerciseId,
          week_number: weekNumber,
          order_in_week: maxOrder + 1
        })
        .select(`*, exercise:exercises(*)`)
        .single() as { data: any; error: any }

      if (error) throw error

      setSeriesExercises([...seriesExercises, {
        ...data,
        exercise: data.exercise as Exercise
      }])
      setShowExerciseSelector(null)
      setExerciseSearch('')
    } catch (error) {
      // Error adding exercise
    }
  }

  const removeExercise = async (exerciseId: string) => {
    try {
      const { error } = await supabase
        .from('series_exercises')
        .delete()
        .eq('id', exerciseId)

      if (error) throw error

      setSeriesExercises(seriesExercises.filter(e => e.id !== exerciseId))
    } catch (error) {
      // Error removing exercise
    }
  }

  const toggleWeek = (week: number) => {
    setExpandedWeeks(prev =>
      prev.includes(week) ? prev.filter(w => w !== week) : [...prev, week]
    )
  }

  const getExercisesForWeek = (week: number) => {
    return seriesExercises.filter(e => e.week_number === week)
  }

  const filteredExercises = allExercises.filter(e =>
    e.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
    e.category?.toLowerCase().includes(exerciseSearch.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Layers className="h-16 w-16 text-purple-400 animate-pulse mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Series...</h2>
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    )
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Series Not Found</h2>
          <Link href="/clinic/series">
            <Button>Back to Series</Button>
          </Link>
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
              <Link href="/clinic/series">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-black/30">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                {formData.series_type === 'rehab' ? (
                  <Heart className="h-6 w-6 text-orange-400" />
                ) : (
                  <Zap className="h-6 w-6 text-blue-400" />
                )}
                <div>
                  <h1 className="text-base sm:text-xl font-bold text-white">
                    {isEditing ? 'Edit Series' : series.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-400">
                    {formData.series_type === 'rehab' ? 'Rehabilitation' : 'Strength & Conditioning'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({
                        name: series.name,
                        description: series.description || '',
                        target_area: series.target_area || '',
                        difficulty_level: series.difficulty_level || 'intermediate',
                        series_type: series.series_type || 'strength_conditioning',
                        days_per_week: series.days_per_week || 3,
                        duration_weeks: series.duration_weeks || 3
                      })
                    }}
                    className="text-gray-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => { setDeleteConfirm(false); setIsEditing(true); }}
                    className="bg-white/5 border-white/20 text-white"
                  >
                    Edit Details
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={saving}
                    className={deleteConfirm ? 'bg-red-600' : ''}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleteConfirm ? 'Confirm Delete' : 'Delete'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Series Details */}
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Series Details</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-white/5 border-white/20 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Target Area</Label>
                    <Input
                      value={formData.target_area}
                      onChange={(e) => setFormData({ ...formData, target_area: e.target.value })}
                      placeholder="e.g., Hip, Shoulder, Core"
                      className="bg-white/5 border-white/20 text-white mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-white">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-white/5 border-white/20 text-white mt-1"
                    rows={2}
                  />
                </div>
                <div className="grid sm:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-white">Series Type</Label>
                    <Select
                      value={formData.series_type}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        series_type: value as 'rehab' | 'strength_conditioning',
                        days_per_week: value === 'rehab' ? 7 : 3
                      })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/20 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strength_conditioning">Strength & Conditioning</SelectItem>
                        <SelectItem value="rehab">Rehabilitation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white">Difficulty</Label>
                    <Select
                      value={formData.difficulty_level}
                      onValueChange={(value) => setFormData({ ...formData, difficulty_level: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/20 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white">Duration (weeks)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      value={formData.duration_weeks}
                      onChange={(e) => setFormData({ ...formData, duration_weeks: parseInt(e.target.value) || 3 })}
                      className="bg-white/5 border-white/20 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Days/Week</Label>
                    <Input
                      type="number"
                      min={1}
                      max={7}
                      value={formData.days_per_week}
                      onChange={(e) => setFormData({ ...formData, days_per_week: parseInt(e.target.value) || 3 })}
                      className="bg-white/5 border-white/20 text-white mt-1"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Target Area</p>
                  <p className="text-white">{series.target_area || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Difficulty</p>
                  <Badge className={
                    series.difficulty_level === 'beginner' ? 'bg-green-500/20 text-green-400' :
                    series.difficulty_level === 'advanced' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }>
                    {series.difficulty_level || 'Intermediate'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Duration</p>
                  <p className="text-white flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {series.duration_weeks || 3} weeks
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Frequency</p>
                  <p className="text-white flex items-center gap-1">
                    <Activity className="h-4 w-4" />
                    {series.days_per_week || 3} days/week
                  </p>
                </div>
                {series.description && (
                  <div className="sm:col-span-2 lg:col-span-4">
                    <p className="text-xs text-gray-400">Description</p>
                    <p className="text-white">{series.description}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Exercises */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-purple-400" />
            Weekly Exercises
          </h2>

          {[1, 2, 3].map((week) => (
            <Card key={week} className="bg-white/5 border-white/10">
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleWeek(week)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    Week {week}
                    <Badge variant="outline" className="text-gray-400 border-white/20">
                      {getExercisesForWeek(week).length} exercises
                    </Badge>
                  </CardTitle>
                  {expandedWeeks.includes(week) ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </CardHeader>
              {expandedWeeks.includes(week) && (
                <CardContent>
                  <div className="space-y-2">
                    {getExercisesForWeek(week).map((se, index) => (
                      <div
                        key={se.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-6">{index + 1}.</span>
                          <div>
                            <p className="text-white font-medium">{se.exercise?.name}</p>
                            <p className="text-xs text-gray-400">
                              {se.custom_sets || se.exercise?.sets || 3} sets × {se.custom_reps || se.exercise?.reps || 10} reps
                              {se.exercise?.category && ` • ${se.exercise.category}`}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExercise(se.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    {/* Add Exercise Button/Selector */}
                    {showExerciseSelector === week ? (
                      <div className="p-3 rounded-lg bg-white/5 border border-purple-500/30">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-white font-medium">Add Exercise</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowExerciseSelector(null)
                              setExerciseSearch('')
                            }}
                            className="text-gray-400"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Search exercises..."
                          value={exerciseSearch}
                          onChange={(e) => setExerciseSearch(e.target.value)}
                          className="bg-white/5 border-white/20 text-white mb-2"
                          autoFocus
                        />
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {filteredExercises.slice(0, 10).map((exercise) => (
                            <button
                              key={exercise.id}
                              onClick={() => addExerciseToWeek(exercise.id, week)}
                              className="w-full text-left p-2 rounded hover:bg-black/30 transition-colors"
                            >
                              <p className="text-sm text-white">{exercise.name}</p>
                              <p className="text-xs text-gray-400">
                                {exercise.sets} × {exercise.reps}
                                {exercise.category && ` • ${exercise.category}`}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => setShowExerciseSelector(week)}
                        className="w-full bg-white/5 border-white/20 border-dashed text-gray-400 hover:text-white hover:bg-black/30"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Exercise
                      </Button>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
