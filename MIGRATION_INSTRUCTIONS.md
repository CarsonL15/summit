# Migration Instructions - Phase 2 Updates

**Last Updated**: October 31, 2025

## Overview
Phase 2 includes critical database updates to fix FMS scoring, enable exercise customization, and improve the weekly program system. Three migrations must be applied in order.

## Phase 2 Changes Made:

### Migration 002: Weekly Exercise Programs
- Added `start_date`, `end_date`, `daily_target`, and `assessment_id` columns to `exercise_assignments`
- Added `completion_date` column to `exercise_completions` (via trigger) for daily tracking
- Created `daily_exercise_progress` view for tracking
- Migrated existing data (set start_date = due_date - 7 days, end_date = due_date)

### Migration 003: Fix FMS Total Score
- Fixed `total_score` calculation to use LEAST() for bilateral movements
- Changed from additive (max 36) to proper FMS scoring (max 21)
- Bilateral movements now correctly take lower of left/right scores
- Added constraint ensuring total_score ≤ 21

### Migration 004: Custom Exercise Parameters
- Added `custom_sets`, `custom_reps` to `exercise_assignments`
- Added `total_completions_required` field (e.g., 7 for daily, 5 for 5 times total)
- Backfilled existing assignments with values from exercises table
- Enables per-assignment customization without changing exercise library

### Application Updates
- **FMS Assessment**: Fixed bilateral scoring, reduced to 1 exercise per category (~5-7 total)
- **Exercise Review Page**: NEW page to review/customize exercises after assessment
- **Patient Dashboard**: Shows exercises immediately with date range filtering
- **Exercise Completion**: Multiple daily completions, points only on first
- **Add Patient Flow**: Professional email-based password reset (not temp passwords)
- **Password Reset Page**: NEW page for setting initial password

## To Apply All Phase 2 Migrations:

### Step 1: Run Migration 002 (Weekly Programs)
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `/supabase/migrations/002_update_exercise_assignments.sql`
4. Click "Run" to execute the migration
5. Verify success - no errors should appear

### Step 2: Run Migration 003 (Fix FMS Scoring)
1. In the SQL Editor
2. Copy and paste the contents of `/supabase/migrations/003_fix_fms_total_score.sql`
3. Click "Run"
4. This will regenerate the `total_score` column with correct bilateral scoring
5. Existing assessments will automatically recalculate

### Step 3: Run Migration 004 (Custom Parameters)
1. In the SQL Editor
2. Copy and paste the contents of `/supabase/migrations/004_add_custom_exercise_parameters.sql`
3. Click "Run"
4. This will add new columns and backfill existing assignments
5. Check that existing assignments have `total_completions_required = 7`

### Step 4: Configure Supabase Authentication
1. Go to Authentication → URL Configuration
2. Add redirect URLs for password reset:
   - Development: `http://localhost:3001/auth/reset-password`
   - Production: `https://yourdomain.com/auth/reset-password`
3. Save changes

### Step 5: Verify All Migrations
Run these queries to verify:

**Check exercise_assignments columns:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'exercise_assignments'
AND column_name IN ('start_date', 'end_date', 'daily_target', 'assessment_id', 'custom_sets', 'custom_reps', 'total_completions_required');
```
Should return 7 rows.

**Check FMS total_score constraint:**
```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'fms_assessments'::regclass
AND conname LIKE '%total_score%';
```
Should show constraint with `total_score <= 21`.

**Check completion_date trigger:**
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'set_completion_date_trigger';
```
Should show trigger on `exercise_completions`.

### Step 6: Test Complete Phase 2 Flow

**Employee Flow:**
1. Log in as an employee
2. Click "Add New Patient" and enter email
3. Patient receives password reset email (check inbox)
4. Create FMS assessment for the patient
5. Enter scores (test bilateral movements - verify L+R shows as min value)
6. Click "Complete FMS Assessment"
7. Redirected to review page
8. Verify ~5-7 exercises assigned (not 10-14)
9. Test customizing sets/reps/total completions for an exercise
10. Test adjusting program duration (change from 7 to 10 days)
11. Test adding an exercise from a category
12. Test removing an exercise
13. Click "Complete & Return to Dashboard"

