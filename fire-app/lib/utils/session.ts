// Session-based progression utilities for the 6-week, 3-stage mini-series system.
// Pure logic — no DB dependency.

export interface StageInfo {
  number: 1 | 2 | 3
  name: 'Mobilize' | 'Strengthen' | 'Integrate'
}

export interface StageExerciseMap {
  1: string[] // exercise IDs for stage 1
  2: string[] // exercise IDs for stage 2
  3: string[] // exercise IDs for stage 3
}

export interface CompletionRecord {
  exercise_id: string
  completed_date: string // YYYY-MM-DD
}

const STAGE_NAMES: Record<1 | 2 | 3, 'Mobilize' | 'Strengthen' | 'Integrate'> = {
  1: 'Mobilize',
  2: 'Strengthen',
  3: 'Integrate',
}

const SESSIONS_PER_STAGE = 4
const TOTAL_SESSIONS = 12

/**
 * Returns today's date as YYYY-MM-DD in the browser's local timezone.
 * Fixes the UTC bug where `new Date().toISOString().split('T')[0]` can
 * return tomorrow or yesterday depending on timezone offset.
 */
export function getLocalToday(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Returns the Monday on or before the given date string (YYYY-MM-DD).
 */
export function getWeekStart(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const dayOfWeek = date.getDay() // 0=Sun, 1=Mon, ...
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // days since Monday
  date.setDate(date.getDate() - diff)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Count completed sessions across all stages.
 *
 * A session is "complete" when ALL exercises for a stage have at least one
 * completion on the same date. Each such date counts as one session for that stage.
 * Total = sum across all 3 stages.
 */
export function getSessionsCompleted(
  completions: CompletionRecord[],
  stageExercises: StageExerciseMap
): number {
  let total = 0

  for (const stageNum of [1, 2, 3] as const) {
    const exerciseIds = stageExercises[stageNum]
    if (!exerciseIds || exerciseIds.length === 0) continue

    // Group completions by date for this stage's exercises
    const dateExerciseMap = new Map<string, Set<string>>()
    for (const c of completions) {
      if (exerciseIds.includes(c.exercise_id)) {
        if (!dateExerciseMap.has(c.completed_date)) {
          dateExerciseMap.set(c.completed_date, new Set())
        }
        dateExerciseMap.get(c.completed_date)!.add(c.exercise_id)
      }
    }

    // Count dates where ALL exercises for this stage were completed
    dateExerciseMap.forEach((exercises) => {
      if (exerciseIds.every((id) => exercises.has(id))) {
        total++
      }
    })
  }

  return Math.min(total, TOTAL_SESSIONS)
}

/**
 * Get the current stage based on sessions completed.
 * Sessions 1-4 = Stage 1 (Mobilize)
 * Sessions 5-8 = Stage 2 (Strengthen)
 * Sessions 9-12 = Stage 3 (Integrate)
 */
export function getCurrentStage(sessionsCompleted: number): StageInfo {
  if (sessionsCompleted < SESSIONS_PER_STAGE) {
    return { number: 1, name: STAGE_NAMES[1] }
  }
  if (sessionsCompleted < SESSIONS_PER_STAGE * 2) {
    return { number: 2, name: STAGE_NAMES[2] }
  }
  return { number: 3, name: STAGE_NAMES[3] }
}

/**
 * Get the next session number (1-12) or null if all 12 complete.
 */
export function getNextSessionNumber(sessionsCompleted: number): number | null {
  if (sessionsCompleted >= TOTAL_SESSIONS) return null
  return sessionsCompleted + 1
}

/**
 * Check if a session is unlocked. Two gates must pass:
 *
 * Gate 1: No session completed today (completedSessionToday === false)
 * Gate 2: The calendar week for this session has arrived.
 *         Session N lives in calendar week Math.ceil(N / 2).
 *         Week W starts on Monday = startDate + (W-1)*7 days.
 */
export function isSessionUnlocked(
  sessionNumber: number,
  completedSessionToday: boolean,
  startDate: string // YYYY-MM-DD (should already be a Monday)
): boolean {
  // Gate 1
  if (completedSessionToday) return false

  // Gate 2
  const calendarWeek = Math.ceil(sessionNumber / 2)
  const start = new Date(startDate + 'T00:00:00')
  const weekStart = new Date(start)
  weekStart.setDate(start.getDate() + (calendarWeek - 1) * 7)

  const today = new Date(getLocalToday() + 'T00:00:00')
  return today >= weekStart
}

/**
 * Check if a full session was completed today for the given stage.
 */
export function didCompleteSessionToday(
  completions: CompletionRecord[],
  stageExerciseIds: string[],
  today: string
): boolean {
  const todayCompletedIds = new Set(
    completions
      .filter((c) => c.completed_date === today)
      .map((c) => c.exercise_id)
  )
  return stageExerciseIds.every((id) => todayCompletedIds.has(id))
}

/**
 * Get stage name by number.
 */
export function getStageName(stageNumber: 1 | 2 | 3): string {
  return STAGE_NAMES[stageNumber]
}

/**
 * Check if the series is fully complete (12 sessions done).
 */
export function isSeriesComplete(sessionsCompleted: number): boolean {
  return sessionsCompleted >= TOTAL_SESSIONS
}

export { TOTAL_SESSIONS, SESSIONS_PER_STAGE }
