# Must Do Before Full Launch

Last updated: 2026-04-09

---

## 1. Intelligent Series Recommendation Algorithm
**Status: Broken**

The current recommendation after FMS assessment is simple substring matching — checks if weak area names (e.g., `hurdle_step`) appear in `series.name` or `series.target_area`. Most weak areas don't match anything.

**What needs to happen:**
- Build a proper mapping from FMS weak areas to series (e.g., `hurdle_step` → Hip Mobility, `aslr` → Hip Mobility, `trunk_stability` → Core Power, etc.)
- Consider recommending multiple series or a priority-ranked list
- May need new series created to cover all weak area combinations
- Discuss: should the algorithm auto-assign or just recommend for clinic to confirm?

**Files involved:**
- `app/assessor/assessment/review/[assessmentId]/page.tsx` (lines ~95-126)
- `app/clinic/assessment/review/[assessmentId]/page.tsx` (lines ~93-126)
- `lib/utils/fms.ts` — weak area calculation

---

## 2. Exercise Completion Logic (A/B Days + Weekly Progression)
**Status: Partially working, needs fixes**

**Current issues:**
- A/B day schedule is Mon/Wed/Fri/Sun = Day A, Tue/Thu/Sat = Day B — needs to be confirmed this is correct
- `current_week` in series_assignments never auto-increments — firefighters stay on week 1 forever
- `completion_percentage` only reflects today's completions, not cumulative progress through the full series
- No "all done for today" state or feedback
- Week transition logic does not exist

**What needs to happen:**
- Define the correct A/B day schedule (Mon-Thurs only? Mon-Fri?)
- Build auto week progression (when all exercises for the week are completed, advance to next week)
- Fix completion percentage to be cumulative across the full series
- Add UI feedback for daily completion state
- Discuss: what happens when someone misses a day?

**Files involved:**
- `app/firefighter/page.tsx` (lines 113-130 — A/B day logic, lines 148-152 — warm-up filter)
- `app/firefighter/exercise/[id]/page.tsx` (lines 181-270 — completion handler, lines 325-355 — progress update)
- `supabase/schema.sql` — series_exercises table structure

---

## 3. Daily Warmup/Cooldown Auto-Assignment
**Status: Not implemented**

Every firefighter needs a warmup and cooldown routine assigned automatically that they complete every day (Mon-Thurs). This is separate from their assigned corrective series.

**What needs to happen:**
- Decide database approach: special series_type? Separate table? Flag on series_assignments?
- Create the warmup/cooldown exercises and series
- Build auto-assignment logic (on account creation? Globally assigned?)
- Schedule: Mon-Thurs only
- Firefighter dashboard: separate "Warmup" and "Cooldown" sections, distinct from their corrective series
- Currently warm-up tagged exercises are explicitly FILTERED OUT of the dashboard (firefighter/page.tsx lines 148-152)

**Files involved:**
- `app/firefighter/page.tsx` — dashboard UI, exercise filtering
- `supabase/schema.sql` — may need schema changes
- New: auto-assignment logic (API route or database trigger)

---

## 4. Domain + Email Configuration
**Status: Not started**

- Buy a custom domain
- Connect domain to Vercel
- Verify domain in Resend for email sending
- Update env vars (Vercel, Supabase URL Config, .env.local)
- Set EMAIL_FROM to use new domain
- Redeploy

---

## 5. PR: Merge feat/feb24 → dev → main
**Status: Ready to merge**

feat/feb24 has all recent work (admin dashboard, assessor flow fixes, email fixes, series assignment fixes). Needs PR to dev, then dev to main.
