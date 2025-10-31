'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, AlertCircle, CheckCircle } from 'lucide-react'

interface Patient {
  id: string
  first_name: string
  last_name: string
  email: string
}

interface FMSScores {
  deep_squat: number
  hurdle_step_left: number
  hurdle_step_right: number
  inline_lunge_left: number
  inline_lunge_right: number
  shoulder_mobility_left: number
  shoulder_mobility_right: number
  active_straight_leg_raise_left: number
  active_straight_leg_raise_right: number
  trunk_stability_push_up: number
  rotary_stability_left: number
  rotary_stability_right: number
}

const initialScores: FMSScores = {
  deep_squat: 0,
  hurdle_step_left: 0,
  hurdle_step_right: 0,
  inline_lunge_left: 0,
  inline_lunge_right: 0,
  shoulder_mobility_left: 0,
  shoulder_mobility_right: 0,
  active_straight_leg_raise_left: 0,
  active_straight_leg_raise_right: 0,
  trunk_stability_push_up: 0,
  rotary_stability_left: 0,
  rotary_stability_right: 0,
}

export default function FMSAssessmentPage() {
  const [employee, setEmployee] = useState<any>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<string>('')
  const [scores, setScores] = useState<FMSScores>(initialScores)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Get employee data
    const { data: employeeData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (employeeData?.role !== 'employee' && employeeData?.role !== 'owner') {
      router.push('/patient')
      return
    }

    setEmployee(employeeData)

    // Get patients in the same clinic
    const { data: patientsData } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('clinic_id', employeeData.clinic_id)
      .eq('role', 'patient')

    if (patientsData) {
      setPatients(patientsData)
    }
  }

  const calculateTotalScore = () => {
    // For bilateral movements, take the lower of the two scores
    const deepSquat = scores.deep_squat
    const hurdleStep = Math.min(scores.hurdle_step_left, scores.hurdle_step_right)
    const inlineLunge = Math.min(scores.inline_lunge_left, scores.inline_lunge_right)
    const shoulderMobility = Math.min(scores.shoulder_mobility_left, scores.shoulder_mobility_right)
    const activeStraightLegRaise = Math.min(scores.active_straight_leg_raise_left, scores.active_straight_leg_raise_right)
    const trunkStability = scores.trunk_stability_push_up
    const rotaryStability = Math.min(scores.rotary_stability_left, scores.rotary_stability_right)

    // Total score is sum of all 7 movement patterns (max 21)
    return deepSquat + hurdleStep + inlineLunge + shoulderMobility +
           activeStraightLegRaise + trunkStability + rotaryStability
  }

  const getScoreColor = (score: number) => {
    if (score === 0) return 'bg-gray-100 text-gray-600'
    if (score === 1) return 'bg-red-100 text-red-700'
    if (score === 2) return 'bg-yellow-100 text-yellow-700'
    return 'bg-green-100 text-green-700'
  }

  const handleScoreChange = (movement: keyof FMSScores, score: number) => {
    setScores(prev => ({ ...prev, [movement]: score }))
  }

  const assignExercisesBasedOnScores = async (patientId: string, assessmentScores: FMSScores, assessmentId: string) => {
    // Get all exercises
    const { data: exercises } = await supabase
      .from('exercises')
      .select('*')

    if (!exercises) return

    const exercisesToAssign = []
    const today = new Date()
    const startDate = new Date(today)
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + 7) // 7-day program

    // Calculate effective scores for each movement pattern (taking lower of bilateral)
    const movementScores = {
      'Deep Squat': assessmentScores.deep_squat,
      'Hurdle Step': Math.min(assessmentScores.hurdle_step_left, assessmentScores.hurdle_step_right),
      'Inline Lunge': Math.min(assessmentScores.inline_lunge_left, assessmentScores.inline_lunge_right),
      'Shoulder Mobility': Math.min(assessmentScores.shoulder_mobility_left, assessmentScores.shoulder_mobility_right),
      'ASLR': Math.min(assessmentScores.active_straight_leg_raise_left, assessmentScores.active_straight_leg_raise_right),
      'Trunk Stability': assessmentScores.trunk_stability_push_up,
      'Rotary Stability': Math.min(assessmentScores.rotary_stability_left, assessmentScores.rotary_stability_right),
    }

    // Check each movement pattern
    for (const [category, score] of Object.entries(movementScores)) {
      if (score <= 1) { // Needs corrective exercises
        // Get exercises for this category
        const categoryExercises = exercises.filter(ex => ex.category === category)

        // Add only 1 exercise per category to reduce total count
        categoryExercises.slice(0, 1).forEach(exercise => {
          exercisesToAssign.push({
            patient_id: patientId,
            exercise_id: exercise.id,
            assigned_by: employee.id,
            assigned_date: today.toISOString().split('T')[0],
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            due_date: endDate.toISOString().split('T')[0], // Keep for backward compatibility
            daily_target: 1, // One completion per day
            custom_sets: exercise.sets, // Initialize with exercise defaults
            custom_reps: exercise.reps, // Initialize with exercise defaults
            total_completions_required: 7, // Default to daily over 7 days
            assessment_id: assessmentId,
            phase: 'mobilize', // Start with mobilize phase for corrective work
          })
        })
      }
    }

    // Insert all exercise assignments
    if (exercisesToAssign.length > 0) {
      await supabase
        .from('exercise_assignments')
        .insert(exercisesToAssign)
    }

    return { count: exercisesToAssign.length, assessmentId }
  }

  const handleSubmit = async () => {
    if (!selectedPatient) {
      alert('Please select a patient')
      return
    }

    setLoading(true)
    setSuccess(false)

    try {
      // Save FMS assessment
      const { data: assessment, error } = await supabase
        .from('fms_assessments')
        .insert({
          patient_id: selectedPatient,
          employee_id: employee.id,
          ...scores,
          notes: notes || null,
        })
        .select()
        .single()

      if (error) {
        console.error('Assessment error:', error)
        alert(`Failed to save assessment: ${error.message}`)
        return
      }

      // Automatically assign exercises based on scores
      const result = await assignExercisesBasedOnScores(selectedPatient, scores, assessment.id)

      // Update patient phase to 'mobilize' if they were in 'analyze'
      await supabase
        .from('patient_progress')
        .update({ phase: 'mobilize' })
        .eq('patient_id', selectedPatient)
        .eq('phase', 'analyze')

      setSuccess(true)

      // Show success and redirect to review page
      setTimeout(() => {
        alert(`Assessment saved! ${result?.count || 0} exercises assigned. Redirecting to review...`)
        router.push(`/employee/assessment/review/${assessment.id}`)
      }, 1500)

    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred while saving the assessment')
    } finally {
      setLoading(false)
    }
  }

  const ScoreButton = ({ score, currentScore, onClick }: { score: number; currentScore: number; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-10 h-10 rounded-md font-semibold transition-all ${
        currentScore === score
          ? score === 0 ? 'bg-gray-500 text-white'
          : score === 1 ? 'bg-red-500 text-white'
          : score === 2 ? 'bg-yellow-500 text-white'
          : 'bg-green-500 text-white'
          : 'bg-gray-100 hover:bg-gray-200'
      }`}
    >
      {score}
    </button>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/employee')}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">FMS Assessment</h1>
              <p className="text-gray-600">Functional Movement Screen Scoring</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Patient Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
            <CardDescription>Select the patient for this assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="patient">Select Patient</Label>
            <select
              id="patient"
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md"
            >
              <option value="">-- Select a patient --</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name} ({patient.email})
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* Movement Patterns */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Movement Pattern Scoring</CardTitle>
            <CardDescription>
              Score each movement from 0-3. Lower scores indicate areas needing correction.
            </CardDescription>
            <div className="flex gap-2 mt-2">
              <Badge className="bg-gray-500 text-white">0 = Unable</Badge>
              <Badge className="bg-red-500 text-white">1 = Poor</Badge>
              <Badge className="bg-yellow-500 text-white">2 = Moderate</Badge>
              <Badge className="bg-green-500 text-white">3 = Good</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Deep Squat */}
              <div>
                <Label className="text-base font-semibold mb-2 block">1. Deep Squat</Label>
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map(score => (
                    <ScoreButton
                      key={score}
                      score={score}
                      currentScore={scores.deep_squat}
                      onClick={() => handleScoreChange('deep_squat', score)}
                    />
                  ))}
                </div>
              </div>

              {/* Hurdle Step */}
              <div>
                <Label className="text-base font-semibold mb-2 block">2. Hurdle Step</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm mb-1 block">Left</Label>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3].map(score => (
                        <ScoreButton
                          key={score}
                          score={score}
                          currentScore={scores.hurdle_step_left}
                          onClick={() => handleScoreChange('hurdle_step_left', score)}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm mb-1 block">Right</Label>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3].map(score => (
                        <ScoreButton
                          key={score}
                          score={score}
                          currentScore={scores.hurdle_step_right}
                          onClick={() => handleScoreChange('hurdle_step_right', score)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Inline Lunge */}
              <div>
                <Label className="text-base font-semibold mb-2 block">3. Inline Lunge</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm mb-1 block">Left</Label>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3].map(score => (
                        <ScoreButton
                          key={score}
                          score={score}
                          currentScore={scores.inline_lunge_left}
                          onClick={() => handleScoreChange('inline_lunge_left', score)}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm mb-1 block">Right</Label>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3].map(score => (
                        <ScoreButton
                          key={score}
                          score={score}
                          currentScore={scores.inline_lunge_right}
                          onClick={() => handleScoreChange('inline_lunge_right', score)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Shoulder Mobility */}
              <div>
                <Label className="text-base font-semibold mb-2 block">4. Shoulder Mobility</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm mb-1 block">Left</Label>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3].map(score => (
                        <ScoreButton
                          key={score}
                          score={score}
                          currentScore={scores.shoulder_mobility_left}
                          onClick={() => handleScoreChange('shoulder_mobility_left', score)}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm mb-1 block">Right</Label>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3].map(score => (
                        <ScoreButton
                          key={score}
                          score={score}
                          currentScore={scores.shoulder_mobility_right}
                          onClick={() => handleScoreChange('shoulder_mobility_right', score)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Straight Leg Raise */}
              <div>
                <Label className="text-base font-semibold mb-2 block">5. Active Straight Leg Raise</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm mb-1 block">Left</Label>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3].map(score => (
                        <ScoreButton
                          key={score}
                          score={score}
                          currentScore={scores.active_straight_leg_raise_left}
                          onClick={() => handleScoreChange('active_straight_leg_raise_left', score)}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm mb-1 block">Right</Label>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3].map(score => (
                        <ScoreButton
                          key={score}
                          score={score}
                          currentScore={scores.active_straight_leg_raise_right}
                          onClick={() => handleScoreChange('active_straight_leg_raise_right', score)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Trunk Stability Push-Up */}
              <div>
                <Label className="text-base font-semibold mb-2 block">6. Trunk Stability Push-Up</Label>
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map(score => (
                    <ScoreButton
                      key={score}
                      score={score}
                      currentScore={scores.trunk_stability_push_up}
                      onClick={() => handleScoreChange('trunk_stability_push_up', score)}
                    />
                  ))}
                </div>
              </div>

              {/* Rotary Stability */}
              <div>
                <Label className="text-base font-semibold mb-2 block">7. Rotary Stability</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm mb-1 block">Left</Label>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3].map(score => (
                        <ScoreButton
                          key={score}
                          score={score}
                          currentScore={scores.rotary_stability_left}
                          onClick={() => handleScoreChange('rotary_stability_left', score)}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm mb-1 block">Right</Label>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3].map(score => (
                        <ScoreButton
                          key={score}
                          score={score}
                          currentScore={scores.rotary_stability_right}
                          onClick={() => handleScoreChange('rotary_stability_right', score)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes and Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Assessment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
                rows={3}
                placeholder="Additional observations or notes..."
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total FMS Score:</span>
                <span className="text-2xl font-bold">{calculateTotalScore()} / 21</span>
              </div>
              {calculateTotalScore() > 0 && (
                <div className="mt-2">
                  {calculateTotalScore() <= 10 && (
                    <Badge className="bg-red-500 text-white">High Priority for Corrective Exercise</Badge>
                  )}
                  {calculateTotalScore() > 10 && calculateTotalScore() <= 14 && (
                    <Badge className="bg-yellow-500 text-white">Moderate Dysfunction</Badge>
                  )}
                  {calculateTotalScore() > 14 && (
                    <Badge className="bg-green-500 text-white">Good Movement Quality</Badge>
                  )}
                </div>
              )}
            </div>

            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-md">
                <CheckCircle className="w-5 h-5" />
                Assessment saved successfully!
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleSubmit}
                disabled={loading || !selectedPatient || calculateTotalScore() === 0}
                className="flex-1"
              >
                {loading ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Assessment & Assign Exercises
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/employee')}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}