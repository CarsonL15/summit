// FMS Risk Assessment Utilities
// Centralized logic for risk level calculations and score computation

export type RiskLevel = 'high' | 'moderate' | 'low'

// --- Raw score types (as entered by assessor, 1-3) ---

export interface FMSRawScores {
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

export interface FMSPainFlags {
  deep_squat_pain_left: boolean
  deep_squat_pain_right: boolean
  hurdle_step_pain_left: boolean
  hurdle_step_pain_right: boolean
  inline_lunge_pain_left: boolean
  inline_lunge_pain_right: boolean
  shoulder_mobility_pain_left: boolean
  shoulder_mobility_pain_right: boolean
  aslr_pain_left: boolean
  aslr_pain_right: boolean
  trunk_stability_pain_left: boolean
  trunk_stability_pain_right: boolean
  rotary_stability_pain_left: boolean
  rotary_stability_pain_right: boolean
  [key: string]: boolean
}

export interface FMSClearingFlags {
  clearing_ankle: boolean
  clearing_shoulder: boolean
  clearing_extension: boolean
  clearing_flexion: boolean
  [key: string]: boolean
}

// Per-pattern FMS scores (after pain/clearing/min applied)
export interface FMSPatternScores {
  deep_squat: number
  hurdle_step: number
  inline_lunge: number
  shoulder_mobility: number
  aslr: number
  trunk_stability: number
  rotary_stability: number
}

// Default initial values
export const DEFAULT_SCORES: FMSRawScores = {
  deep_squat: 1,
  hurdle_step_left: 1,
  hurdle_step_right: 1,
  inline_lunge_left: 1,
  inline_lunge_right: 1,
  shoulder_mobility_left: 1,
  shoulder_mobility_right: 1,
  aslr_left: 1,
  aslr_right: 1,
  trunk_stability: 1,
  rotary_stability_left: 1,
  rotary_stability_right: 1,
}

export const DEFAULT_PAIN: FMSPainFlags = {
  deep_squat_pain_left: false,
  deep_squat_pain_right: false,
  hurdle_step_pain_left: false,
  hurdle_step_pain_right: false,
  inline_lunge_pain_left: false,
  inline_lunge_pain_right: false,
  shoulder_mobility_pain_left: false,
  shoulder_mobility_pain_right: false,
  aslr_pain_left: false,
  aslr_pain_right: false,
  trunk_stability_pain_left: false,
  trunk_stability_pain_right: false,
  rotary_stability_pain_left: false,
  rotary_stability_pain_right: false,
}

export const DEFAULT_CLEARING: FMSClearingFlags = {
  clearing_ankle: true,
  clearing_shoulder: true,
  clearing_extension: true,
  clearing_flexion: true,
}

// --- Mobility Score Calculations (raw scores, no pain/clearing applied) ---

/**
 * Left Mobility Score: sum of all raw left-side scores.
 * Non-bilateral movements (deep squat, trunk stability) count toward both sides.
 */
export function calculateLeftMobilityScore(scores: FMSRawScores): number {
  return (
    scores.deep_squat +
    scores.hurdle_step_left +
    scores.inline_lunge_left +
    scores.shoulder_mobility_left +
    scores.aslr_left +
    scores.trunk_stability +
    scores.rotary_stability_left
  )
}

/**
 * Right Mobility Score: sum of all raw right-side scores.
 * Non-bilateral movements (deep squat, trunk stability) count toward both sides.
 */
export function calculateRightMobilityScore(scores: FMSRawScores): number {
  return (
    scores.deep_squat +
    scores.hurdle_step_right +
    scores.inline_lunge_right +
    scores.shoulder_mobility_right +
    scores.aslr_right +
    scores.trunk_stability +
    scores.rotary_stability_right
  )
}

// --- FMS Score Calculation (functional score with pain/clearing zeroing) ---

/**
 * Calculate FMS per-pattern scores and total.
 *
 * For each pattern:
 * 1. Bilateral: take Math.min(left, right). Non-bilateral: take raw score.
 * 2. If pain on EITHER side → 0
 * 3. If corresponding clearing test fails → 0
 *
 * Clearing test mapping:
 * - clearing_ankle → inline_lunge
 * - clearing_shoulder → shoulder_mobility
 * - clearing_extension → trunk_stability
 * - clearing_flexion → rotary_stability
 */
export function calculateFMSScore(
  scores: FMSRawScores,
  pain: FMSPainFlags,
  clearing: FMSClearingFlags
): { total: number; perPattern: FMSPatternScores } {
  const perPattern: FMSPatternScores = {
    deep_squat: 0,
    hurdle_step: 0,
    inline_lunge: 0,
    shoulder_mobility: 0,
    aslr: 0,
    trunk_stability: 0,
    rotary_stability: 0,
  }

  // Deep Squat (non-bilateral, no clearing test)
  perPattern.deep_squat = (pain.deep_squat_pain_left || pain.deep_squat_pain_right)
    ? 0 : scores.deep_squat

  // Hurdle Step (bilateral, no clearing test)
  perPattern.hurdle_step = (pain.hurdle_step_pain_left || pain.hurdle_step_pain_right)
    ? 0 : Math.min(scores.hurdle_step_left, scores.hurdle_step_right)

  // Inline Lunge (bilateral, ankle clearing)
  perPattern.inline_lunge = (pain.inline_lunge_pain_left || pain.inline_lunge_pain_right || !clearing.clearing_ankle)
    ? 0 : Math.min(scores.inline_lunge_left, scores.inline_lunge_right)

  // Shoulder Mobility (bilateral, shoulder clearing)
  perPattern.shoulder_mobility = (pain.shoulder_mobility_pain_left || pain.shoulder_mobility_pain_right || !clearing.clearing_shoulder)
    ? 0 : Math.min(scores.shoulder_mobility_left, scores.shoulder_mobility_right)

  // ASLR (bilateral, no clearing test)
  perPattern.aslr = (pain.aslr_pain_left || pain.aslr_pain_right)
    ? 0 : Math.min(scores.aslr_left, scores.aslr_right)

  // Trunk Stability (non-bilateral, extension clearing)
  perPattern.trunk_stability = (pain.trunk_stability_pain_left || pain.trunk_stability_pain_right || !clearing.clearing_extension)
    ? 0 : scores.trunk_stability

  // Rotary Stability (bilateral, flexion clearing)
  perPattern.rotary_stability = (pain.rotary_stability_pain_left || pain.rotary_stability_pain_right || !clearing.clearing_flexion)
    ? 0 : Math.min(scores.rotary_stability_left, scores.rotary_stability_right)

  const total = Object.values(perPattern).reduce((sum, val) => sum + val, 0)

  return { total, perPattern }
}

/**
 * Identify weak areas from FMS per-pattern scores.
 * A pattern is "weak" if its FMS score is <= 1 (includes 0 from pain/clearing).
 */
export function calculateWeakAreas(perPattern: FMSPatternScores): string[] {
  const areas: string[] = []
  if (perPattern.deep_squat <= 1) areas.push('deep_squat')
  if (perPattern.hurdle_step <= 1) areas.push('hurdle_step')
  if (perPattern.inline_lunge <= 1) areas.push('inline_lunge')
  if (perPattern.shoulder_mobility <= 1) areas.push('shoulder_mobility')
  if (perPattern.aslr <= 1) areas.push('aslr')
  if (perPattern.trunk_stability <= 1) areas.push('trunk_stability')
  if (perPattern.rotary_stability <= 1) areas.push('rotary_stability')
  return areas
}

// --- Assessment Page Configuration ---

export interface AssessmentPageConfig {
  name: string
  description: string
  bilateral: boolean
  scoreKey?: string          // for non-bilateral (single score)
  leftScoreKey?: string      // for bilateral
  rightScoreKey?: string     // for bilateral
  painLeftKey: string
  painRightKey: string
  clearingTest?: {
    key: string
    label: string
    warningText: string
  }
}

export const ASSESSMENT_PAGES: AssessmentPageConfig[] = [
  {
    name: 'Overhead Squat',
    description: 'Tests bilateral, symmetrical, functional mobility of the hips, knees, and ankles',
    bilateral: false,
    scoreKey: 'deep_squat',
    painLeftKey: 'deep_squat_pain_left',
    painRightKey: 'deep_squat_pain_right',
  },
  {
    name: 'Hurdle Step',
    description: "Challenges body's stride mechanics during stepping",
    bilateral: true,
    leftScoreKey: 'hurdle_step_left',
    rightScoreKey: 'hurdle_step_right',
    painLeftKey: 'hurdle_step_pain_left',
    painRightKey: 'hurdle_step_pain_right',
  },
  {
    name: 'Inline Lunge',
    description: 'Tests hip and ankle mobility and stability, quadriceps flexibility, and knee stability',
    bilateral: true,
    leftScoreKey: 'inline_lunge_left',
    rightScoreKey: 'inline_lunge_right',
    painLeftKey: 'inline_lunge_pain_left',
    painRightKey: 'inline_lunge_pain_right',
    clearingTest: {
      key: 'clearing_ankle',
      label: 'Ankle Clearing',
      warningText: 'Failing this will set the Inline Lunge FMS score to 0',
    },
  },
  {
    name: 'Shoulder Mobility',
    description: 'Assesses bilateral shoulder range of motion',
    bilateral: true,
    leftScoreKey: 'shoulder_mobility_left',
    rightScoreKey: 'shoulder_mobility_right',
    painLeftKey: 'shoulder_mobility_pain_left',
    painRightKey: 'shoulder_mobility_pain_right',
    clearingTest: {
      key: 'clearing_shoulder',
      label: 'Shoulder Clearing',
      warningText: 'Failing this will set the Shoulder Mobility FMS score to 0',
    },
  },
  {
    name: 'Active Straight Leg Raise',
    description: 'Tests active hamstring and gastroc-soleus flexibility',
    bilateral: true,
    leftScoreKey: 'aslr_left',
    rightScoreKey: 'aslr_right',
    painLeftKey: 'aslr_pain_left',
    painRightKey: 'aslr_pain_right',
  },
  {
    name: 'Trunk Stability Push-Up',
    description: 'Tests trunk stability in the sagittal plane during upper body movement',
    bilateral: false,
    scoreKey: 'trunk_stability',
    painLeftKey: 'trunk_stability_pain_left',
    painRightKey: 'trunk_stability_pain_right',
    clearingTest: {
      key: 'clearing_extension',
      label: 'Extension Clearing',
      warningText: 'Failing this will set the Trunk Stability FMS score to 0',
    },
  },
  {
    name: 'Rotary Stability',
    description: 'Tests multi-planar trunk stability during upper/lower body movement',
    bilateral: true,
    leftScoreKey: 'rotary_stability_left',
    rightScoreKey: 'rotary_stability_right',
    painLeftKey: 'rotary_stability_pain_left',
    painRightKey: 'rotary_stability_pain_right',
    clearingTest: {
      key: 'clearing_flexion',
      label: 'Flexion Clearing',
      warningText: 'Failing this will set the Rotary Stability FMS score to 0',
    },
  },
]

// --- Risk Level Utilities (unchanged, still based on FMS score) ---

/**
 * Get risk level based on FMS score
 * High: < 15
 * Moderate: 15-17
 * Low: 18-21
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score < 15) return 'high'
  if (score <= 17) return 'moderate'
  return 'low'
}

/**
 * Get display label for risk level
 */
export function getRiskLabel(score: number): string {
  const level = getRiskLevel(score)
  switch (level) {
    case 'high': return 'High Risk'
    case 'moderate': return 'Moderate'
    case 'low': return 'Low Risk'
  }
}

/**
 * Get Tailwind text color class for risk level
 */
export function getRiskTextColor(score: number): string {
  const level = getRiskLevel(score)
  switch (level) {
    case 'high': return 'text-red-400'
    case 'moderate': return 'text-yellow-400'
    case 'low': return 'text-green-400'
  }
}

/**
 * Get Tailwind background color classes for badges
 */
export function getRiskBadgeClasses(score: number): string {
  const level = getRiskLevel(score)
  switch (level) {
    case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30'
    case 'moderate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30'
  }
}

/**
 * Get Tailwind classes for stat cards (background + border)
 */
export function getRiskCardClasses(score: number): string {
  const level = getRiskLevel(score)
  switch (level) {
    case 'high': return 'bg-red-500/10 border-red-500/30'
    case 'moderate': return 'bg-yellow-500/10 border-yellow-500/30'
    case 'low': return 'bg-green-500/10 border-green-500/30'
  }
}

/**
 * Get Tailwind icon color class for risk level
 */
export function getRiskIconColor(score: number): string {
  const level = getRiskLevel(score)
  switch (level) {
    case 'high': return 'text-red-400'
    case 'moderate': return 'text-yellow-400'
    case 'low': return 'text-green-400'
  }
}

/**
 * Risk level thresholds for filtering
 */
export const RISK_THRESHOLDS = {
  high: { min: 0, max: 14 },      // 0-14 = High Risk
  moderate: { min: 15, max: 17 }, // 15-17 = Moderate
  low: { min: 18, max: 21 }       // 18-21 = Low Risk
}
