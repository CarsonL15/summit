'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ChevronLeft, Trash2, Plus, Save, Calendar } from 'lucide-react'
import type { Database } from '@/types/supabase'

type Exercise = Database['public']['Tables']['exercises']['Row']
type Assignment = Database['public']['Tables']['exercise_assignments']['Row'] & {
  exercises: Exercise
}

export default function ReviewAssignmentsPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const assessmentId = params.assessmentId as string

  const [loading, setLoading] = useState(true)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
  const [patientName, setPatientName] = useState('')
  const [assessmentScore, setAssessmentScore] = useState(0)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')

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
    if (!confirm('Remove this exercise from the patient\'s program?')) return

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

      // Get patient ID from first assignment
      const patientId = assignments[0]?.patient_id
      if (!patientId) return

      const today = new Date()
      const endDate = new Date(today)
      endDate.setDate(endDate.getDate() + 7)

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
          assessment_id: assessmentId,
          phase: 'mobilize'
        })
        .select(`
          *,
          exercises(*)
        `)
        .single()

      if (data) {
        setAssignments(prev => [...prev, data as Assignment])
        setShowAddExercise(false)
        setSelectedCategory('') // Clear the selected category
      }
    } catch (error) {
      console.error('Error adding exercise:', error)
    }
  }

  const updateAssignment = async (assignmentId: string, field: string, value: number) => {
    try {
      const { error } = await supabase
        .from('exercise_assignments')
        .update({ [field]: value })
        .eq('id', assignmentId)

      if (error) {
        console.error('Error updating assignment:', error)
        alert(`Failed to update: ${error.message}`)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const updateProgramDuration = async (days: number) => {
    if (!days || days < 1) return

    try {
      // Calculate new end date for all assignments
      const today = new Date()
      const newEndDate = new Date(today)
      newEndDate.setDate(newEndDate.getDate() + days)

      // Update all assignments for this assessment
      const { error } = await supabase
        .from('exercise_assignments')
        .update({
          end_date: newEndDate.toISOString().split('T')[0],
          due_date: newEndDate.toISOString().split('T')[0]
        })
        .eq('assessment_id', assessmentId)

      if (error) {
        console.error('Error updating program duration:', error)
        alert(`Failed to update program duration: ${error.message}`)
      } else {
        // Refresh assignments to show new dates
        await fetchData()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const saveAndReturn = () => {
    alert(`Updated exercise program for ${patientName}. ${assignments.length} exercises assigned.`)
    router.push('/employee')
  }

  const categories = [...new Set(allExercises.map(ex => ex.category))]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exercise assignments...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/employee/assessment')}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Assessment
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Review Exercise Assignments</h1>
              <p className="text-gray-600">
                {patientName} • FMS Score: {assessmentScore}/21
              </p>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Assignment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total Exercises</p>
                <p className="text-2xl font-bold">{assignments.length}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Program Duration (days)</p>
                <input
                  type="number"
                  min="1"
                  max="30"
                  className="w-24 px-3 py-2 text-2xl font-bold border rounded"
                  defaultValue={7}
                  onChange={(e) => updateProgramDuration(parseInt(e.target.value))}
                />
              </div>
              <div>
                <p className="text-gray-600">Phase</p>
                <p className="text-2xl font-bold capitalize">Mobilize</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Exercises */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Assigned Exercises</CardTitle>
              <Button
                onClick={() => {
                  setShowAddExercise(!showAddExercise)
                  if (!showAddExercise) {
                    setSelectedCategory('') // Clear category when opening
                  }
                }}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Exercise
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Add Exercise Panel */}
            {showAddExercise && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <Label className="text-sm font-medium">Select Exercise to Add</Label>
                <div className="mt-2 space-y-2">
                  <select
                    className="w-full p-2 border rounded"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">Select Category...</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  {selectedCategory && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {allExercises
                        .filter(ex => ex.category === selectedCategory)
                        .filter(ex => !assignments.find(a => a.exercise_id === ex.id))
                        .map(exercise => (
                          <Button
                            key={exercise.id}
                            variant="outline"
                            size="sm"
                            onClick={() => addExercise(exercise.id)}
                            className="text-left justify-start"
                          >
                            {exercise.name}
                          </Button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Exercise List */}
            <div className="space-y-3">
              {assignments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No exercises assigned yet. Add exercises above.
                </p>
              ) : (
                assignments.map(assignment => (
                  <div
                    key={assignment.id}
                    className="flex items-center gap-4 p-4 bg-white border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">{assignment.exercises.name}</h4>
                      <p className="text-xs text-gray-500 mb-2">{assignment.exercises.category}</p>

                      {/* Editable Parameters */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs text-gray-600">Sets</Label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            className="w-full px-2 py-1 text-sm border rounded"
                            defaultValue={assignment.custom_sets || assignment.exercises.sets}
                            onChange={(e) => updateAssignment(assignment.id, 'custom_sets', parseInt(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">Reps</Label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            className="w-full px-2 py-1 text-sm border rounded"
                            defaultValue={assignment.custom_reps || assignment.exercises.reps}
                            onChange={(e) => updateAssignment(assignment.id, 'custom_reps', parseInt(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">Total Times</Label>
                          <input
                            type="number"
                            min="1"
                            max="14"
                            className="w-full px-2 py-1 text-sm border rounded"
                            defaultValue={assignment.total_completions_required || 7}
                            onChange={(e) => updateAssignment(assignment.id, 'total_completions_required', parseInt(e.target.value))}
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(assignment.start_date).toLocaleDateString()} -
                          {new Date(assignment.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAssignment(assignment.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.push('/employee')}
          >
            Cancel
          </Button>
          <Button
            onClick={saveAndReturn}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Complete & Return to Dashboard
          </Button>
        </div>
      </div>
    </main>
  )
}