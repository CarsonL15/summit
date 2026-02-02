'use client'

import { useEffect, useState, DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft, Save, Search, Activity, Dumbbell,
  ChevronDown, ChevronUp, X, GripVertical
} from 'lucide-react'
import { Database } from '@/types/database'

type ExerciseData = Database['public']['Tables']['exercises']['Row']

interface WeekExercise {
  id: string
  exercise: ExerciseData
  sets: number
  reps: number | null
  duration_seconds: number | null
  order_index: number
}

interface SeriesFormData {
  name: string
  description: string
  target_area: string
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  series_type: 'rehab' | 'strength_conditioning'
  days_per_week: number
}

export default function SeriesCustomizer() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exercises, setExercises] = useState<ExerciseData[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([1, 2, 3])
  const [draggedExercise, setDraggedExercise] = useState<ExerciseData | null>(null)
  const [dragOverWeek, setDragOverWeek] = useState<number | null>(null)

  // Form state
  const [formData, setFormData] = useState<SeriesFormData>({
    name: '',
    description: '',
    target_area: '',
    difficulty_level: 'beginner',
    series_type: 'strength_conditioning',
    days_per_week: 3
  })

  // Week exercises
  const [week1Exercises, setWeek1Exercises] = useState<WeekExercise[]>([])
  const [week2Exercises, setWeek2Exercises] = useState<WeekExercise[]>([])
  const [week3Exercises, setWeek3Exercises] = useState<WeekExercise[]>([])

  const router = useRouter()
  const supabase = createClient()

  // Get unique categories from exercises
  const categories = [...new Set(exercises.map(e => e.category).filter(Boolean))]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      // Verify clinic role
      const { data: clinicUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single()

      if (!clinicUser || (clinicUser.role !== 'clinic' && clinicUser.role !== 'admin')) {
        router.push('/clinic')
        return
      }

      // Load all exercises
      const { data: exercisesData } = await supabase
        .from('exercises')
        .select('*')
        .order('category')
        .order('name')

      if (exercisesData) {
        setExercises(exercisesData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter exercises
  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = !searchTerm ||
      ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === 'all' || ex.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  // Drag handlers
  const handleDragStart = (e: DragEvent<HTMLDivElement>, exercise: ExerciseData) => {
    setDraggedExercise(exercise)
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('text/plain', exercise.id)
  }

  const handleDragEnd = () => {
    setDraggedExercise(null)
    setDragOverWeek(null)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>, week: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDragOverWeek(week)
  }

  const handleDragLeave = () => {
    setDragOverWeek(null)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>, week: number) => {
    e.preventDefault()
    setDragOverWeek(null)

    if (!draggedExercise) return

    addExerciseToWeek(draggedExercise, week)
    setDraggedExercise(null)
  }

  // Add exercise to week
  const addExerciseToWeek = (exercise: ExerciseData, week: number) => {
    const newExercise: WeekExercise = {
      id: `${exercise.id}-${Date.now()}`,
      exercise,
      sets: exercise.sets || 3,
      reps: exercise.reps,
      duration_seconds: exercise.duration_seconds,
      order_index: 0
    }

    switch (week) {
      case 1:
        newExercise.order_index = week1Exercises.length
        setWeek1Exercises([...week1Exercises, newExercise])
        break
      case 2:
        newExercise.order_index = week2Exercises.length
        setWeek2Exercises([...week2Exercises, newExercise])
        break
      case 3:
        newExercise.order_index = week3Exercises.length
        setWeek3Exercises([...week3Exercises, newExercise])
        break
    }
  }

  // Quick add to specific week
  const handleQuickAdd = (exercise: ExerciseData, week: number) => {
    addExerciseToWeek(exercise, week)
  }

  // Remove exercise from week
  const removeExerciseFromWeek = (exerciseId: string, week: number) => {
    switch (week) {
      case 1:
        setWeek1Exercises(week1Exercises.filter(e => e.id !== exerciseId))
        break
      case 2:
        setWeek2Exercises(week2Exercises.filter(e => e.id !== exerciseId))
        break
      case 3:
        setWeek3Exercises(week3Exercises.filter(e => e.id !== exerciseId))
        break
    }
  }

  // Toggle week expansion
  const toggleWeek = (week: number) => {
    setExpandedWeeks(prev =>
      prev.includes(week) ? prev.filter(w => w !== week) : [...prev, week]
    )
  }

  // Get exercises for a week
  const getWeekExercises = (week: number) => {
    switch (week) {
      case 1: return week1Exercises
      case 2: return week2Exercises
      case 3: return week3Exercises
      default: return []
    }
  }

  // Save series
  const handleSaveSeries = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a series name')
      return
    }

    if (week1Exercises.length === 0 && week2Exercises.length === 0 && week3Exercises.length === 0) {
      alert('Please add at least one exercise to the series')
      return
    }

    setSaving(true)

    try {
      // Create series
      const { data: seriesData, error: seriesError } = await supabase
        .from('series')
        .insert({
          name: formData.name,
          description: formData.description || null,
          target_area: formData.target_area || null,
          difficulty_level: formData.difficulty_level,
          series_type: formData.series_type,
          days_per_week: formData.days_per_week,
          duration_weeks: 3
        })
        .select()
        .single()

      if (seriesError) throw seriesError

      // Insert series exercises
      const exerciseInserts: any[] = []

      week1Exercises.forEach((ex, idx) => {
        exerciseInserts.push({
          series_id: seriesData.id,
          exercise_id: ex.exercise.id,
          week_number: 1,
          order_in_week: idx + 1,
          custom_sets: ex.sets !== ex.exercise.sets ? ex.sets : null,
          custom_reps: ex.reps !== ex.exercise.reps ? ex.reps : null,
          custom_duration: ex.duration_seconds !== ex.exercise.duration_seconds ? ex.duration_seconds : null
        })
      })

      week2Exercises.forEach((ex, idx) => {
        exerciseInserts.push({
          series_id: seriesData.id,
          exercise_id: ex.exercise.id,
          week_number: 2,
          order_in_week: idx + 1,
          custom_sets: ex.sets !== ex.exercise.sets ? ex.sets : null,
          custom_reps: ex.reps !== ex.exercise.reps ? ex.reps : null,
          custom_duration: ex.duration_seconds !== ex.exercise.duration_seconds ? ex.duration_seconds : null
        })
      })

      week3Exercises.forEach((ex, idx) => {
        exerciseInserts.push({
          series_id: seriesData.id,
          exercise_id: ex.exercise.id,
          week_number: 3,
          order_in_week: idx + 1,
          custom_sets: ex.sets !== ex.exercise.sets ? ex.sets : null,
          custom_reps: ex.reps !== ex.exercise.reps ? ex.reps : null,
          custom_duration: ex.duration_seconds !== ex.exercise.duration_seconds ? ex.duration_seconds : null
        })
      })

      if (exerciseInserts.length > 0) {
        const { error: exercisesError } = await supabase
          .from('series_exercises')
          .insert(exerciseInserts)

        if (exercisesError) throw exercisesError
      }

      router.push('/clinic/series')
    } catch (error) {
      console.error('Error saving series:', error)
      alert('Failed to save series. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="h-16 w-16 text-purple-400 animate-pulse mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Series Builder...</h2>
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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/clinic/series">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-black/30">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Dumbbell className="h-8 w-8 text-purple-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Series Builder</h1>
                  <p className="text-sm text-gray-400">Drag exercises to build your series</p>
                </div>
              </div>
            </div>
            <Button
              onClick={handleSaveSeries}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {saving ? (
                <>
                  <Activity className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Series
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Two Column Layout */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[480px_1fr] gap-6">
          {/* LEFT SIDE - Exercise Library */}
          <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:overflow-hidden">
            <Card className="bg-white/5 border-white/10 h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-purple-400" />
                  Exercise Library
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Drag exercises to add them to a week
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden flex flex-col">
                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search exercises..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>

                {/* Category Filters */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    size="sm"
                    variant={categoryFilter === 'all' ? 'default' : 'outline'}
                    onClick={() => setCategoryFilter('all')}
                    className={categoryFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-white/5 text-white border-white/20'}
                  >
                    All
                  </Button>
                  {categories.map(cat => (
                    <Button
                      key={cat}
                      size="sm"
                      variant={categoryFilter === cat ? 'default' : 'outline'}
                      onClick={() => setCategoryFilter(cat!)}
                      className={categoryFilter === cat ? 'bg-purple-600 text-white' : 'bg-white/5 text-white border-white/20'}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>

                {/* Exercise List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {filteredExercises.map((exercise) => (
                    <div
                      key={exercise.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, exercise)}
                      onDragEnd={handleDragEnd}
                      className={`p-3 rounded-lg bg-white/5 border border-white/10 cursor-grab active:cursor-grabbing hover:bg-black/30 transition-colors ${
                        draggedExercise?.id === exercise.id ? 'opacity-50 border-purple-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <GripVertical className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-white truncate">{exercise.name}</p>
                            <p className="text-xs text-gray-400">
                              {exercise.category}
                              {exercise.sets && exercise.reps && ` • ${exercise.sets}×${exercise.reps}`}
                            </p>
                          </div>
                        </div>
                        {/* Quick add buttons */}
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleQuickAdd(exercise, 1)}
                            className="px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                          >
                            W1
                          </button>
                          <button
                            onClick={() => handleQuickAdd(exercise, 2)}
                            className="px-2 py-1 text-xs rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                          >
                            W2
                          </button>
                          <button
                            onClick={() => handleQuickAdd(exercise, 3)}
                            className="px-2 py-1 text-xs rounded bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors"
                          >
                            W3
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredExercises.length === 0 && (
                    <p className="text-center text-gray-400 py-8">No exercises found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT SIDE - Series Details & Weeks */}
          <div className="space-y-6">
            {/* Series Details */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Series Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Series Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Hip Mobility Focus"
                      className="bg-white/5 border-white/20 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Target Area</Label>
                    <Select
                      value={formData.target_area}
                      onValueChange={(value) => setFormData({ ...formData, target_area: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/20 text-white mt-1">
                        <SelectValue placeholder="Select area..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hip">Hip</SelectItem>
                        <SelectItem value="shoulder">Shoulder</SelectItem>
                        <SelectItem value="core">Core</SelectItem>
                        <SelectItem value="back">Back</SelectItem>
                        <SelectItem value="knee">Knee</SelectItem>
                        <SelectItem value="ankle">Ankle</SelectItem>
                        <SelectItem value="full_body">Full Body</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-white">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this series..."
                    className="bg-white/5 border-white/20 text-white mt-1"
                    rows={2}
                  />
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-white">Difficulty</Label>
                    <Select
                      value={formData.difficulty_level}
                      onValueChange={(value: any) => setFormData({ ...formData, difficulty_level: value })}
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
                    <Label className="text-white">Series Type</Label>
                    <Select
                      value={formData.series_type}
                      onValueChange={(value: any) => setFormData({
                        ...formData,
                        series_type: value,
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
                    <Label className="text-white">Days per Week</Label>
                    <Input
                      type="number"
                      min={1}
                      max={7}
                      value={formData.days_per_week}
                      onChange={(e) => setFormData({ ...formData, days_per_week: parseInt(e.target.value) || 3 })}
                      className="bg-white/5 border-white/20 text-white mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.series_type === 'rehab' ? 'Rehab typically 7 days/week' : 'S&C typically 3 days/week'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Exercises */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Weekly Exercises</CardTitle>
                <CardDescription className="text-gray-400">
                  Build your 3-week program by dragging exercises into each week
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((week) => {
                  const weekExercises = getWeekExercises(week)
                  const isExpanded = expandedWeeks.includes(week)
                  const weekLabels = ['Foundation', 'Progression', 'Integration']

                  // Static class mappings for each week
                  const weekStyles = {
                    1: {
                      badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                      active: 'border-blue-500 bg-blue-500/10',
                      dropzone: 'border-blue-500 bg-blue-500/5'
                    },
                    2: {
                      badge: 'bg-green-500/20 text-green-400 border-green-500/30',
                      active: 'border-green-500 bg-green-500/10',
                      dropzone: 'border-green-500 bg-green-500/5'
                    },
                    3: {
                      badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                      active: 'border-orange-500 bg-orange-500/10',
                      dropzone: 'border-orange-500 bg-orange-500/5'
                    }
                  }
                  const styles = weekStyles[week as keyof typeof weekStyles]

                  return (
                    <div
                      key={week}
                      onDragOver={(e) => handleDragOver(e, week)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, week)}
                      className={`rounded-lg border-2 transition-all ${
                        dragOverWeek === week
                          ? styles.active
                          : 'border-white/10 bg-white/5'
                      }`}
                    >
                      {/* Week Header */}
                      <div
                        className="p-4 cursor-pointer flex items-center justify-between"
                        onClick={() => toggleWeek(week)}
                      >
                        <div className="flex items-center gap-3">
                          <Badge className={styles.badge}>
                            Week {week}
                          </Badge>
                          <span className="font-medium text-white">{weekLabels[week - 1]}</span>
                          <span className="text-sm text-gray-400">({weekExercises.length} exercises)</span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>

                      {/* Week Content */}
                      {isExpanded && (
                        <div className="px-4 pb-4">
                          {weekExercises.length > 0 ? (
                            <div className="space-y-2">
                              {weekExercises.map((ex, index) => (
                                <div
                                  key={ex.id}
                                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-500 w-6">{index + 1}.</span>
                                    <div>
                                      <p className="text-white font-medium">{ex.exercise.name}</p>
                                      <p className="text-xs text-gray-400">
                                        {ex.sets} sets × {ex.reps || ex.duration_seconds + 's'}
                                        {ex.exercise.category && ` • ${ex.exercise.category}`}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeExerciseFromWeek(ex.id, week)}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                              dragOverWeek === week
                                ? styles.dropzone
                                : 'border-white/20'
                            }`}>
                              <Dumbbell className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                              <p className="text-gray-400">
                                {dragOverWeek === week
                                  ? 'Drop exercise here!'
                                  : 'Drag exercises here or use W1/W2/W3 buttons'}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
