// FMS Risk Assessment Utilities
// Centralized logic for risk level calculations

export type RiskLevel = 'high' | 'moderate' | 'low'

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
 * Risk level thresholds for filtering
 */
export const RISK_THRESHOLDS = {
  high: { min: 0, max: 14 },      // 0-14 = High Risk
  moderate: { min: 15, max: 17 }, // 15-17 = Moderate
  low: { min: 18, max: 21 }       // 18-21 = Low Risk
}