**Patient Flow:**
1. Open password reset email link
2. Set new password on reset page
3. Log in with new password
4. Verify exercises show immediately (not "check back in 7 days")
5. Click on an exercise
6. Complete the exercise
7. Verify 10 points awarded and confetti shows
8. Complete the SAME exercise again
9. Verify 0 additional points (no double-dipping)
10. Check that exercise shows as "Done Today"
11. Return to dashboard
12. Verify streak updated if it's a new day

**FMS Scoring Test:**
Test with these scores to verify max 21:
- Deep Squat: 3
- Hurdle Step: L=3, R=3 → should show as 3 (not 6)
- Inline Lunge: L=2, R=3 → should show as 2 (not 5)
- Shoulder Mobility: L=3, R=3 → should show as 3
- ASLR: L=2, R=3 → should show as 2
- Trunk Stability: 3
- Rotary Stability: L=3, R=3 → should show as 3
- **Total should be: 19 (not 33)**

## Important Notes:

### Data Migration:
- Existing exercise assignments will auto-migrate with `end_date = due_date` and `start_date = due_date - 7 days`
- The old `due_date` column is kept for backward compatibility
- Existing assignments will be backfilled with default values from exercises table
- All existing FMS assessments will recalculate their total_score automatically

### Behavior Changes:
- Points are only awarded once per exercise per day (first completion)
- Streak calculation remains the same (based on any exercise completed that day)
- FMS bilateral movements now show lower of L/R (not sum)
- Exercises appear immediately for patients (not after 7 days)
- Default program duration is 7 days but customizable

### Authentication:
- Password reset emails require redirect URL configuration in Supabase
- Temp passwords are no longer shown in alerts
- Patients set their own password via email link

## Rollback (if needed):

**⚠️ Warning**: Rollback will lose all customization data (custom_sets, custom_reps, etc.)

```sql
-- Rollback Migration 004
ALTER TABLE exercise_assignments
DROP COLUMN IF EXISTS custom_sets,
DROP COLUMN IF EXISTS custom_reps,
DROP COLUMN IF EXISTS total_completions_required;

-- Rollback Migration 003
-- Cannot easily rollback generated column change without data loss
-- You would need to recreate the old additive total_score

-- Rollback Migration 002
ALTER TABLE exercise_assignments
DROP COLUMN IF EXISTS start_date,
DROP COLUMN IF EXISTS end_date,
DROP COLUMN IF EXISTS daily_target,
DROP COLUMN IF EXISTS assessment_id;

ALTER TABLE exercise_completions
DROP COLUMN IF EXISTS completion_date;

DROP TRIGGER IF EXISTS set_completion_date_trigger ON exercise_completions;
DROP FUNCTION IF EXISTS set_completion_date();
DROP VIEW IF EXISTS daily_exercise_progress;
```

## Benefits of Phase 2:
1. ✅ Patients see exercises immediately (no 7-day wait)
2. ✅ Fewer exercises assigned (~5-7 instead of 10-14)
3. ✅ Correct FMS scoring (max 21 not 36)
4. ✅ Exercise customization per patient
5. ✅ Adjustable program duration
6. ✅ Professional patient onboarding
7. ✅ Daily tracking with proper point system
8. ✅ Better employee workflow with review page
9. ✅ Complete documentation
10. ✅ Ready for client demo

## Troubleshooting:

### "generation expression is not immutable" error
- This occurs if using DATE() function directly in generated column
- Solution: Use trigger-based approach (already implemented in migration 002)

### Exercises not showing for patient
- Check `start_date` is today or earlier
- Check `end_date` is today or later
- Verify query uses: `.lte('start_date', today).gte('end_date', today)`

### FMS total score still shows > 21
- Verify migration 003 ran successfully
- Check generated column definition uses LEAST() for bilateral
- Try recalculating by updating any score field

### Password reset email not sending
- Check Supabase Auth → URL Configuration
- Verify redirect URLs include `/auth/reset-password`
- Check email provider settings in Supabase

### Custom parameters not saving
- Verify migration 004 ran successfully
- Check columns exist: `custom_sets`, `custom_reps`, `total_completions_required`
- Check browser console for errors

---

**Migration Status**: Phase 2 Complete (Oct 31, 2025)
**Database Version**: 1.2.0
**Application Version**: 0.2.0