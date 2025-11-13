'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { AnimatedCard, AnimatedCardContent, AnimatedCardDescription, AnimatedCardHeader, AnimatedCardTitle } from '@/components/ui/animated-card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ProgressBar } from '@/components/ui/progress-bar'
import {
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  User,
  Activity,
  ChevronRight,
  FileText,
  Target,
  Loader2,
  Info,
  Mountain
} from 'lucide-react'

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

const movementPatterns = [
  {
    id: 'deep_squat',
    name: 'Deep Squat',
    bilateral: false,
    icon: '🏋️',
    description: 'Tests bilateral symmetry and functional mobility'
  },
  {
    id: 'hurdle_step',
    name: 'Hurdle Step',
    bilateral: true,
    icon: '🦵',
    description: 'Assesses stepping and balance'
  },
  {
    id: 'inline_lunge',
    name: 'Inline Lunge',
    bilateral: true,
    icon: '🤸',
    description: 'Tests hip and ankle mobility'
  },
  {
    id: 'shoulder_mobility',
    name: 'Shoulder Mobility',
    bilateral: true,
    icon: '💪',
    description: 'Evaluates shoulder range of motion'
  },
  {
    id: 'active_straight_leg_raise',
    name: 'Active Straight Leg Raise',
    bilateral: true,
    icon: '🦿',
    description: 'Tests hamstring flexibility'
  },
  {
    id: 'trunk_stability_push_up',
    name: 'Trunk Stability Push-Up',
    bilateral: false,
    icon: '🏃',
    description: 'Assesses core stability'
  },
  {
    id: 'rotary_stability',
    name: 'Rotary Stability',
    bilateral: true,
    icon: '🔄',
    description: 'Tests multi-plane stability'
  },
]

