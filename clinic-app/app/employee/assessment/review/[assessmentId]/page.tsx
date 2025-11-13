'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { AnimatedCard, AnimatedCardContent, AnimatedCardHeader, AnimatedCardTitle, AnimatedCardDescription } from '@/components/ui/animated-card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ProgressBar } from '@/components/ui/progress-bar'
import {
  ChevronLeft,
  Trash2,
  Plus,
  Save,
  Calendar,
  Activity,
  Target,
  ClipboardCheck,
  Dumbbell,
  Timer,
  CheckCircle2,
  Info,
  Mountain,
  Loader2,
  Edit3,
  X
} from 'lucide-react'
import type { Database } from '@/types/supabase'

type Exercise = Database['public']['Tables']['exercises']['Row']
type Assignment = Database['public']['Tables']['exercise_assignments']['Row'] & {
  exercises: Exercise
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function ReviewAssignmentsPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const assessmentId = params.assessmentId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
  const [patientName, setPatientName] = useState('')
  const [patientId, setPatientId] = useState<string>('')
  const [assessmentScore, setAssessmentScore] = useState(0)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [programDuration, setProgramDuration] = useState(7)
  const [editedAssignments, setEditedAssignments] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchData()
  }, [assessmentId])

  const fetchData = async () => {
    try {
      // Fetch assessment details with patient info
      const { data: assessment } = await supabase
        .from('fms_assessments')
        .select(`
          *,
          users!fms_assessments_patient_id_fkey(
            first_name,
            last_name
          )
        `)
        .eq('id', assessmentId)
        .single()

      if (assessment) {
        setPatientName(`${assessment.users.first_name} ${assessment.users.last_name}`)
        setPatientId(assessment.patient_id)
        setAssessmentScore(assessment.total_score)
      }

      // Fetch assigned exercises for this assessment
      const { data: assignedExercises } = await supabase
        .from('exercise_assignments')
        .select(`
          *,
          exercises(*)
        `)
        .eq('assessment_id', assessmentId)
        .order('created_at')

      if (assignedExercises) {
        setAssignments(assignedExercises as Assignment[])
        // Calculate program duration from first assignment
        if (assignedExercises.length > 0) {
          const start = new Date(assignedExercises[0].start_date)
          const end = new Date(assignedExercises[0].end_date)
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
          setProgramDuration(days)
        }
      }

      // Fetch all exercises for adding new ones
      const { data: exercises } = await supabase
        .from('exercises')
        .select('*')
        .order('category', { ascending: true })

      if (exercises) {
        setAllExercises(exercises)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeAssignment = async (assignmentId: string) => {
    const { error } = await supabase
      .from('exercise_assignments')
      .delete()
      .eq('id', assignmentId)

    if (!error) {
      setAssignments(prev => prev.filter(a => a.id !== assignmentId))
    }
  }

  const addExercise = async (exerciseId: string) => {
    try {
      // Get current user (employee)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Use patient ID from state (set from assessment)
      if (!patientId) {
        console.error('No patient ID available')
        return
      }

      const today = new Date()
      const endDate = new Date(today)
      endDate.setDate(endDate.getDate() + programDuration)

      const exercise = allExercises.find(ex => ex.id === exerciseId)
      if (!exercise) return

      const { data, error } = await supabase
        .from('exercise_assignments')
        .insert({
          patient_id: patientId,
          exercise_id: exerciseId,
          assigned_by: user.id,
          assigned_date: today.toISOString().split('T')[0],
          start_date: today.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          due_date: endDate.toISOString().split('T')[0],
          daily_target: 1,
          custom_sets: exercise.sets,
          custom_reps: exercise.reps,
          total_completions_required: programDuration,
          assessment_id: assessmentId,
          phase: 'mobilize'
        })
        .select(`
          *,
          exercises(*)
        `)
        .single()

      if (error) {
        console.error('Error inserting exercise:', error)
        alert('Failed to add exercise. Please try again.')
        return
      }

      if (data) {
        setAssignments(prev => [...prev, data as Assignment])
        setShowAddExercise(false)
        setSelectedCategory('')
      }
    } catch (error) {
      console.error('Error adding exercise:', error)
      alert('An error occurred while adding the exercise.')
    }
  }

  const updateAssignment = (assignmentId: string, field: string, value: number) => {
    setAssignments(prev => prev.map(a =>
      a.id === assignmentId ? { ...a, [field]: value } : a
    ))
    setEditedAssignments(prev => new Set(prev).add(assignmentId))
  }

  const updateProgramDuration = (days: number) => {
    if (!days || days < 1) return
    setProgramDuration(days)

    // Mark all assignments as edited since duration affects them all
    setEditedAssignments(new Set(assignments.map(a => a.id)))
  }

  const saveAndReturn = async () => {
    setSaving(true)

    try {
      // Calculate new end date based on program duration
      const today = new Date()
      const newEndDate = new Date(today)
      newEndDate.setDate(newEndDate.getDate() + programDuration)

      // Update all edited assignments
      for (const assignment of assignments) {
        if (editedAssignments.has(assignment.id) || programDuration !== 7) {
          await supabase
            .from('exercise_assignments')
            .update({
              custom_sets: assignment.custom_sets,
              custom_reps: assignment.custom_reps,
              total_completions_required: assignment.total_completions_required,
              end_date: newEndDate.toISOString().split('T')[0],
              due_date: newEndDate.toISOString().split('T')[0]
            })
            .eq('id', assignment.id)
        }
      }

      // Show success and redirect
      setTimeout(() => {
        router.push('/employee')
      }, 1000)
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setSaving(false)
    }
  }

  const categories = [...new Set(allExercises.map(ex => ex.category))]

  const getScoreColor = (score: number) => {
    if (score <= 10) return 'destructive'
    if (score <= 14) return 'warning'
    return 'success'
  }

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Deep Squat': '🏋️',
      'Hurdle Step': '🦵',
      'Inline Lunge': '🤸',
      'Shoulder Mobility': '💪',
      'ASLR': '🦿',
      'Trunk Stability': '🏃',
      'Rotary Stability': '🔄',
    }
    return icons[category] || '🎯'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Mountain className="w-16 h-16 mx-auto text-summit-blue animate-pulse" />
          <h2 className="text-xl font-semibold font-display">Loading exercise assignments...</h2>
          <div className="space-y-2 max-w-xs mx-auto">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-summit-blue/5 via-background to-summit-gold/5">
      {/* Header */}
      <header className="bg-card shadow-sm border-b sticky top-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/employee/assessment')}
              className="rounded-xl"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              <h1 className="text-2xl font-bold font-display text-foreground flex items-center">
                <ClipboardCheck className="w-6 h-6 mr-2 text-summit-blue" />
                Review Exercise Assignments
              </h1>
              <p className="text-muted-foreground">
                {patientName} • FMS Score: {assessmentScore}/21
              </p>
            </motion.div>
            <Badge
              className={`bg-${getScoreColor(assessmentScore)} text-white rounded-full px-3 py-1`}
            >
              {assessmentScore <= 10 ? 'High Priority' : assessmentScore <= 14 ? 'Moderate' : 'Good'}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Summary Card */}
          <motion.div variants={item}>
            <AnimatedCard delay={0.1} className="bg-gradient-to-r from-summit-blue/5 to-summit-gold/5">
              <AnimatedCardHeader>
                <AnimatedCardTitle className="font-display flex items-center">
                  <Target className="w-5 h-5 mr-2 text-summit-blue" />
                  Program Summary
                </AnimatedCardTitle>
                <AnimatedCardDescription>
                  Customize the exercise program based on assessment results
                </AnimatedCardDescription>
              </AnimatedCardHeader>
              <AnimatedCardContent>
                <div className="grid grid-cols-3 gap-6">
                  <motion.div
                    className="text-center p-4 bg-background rounded-xl"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    <Activity className="w-8 h-8 text-summit-blue mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Total Exercises</p>
                    <p className="text-3xl font-bold font-display">{assignments.length}</p>
                  </motion.div>

                  <motion.div
                    className="text-center p-4 bg-background rounded-xl"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  >
                    <Timer className="w-8 h-8 text-summit-gold mx-auto mb-2" />
                    <Label className="text-sm text-muted-foreground block mb-2">
                      Program Duration (days)
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      className="w-24 mx-auto text-center text-2xl font-bold h-12 rounded-xl"
                      value={programDuration}
                      onChange={(e) => updateProgramDuration(parseInt(e.target.value))}
                    />
                  </motion.div>

                  <motion.div
                    className="text-center p-4 bg-background rounded-xl"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                  >
                    <Mountain className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Phase</p>
                    <Badge className="bg-phase-mobilize text-white text-lg px-3 py-1 rounded-full">
                      MOBILIZE
                    </Badge>
                  </motion.div>
                </div>
              </AnimatedCardContent>
            </AnimatedCard>
          </motion.div>

          {/* Assigned Exercises */}
          <motion.div variants={item}>
            <AnimatedCard delay={0.2}>
              <AnimatedCardHeader>
                <div className="flex justify-between items-center">
                  <AnimatedCardTitle className="font-display flex items-center">
                    <Dumbbell className="w-5 h-5 mr-2 text-summit-blue" />
                    Exercise Program
                  </AnimatedCardTitle>
                  <Button
                    onClick={() => setShowAddExercise(!showAddExercise)}
                    variant={showAddExercise ? "secondary" : "outline"}
                    className="rounded-xl"
                  >
                    {showAddExercise ? (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Exercise
                      </>
                    )}
                  </Button>
                </div>
              </AnimatedCardHeader>
              <AnimatedCardContent>
                {/* Add Exercise Panel */}
                <AnimatePresence>
                  {showAddExercise && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6 p-4 bg-summit-blue/10 rounded-xl overflow-hidden"
                    >
                      <Label className="text-sm font-medium mb-3 block flex items-center">
                        <Info className="w-4 h-4 mr-2 text-summit-blue" />
                        Select Exercise Category and Exercise
                      </Label>
                      <div className="space-y-3">
                        <select
                          className="w-full p-3 border-2 rounded-xl bg-background text-foreground focus:border-summit-blue focus:outline-none transition-colors"
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                          <option value="">Select Category...</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat}>
                              {getCategoryIcon(cat)} {cat}
                            </option>
                          ))}
                        </select>

                        <AnimatePresence>
                          {selectedCategory && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="grid grid-cols-2 gap-2"
                            >
                              {allExercises
                                .filter(ex => ex.category === selectedCategory)
                                .filter(ex => !assignments.find(a => a.exercise_id === ex.id))
                                .map((exercise, index) => (
                                  <motion.div
                                    key={exercise.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                  >
                                    <Button
                                      variant="outline"
                                      onClick={() => addExercise(exercise.id)}
                                      className="w-full text-left justify-start rounded-xl hover:bg-summit-blue/10 hover:border-summit-blue transition-all"
                                    >
                                      <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                                      {exercise.name}
                                    </Button>
                                  </motion.div>
                                ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Exercise List */}
                <motion.div
                  className="space-y-3"
                  variants={container}
                  initial="hidden"
                  animate="show"
                >
                  {assignments.length === 0 ? (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-muted-foreground text-center py-12"
                    >
                      No exercises assigned yet. Click "Add Exercise" to get started.
                    </motion.p>
                  ) : (
                    assignments.map((assignment, index) => (
                      <motion.div
                        key={assignment.id}
                        variants={item}
                        layout
                        className="p-4 bg-muted/30 border-2 rounded-xl hover:border-summit-blue/30 transition-all group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold font-display text-lg flex items-center gap-2">
                                  <span className="text-2xl">{getCategoryIcon(assignment.exercises.category)}</span>
                                  {assignment.exercises.name}
                                </h4>
                                <div className="flex items-center gap-3 mt-1">
                                  <Badge variant="outline" className="rounded-full">
                                    {assignment.exercises.category}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {assignment.exercises.duration_seconds}s per rep
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAssignment(assignment.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Editable Parameters */}
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <Label className="text-xs text-muted-foreground mb-1 block flex items-center">
                                  <Edit3 className="w-3 h-3 mr-1" />
                                  Sets
                                </Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="10"
                                  className="h-10 text-center font-semibold rounded-xl"
                                  value={assignment.custom_sets || assignment.exercises.sets}
                                  onChange={(e) => updateAssignment(assignment.id, 'custom_sets', parseInt(e.target.value))}
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground mb-1 block flex items-center">
                                  <Edit3 className="w-3 h-3 mr-1" />
                                  Reps
                                </Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="50"
                                  className="h-10 text-center font-semibold rounded-xl"
                                  value={assignment.custom_reps || assignment.exercises.reps}
                                  onChange={(e) => updateAssignment(assignment.id, 'custom_reps', parseInt(e.target.value))}
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground mb-1 block flex items-center">
                                  <Edit3 className="w-3 h-3 mr-1" />
                                  Total Completions
                                </Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="30"
                                  className="h-10 text-center font-semibold rounded-xl"
                                  value={assignment.total_completions_required || programDuration}
                                  onChange={(e) => updateAssignment(assignment.id, 'total_completions_required', parseInt(e.target.value))}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {new Date(assignment.start_date).toLocaleDateString()} -
                                  {' '}{new Date(new Date().setDate(new Date().getDate() + programDuration)).toLocaleDateString()}
                                </span>
                              </div>
                              {editedAssignments.has(assignment.id) && (
                                <Badge variant="outline" className="bg-summit-gold/10 text-summit-gold-dark border-summit-gold/30">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Modified
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              </AnimatedCardContent>
            </AnimatedCard>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            variants={item}
            className="flex justify-between items-center"
          >
            <Button
              variant="outline"
              onClick={() => router.push('/employee')}
              className="rounded-xl"
            >
              Cancel Changes
            </Button>

            <div className="flex gap-2 items-center">
              {editedAssignments.size > 0 && (
                <Badge variant="outline" className="mr-2">
                  {editedAssignments.size} changes pending
                </Badge>
              )}
              <Button
                onClick={saveAndReturn}
                disabled={saving || assignments.length === 0}
                className="rounded-xl bg-gradient-to-r from-summit-blue to-summit-blue-light hover:from-summit-blue-light hover:to-summit-blue text-white font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Complete & Return
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}