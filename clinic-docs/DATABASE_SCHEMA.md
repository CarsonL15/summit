# Summit Database Schema Documentation

**Last Updated:** October 31, 2025
**Version:** 1.2.0 (Post Phase 2 Updates)

> **IMPORTANT FOR CLAUDE:**
> - Read this file FIRST when asked about database structure
> - Update this file EVERY TIME you modify the database schema
> - This is the single source of truth for the database structure

---

## Table 1: **clinics**
Stores information about chiropractic clinics in the system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique clinic identifier |
| `name` | VARCHAR(255) | NOT NULL | Clinic name |
| `address` | TEXT | NOT NULL | Physical address |
| `phone` | VARCHAR(20) | NOT NULL | Contact phone |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last update time |

---

## Table 2: **users**
Extends Supabase auth.users with role and profile information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, REFERENCES auth.users(id) | User ID from Supabase auth |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | User email address |
| `role` | VARCHAR(20) | NOT NULL, CHECK IN ('patient', 'employee', 'owner') | User role type |
| `clinic_id` | UUID | REFERENCES clinics(id) | Associated clinic |
| `first_name` | VARCHAR(100) | NOT NULL | First name |
| `last_name` | VARCHAR(100) | NOT NULL | Last name |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last update time |

---

## Table 3: **fms_assessments**
Functional Movement Screen assessment scores (7 movement patterns).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Assessment ID |
| `patient_id` | UUID | NOT NULL, REFERENCES users(id) | Patient being assessed |
| `employee_id` | UUID | NOT NULL, REFERENCES users(id) | Employee conducting assessment |
| `deep_squat` | INTEGER | NOT NULL, CHECK (0-3) | Deep squat score |
| `hurdle_step_left` | INTEGER | NOT NULL, CHECK (0-3) | Hurdle step left score |
| `hurdle_step_right` | INTEGER | NOT NULL, CHECK (0-3) | Hurdle step right score |
| `inline_lunge_left` | INTEGER | NOT NULL, CHECK (0-3) | Inline lunge left score |
| `inline_lunge_right` | INTEGER | NOT NULL, CHECK (0-3) | Inline lunge right score |
| `shoulder_mobility_left` | INTEGER | NOT NULL, CHECK (0-3) | Shoulder mobility left score |
| `shoulder_mobility_right` | INTEGER | NOT NULL, CHECK (0-3) | Shoulder mobility right score |
| `active_straight_leg_raise_left` | INTEGER | NOT NULL, CHECK (0-3) | ASLR left score |
| `active_straight_leg_raise_right` | INTEGER | NOT NULL, CHECK (0-3) | ASLR right score |
| `trunk_stability_push_up` | INTEGER | NOT NULL, CHECK (0-3) | Trunk stability score |
| `rotary_stability_left` | INTEGER | NOT NULL, CHECK (0-3) | Rotary stability left score |
| `rotary_stability_right` | INTEGER | NOT NULL, CHECK (0-3) | Rotary stability right score |
| `total_score` | INTEGER | GENERATED, CHECK (≤21) | Total FMS score (uses LEAST for bilateral) |
| `notes` | TEXT | NULLABLE | Additional assessment notes |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last update time |

**Scoring Logic:** For bilateral movements, takes LOWER of left/right scores. Max total = 21 points.

---

## Table 4: **exercises**
Library of corrective exercises (pre-seeded with 40+ exercises).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Exercise ID |
| `name` | VARCHAR(255) | NOT NULL | Exercise name |
| `category` | VARCHAR(100) | NOT NULL | FMS category (Deep Squat, Hurdle Step, etc.) |
| `description` | TEXT | NOT NULL | How to perform the exercise |
| `video_url` | VARCHAR(500) | NULLABLE | URL to video demonstration |
| `duration_seconds` | INTEGER | NOT NULL, DEFAULT 30 | Duration per set |
| `sets` | INTEGER | NOT NULL, DEFAULT 3 | Number of sets |
| `reps` | INTEGER | NOT NULL, DEFAULT 10 | Repetitions per set |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last update time |

**Categories:** Deep Squat, Hurdle Step, Inline Lunge, Shoulder Mobility, ASLR, Trunk Stability, Rotary Stability, General Mobility, Stability

---