export default function FMSAssessmentPage() {
  const [employee, setEmployee] = useState<any>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<string>('')
  const [scores, setScores] = useState<FMSScores>(initialScores)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [success, setSuccess] = useState(false)
  const [currentSection, setCurrentSection] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
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
    } finally {
      setFetching(false)
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
    if (score === 0) return 'bg-gray-500'
    if (score === 1) return 'bg-destructive'
    if (score === 2) return 'bg-warning'
    return 'bg-success'
  }

  const getScoreLabel = (score: number) => {
    if (score === 0) return 'Unable'
    if (score === 1) return 'Poor'
    if (score === 2) return 'Moderate'
    return 'Good'
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

  const ScoreButton = ({
    score,
    currentScore,
    onClick,
    size = 'normal'
  }: {
    score: number
    currentScore: number
    onClick: () => void
    size?: 'normal' | 'large'
  }) => (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${size === 'large' ? 'w-14 h-14 text-lg' : 'w-12 h-12'} rounded-xl font-semibold transition-all shadow-sm ${
        currentScore === score
          ? `${getScoreColor(score)} text-white shadow-lg ring-2 ring-offset-2 ring-offset-background ${
              score === 0 ? 'ring-gray-500' :
              score === 1 ? 'ring-destructive' :
              score === 2 ? 'ring-warning' :
              'ring-success'
            }`
          : 'bg-muted hover:bg-muted/80'
      }`}
    >
      {score}
    </motion.button>
  )

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Mountain className="w-16 h-16 mx-auto text-summit-blue animate-pulse" />
          <h2 className="text-xl font-semibold font-display">Loading assessment...</h2>
          <div className="space-y-2 max-w-xs mx-auto">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  const selectedPatientData = patients.find(p => p.id === selectedPatient)

  return (
    <div className="min-h-screen bg-gradient-to-br from-summit-blue/5 via-background to-summit-gold/5">
      {/* Header */}
      <header className="bg-card shadow-sm border-b sticky top-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/employee')}
              className="rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              <h1 className="text-2xl font-bold font-display text-foreground flex items-center">
                <ClipboardList className="w-6 h-6 mr-2 text-summit-blue" />
                FMS Assessment
              </h1>
              <p className="text-muted-foreground">Functional Movement Screen Scoring</p>
            </motion.div>
            {selectedPatientData && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-right"
              >
                <p className="text-sm text-muted-foreground">Assessing</p>
                <p className="font-semibold font-display">
                  {selectedPatientData.first_name} {selectedPatientData.last_name}
                </p>
              </motion.div>
            )}
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
          {/* Patient Selection */}
          <motion.div variants={item}>
            <AnimatedCard delay={0.1}>
              <AnimatedCardHeader>
                <AnimatedCardTitle className="font-display flex items-center">
                  <User className="w-5 h-5 mr-2 text-summit-blue" />
                  Patient Information
                </AnimatedCardTitle>
                <AnimatedCardDescription>Select the patient for this assessment</AnimatedCardDescription>
              </AnimatedCardHeader>
              <AnimatedCardContent>
                <Label htmlFor="patient" className="text-foreground/90 font-medium mb-2 block">
                  Select Patient
                </Label>
                <select
                  id="patient"
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full p-3 border-2 rounded-xl bg-background text-foreground transition-colors focus:border-summit-blue focus:outline-none"
                >
                  <option value="">-- Select a patient --</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name} ({patient.email})
                    </option>
                  ))}
                </select>
              </AnimatedCardContent>
            </AnimatedCard>
          </motion.div>

          {/* Score Legend */}
          <motion.div variants={item}>
            <AnimatedCard delay={0.2} className="bg-gradient-to-r from-summit-blue/5 to-summit-gold/5">
              <AnimatedCardContent className="py-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-summit-blue" />
                    <span className="font-medium text-sm">Scoring Guide:</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[0, 1, 2, 3].map(score => (
                      <Badge
                        key={score}
                        className={`${getScoreColor(score)} text-white px-3 py-1 rounded-full`}
                      >
                        {score} = {getScoreLabel(score)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </AnimatedCardContent>
            </AnimatedCard>
          </motion.div>

          {/* Movement Patterns */}
          <motion.div variants={item}>
            <AnimatedCard delay={0.3}>
              <AnimatedCardHeader>
                <AnimatedCardTitle className="font-display flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-summit-blue" />
                  Movement Pattern Scoring
                </AnimatedCardTitle>
                <AnimatedCardDescription>
                  Score each movement from 0-3. Lower scores indicate areas needing correction.
                </AnimatedCardDescription>

                {/* Progress Bar */}
                <div className="mt-4">
                  <ProgressBar
                    value={calculateTotalScore()}
                    max={21}
                    color="primary"
                    showLabel
                    size="lg"
                    animated
                  />
                </div>
              </AnimatedCardHeader>

              <AnimatedCardContent>
                <motion.div
                  className="space-y-6"
                  variants={container}
                  initial="hidden"
                  animate="show"
                >
                  {movementPatterns.map((pattern, index) => (
                    <motion.div
                      key={pattern.id}
                      variants={item}
                      className="p-4 bg-muted/30 rounded-xl border-2 border-transparent hover:border-summit-blue/20 transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <Label className="text-lg font-semibold font-display flex items-center gap-2">
                              <span className="text-2xl">{pattern.icon}</span>
                              {index + 1}. {pattern.name}
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">{pattern.description}</p>
                          </div>
                        </div>

                        {!pattern.bilateral ? (
                          // Single scoring
                          <div className="flex gap-2">
                            {[0, 1, 2, 3].map(score => (
                              <ScoreButton
                                key={score}
                                score={score}
                                currentScore={scores[pattern.id as keyof FMSScores] as number}
                                onClick={() => handleScoreChange(pattern.id as keyof FMSScores, score)}
                                size="large"
                              />
                            ))}
                          </div>
                        ) : (
                          // Bilateral scoring
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium flex items-center gap-2">
                                <ChevronRight className="w-4 h-4 text-summit-blue" />
                                Left Side
                              </Label>
                              <div className="flex gap-2">
                                {[0, 1, 2, 3].map(score => (
                                  <ScoreButton
                                    key={score}
                                    score={score}
                                    currentScore={scores[`${pattern.id}_left` as keyof FMSScores] as number}
                                    onClick={() => handleScoreChange(`${pattern.id}_left` as keyof FMSScores, score)}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium flex items-center gap-2">
                                <ChevronRight className="w-4 h-4 text-summit-blue" />
                                Right Side
                              </Label>
                              <div className="flex gap-2">
                                {[0, 1, 2, 3].map(score => (
                                  <ScoreButton
                                    key={score}
                                    score={score}
                                    currentScore={scores[`${pattern.id}_right` as keyof FMSScores] as number}
                                    onClick={() => handleScoreChange(`${pattern.id}_right` as keyof FMSScores, score)}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatedCardContent>
            </AnimatedCard>
          </motion.div>

          {/* Notes and Summary */}
          <motion.div variants={item}>
            <AnimatedCard delay={0.4}>
              <AnimatedCardHeader>
                <AnimatedCardTitle className="font-display flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-summit-blue" />
                  Assessment Summary
                </AnimatedCardTitle>
              </AnimatedCardHeader>
              <AnimatedCardContent className="space-y-4">
                <div>
                  <Label htmlFor="notes" className="text-foreground/90 font-medium mb-2 block">
                    Notes (Optional)
                  </Label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 border-2 rounded-xl bg-background text-foreground transition-colors focus:border-summit-blue focus:outline-none resize-none"
                    rows={3}
                    placeholder="Additional observations or notes..."
                  />
                </div>

                <motion.div
                  className="bg-gradient-to-r from-summit-blue/10 to-summit-gold/10 p-6 rounded-xl"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold font-display flex items-center gap-2">
                      <Target className="w-5 h-5 text-summit-blue" />
                      Total FMS Score:
                    </span>
                    <motion.span
                      className="text-3xl font-bold font-display"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.6 }}
                    >
                      {calculateTotalScore()} / 21
                    </motion.span>
                  </div>

                  {calculateTotalScore() > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="space-y-2"
                    >
                      {calculateTotalScore() <= 10 && (
                        <Badge className="bg-destructive text-white rounded-full px-3 py-1">
                          High Priority for Corrective Exercise
                        </Badge>
                      )}
                      {calculateTotalScore() > 10 && calculateTotalScore() <= 14 && (
                        <Badge className="bg-warning text-white rounded-full px-3 py-1">
                          Moderate Dysfunction
                        </Badge>
                      )}
                      {calculateTotalScore() > 14 && (
                        <Badge className="bg-success text-white rounded-full px-3 py-1">
                          Good Movement Quality
                        </Badge>
                      )}
                    </motion.div>
                  )}
                </motion.div>

                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-2 p-4 bg-success/10 text-success border border-success/30 rounded-xl"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Assessment saved successfully! Redirecting...
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !selectedPatient || calculateTotalScore() === 0}
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-summit-blue to-summit-blue-light hover:from-summit-blue-light hover:to-summit-blue text-white font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Saving Assessment...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        Save Assessment & Assign Exercises
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/employee')}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                </div>
              </AnimatedCardContent>
            </AnimatedCard>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}