## Table 5: **exercise_assignments**
Links patients to exercises with date ranges for weekly programs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Assignment ID |
| `patient_id` | UUID | NOT NULL, REFERENCES users(id) | Patient assigned to |
| `exercise_id` | UUID | NOT NULL, REFERENCES exercises(id) | Exercise assigned |
| `assigned_by` | UUID | NOT NULL, REFERENCES users(id) | Employee who assigned |
| `assigned_date` | DATE | NOT NULL, DEFAULT CURRENT_DATE | When exercise was assigned |
| `due_date` | DATE | NOT NULL | Legacy due date (kept for compatibility) |
| `start_date` | DATE | NOT NULL | When program starts |
| `end_date` | DATE | NOT NULL | When program ends |
| `daily_target` | INTEGER | DEFAULT 1 | How many times per day to complete |
| `custom_sets` | INTEGER | NULLABLE | Custom sets for this assignment (overrides exercise.sets) |
| `custom_reps` | INTEGER | NULLABLE | Custom reps for this assignment (overrides exercise.reps) |
| `total_completions_required` | INTEGER | DEFAULT 7 | Total completions needed before program ends |
| `assessment_id` | UUID | NULLABLE, REFERENCES fms_assessments(id) | Associated FMS assessment |
| `phase` | VARCHAR(20) | NOT NULL, CHECK IN ('analyze', 'mobilize', 'stabilize', 'optimize') | Current patient phase |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last update time |

**Note:** Uses date ranges (start_date to end_date) to show exercises immediately for 7-day programs.

---

## Table 6: **exercise_completions**
Tracks each time a patient completes an exercise (allows multiple per day).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Completion ID |
| `assignment_id` | UUID | NOT NULL, REFERENCES exercise_assignments(id) | Which assignment completed |
| `patient_id` | UUID | NOT NULL, REFERENCES users(id) | Patient who completed |
| `completed_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Exact completion timestamp |
| `completion_date` | DATE | AUTO-SET VIA TRIGGER | Date portion of completed_at |
| `notes` | TEXT | NULLABLE | Optional completion notes |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation time |

**Note:** `completion_date` is automatically set by trigger from `completed_at` to enable daily tracking.

---

## Table 7: **patient_progress**
Gamification data for patients (points, streaks, phase).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Progress record ID |
| `patient_id` | UUID | NOT NULL, UNIQUE, REFERENCES users(id) | Patient (one record per patient) |
| `phase` | VARCHAR(20) | NOT NULL, DEFAULT 'analyze', CHECK IN ('analyze', 'mobilize', 'stabilize', 'optimize') | Current phase |
| `points` | INTEGER | NOT NULL, DEFAULT 0 | Total points earned |
| `streak_days` | INTEGER | NOT NULL, DEFAULT 0 | Current consecutive day streak |
| `last_activity_date` | DATE | NULLABLE | Last day any exercise was completed |
| `total_exercises_completed` | INTEGER | NOT NULL, DEFAULT 0 | Total unique exercises completed |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last update time |

**Phases:** analyze → mobilize → stabilize → optimize (mountain climbing metaphor)

---

## Table 8: **achievements**
Badges and milestones earned by patients.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Achievement ID |
| `patient_id` | UUID | NOT NULL, REFERENCES users(id) | Patient who earned it |
| `type` | VARCHAR(50) | NOT NULL | Achievement type (milestone, streak, etc.) |
| `name` | VARCHAR(255) | NOT NULL | Achievement name |
| `description` | TEXT | NOT NULL | What was accomplished |
| `earned_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | When achievement was earned |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation time |

**Common Achievements:** First Steps, Week Warrior, Phase Completion, Perfect Week

---

## Key Business Rules

1. **FMS Scoring:** Bilateral movements take the lower of left/right scores (max 21 total)
2. **Exercise Assignment:** Scores ≤1 trigger 1 exercise per category (max ~5-7 exercises)
3. **Daily Tracking:** Patients can complete exercises multiple times per day
4. **Points System:** 10 points awarded only on FIRST daily completion per exercise
5. **Streaks:** Maintained by completing ANY exercise each day
6. **Weekly Programs:** Exercises assigned with 7-day date ranges (start_date to end_date)

---

## Total Count
- **Tables:** 8
- **Columns:** 88 (after migrations)
- **Indexes:** 10+
- **Triggers:** 7
- **Views:** 1 (daily_exercise_progress)

---

**End of Schema Documentation**