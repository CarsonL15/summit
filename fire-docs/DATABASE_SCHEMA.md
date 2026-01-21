# Fire FMS Database Schema

**Last Updated**: January 20, 2026
**Database**: Supabase (PostgreSQL)
**Purpose**: Schema reference for Fire Department FMS application

---

## Overview

The Fire FMS database is designed to support:
- Multi-station/department management
- FMS assessments for firefighters
- 3-week mini-series exercise programs
- Gamification with points, streaks, and achievements
- Department-wide leaderboards

---

## Tables

### 1. stations
Fire stations, police departments, and other first responder organizations.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Station name |
| department | VARCHAR(100) | NOT NULL | Department type (fire, police, swat) |
| location | TEXT | | Street address |
| city | VARCHAR(100) | | City name |
| state | VARCHAR(50) | | State name |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

### 2. users
Firefighters, chiefs, and admin users.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Full name |
| email | VARCHAR(255) | UNIQUE | Email address |
| role | VARCHAR(20) | NOT NULL, CHECK | Role (firefighter, chief, admin, clinic) |
| station_id | UUID | FOREIGN KEY | Reference to stations |
| badge_number | VARCHAR(50) | | Badge/ID number |
| points | INTEGER | DEFAULT 0 | Total points earned |
| current_streak | INTEGER | DEFAULT 0 | Current day streak |
| longest_streak | INTEGER | DEFAULT 0 | Longest streak achieved |
| last_activity_date | DATE | | Last exercise completion |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

### 3. fms_scores
FMS assessment results for users.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| user_id | UUID | FOREIGN KEY | Reference to users |
| assessed_by | UUID | FOREIGN KEY | Reference to assessor user |
| total_score | INTEGER | CHECK (0-21) | Total FMS score |
| deep_squat | INTEGER | CHECK (0-3) | Deep squat score |
| hurdle_step | INTEGER | CHECK (0-3) | Hurdle step score |
| inline_lunge | INTEGER | CHECK (0-3) | Inline lunge score |
| shoulder_mobility | INTEGER | CHECK (0-3) | Shoulder mobility score |
| aslr | INTEGER | CHECK (0-3) | Active straight leg raise |
| trunk_stability | INTEGER | CHECK (0-3) | Trunk stability push-up |
| rotary_stability | INTEGER | CHECK (0-3) | Rotary stability score |
| weak_areas | JSONB | | JSON of weak areas |
| notes | TEXT | | Assessment notes |
| assessed_date | DATE | DEFAULT CURRENT_DATE | Assessment date |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

### 4. series
3-week mini-series exercise programs.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Series name |
| description | TEXT | | Series description |
| duration_weeks | INTEGER | DEFAULT 3 | Program duration |
| target_area | VARCHAR(100) | | Target body area |
| difficulty_level | VARCHAR(20) | CHECK | beginner, intermediate, advanced |
| series_type | ENUM | DEFAULT 'strength_conditioning' | 'rehab' or 'strength_conditioning' |
| days_per_week | INTEGER | DEFAULT 3 | Days per week (7 for rehab, 3 for S&C) |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

### 5. exercises
Exercise library.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Exercise name |
| description | TEXT | | Exercise description |
| instructions | TEXT | | How to perform |
| video_url | VARCHAR(500) | | Video demonstration URL |
| thumbnail_url | VARCHAR(500) | | Thumbnail image URL |
| sets | INTEGER | DEFAULT 3 | Default sets |
| reps | INTEGER | DEFAULT 10 | Default reps |
| duration_seconds | INTEGER | | Duration if time-based |
| category | VARCHAR(100) | | Exercise category |
| equipment_needed | VARCHAR(255) | | Required equipment |
| tags | TEXT[] | DEFAULT '{}' | Array of tags for filtering |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

### 6. series_exercises
Junction table linking exercises to series with week progression.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| series_id | UUID | FOREIGN KEY | Reference to series |
| exercise_id | UUID | FOREIGN KEY | Reference to exercises |
| week_number | INTEGER | CHECK (1-4) | Week in the series |
| day_number | INTEGER | | Optional day number |
| order_in_week | INTEGER | NOT NULL | Exercise order |
| custom_sets | INTEGER | | Override default sets |
| custom_reps | INTEGER | | Override default reps |
| custom_duration | INTEGER | | Override duration |

**Unique Constraint**: (series_id, week_number, order_in_week)

### 7. series_assignments
Tracks which users are assigned which series.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| user_id | UUID | FOREIGN KEY | Reference to users |
| series_id | UUID | FOREIGN KEY | Reference to series |
| assigned_by | UUID | FOREIGN KEY | Reference to assigner |
| fms_score_id | UUID | FOREIGN KEY | Reference to FMS assessment |
| start_date | DATE | DEFAULT CURRENT_DATE | Series start date |
| end_date | DATE | | Series end date |
| current_week | INTEGER | DEFAULT 1 | Current week (1-3) |
| completed | BOOLEAN | DEFAULT FALSE | Series completed |
| completion_percentage | INTEGER | DEFAULT 0 | Progress percentage |
| points_earned | INTEGER | DEFAULT 0 | Points from this series |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

### 8. exercise_completions
Tracks individual exercise completions.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| user_id | UUID | FOREIGN KEY | Reference to users |
| exercise_id | UUID | FOREIGN KEY | Reference to exercises |
| series_assignment_id | UUID | FOREIGN KEY | Reference to series assignment |
| week_number | INTEGER | | Week number |
| completed_date | DATE | DEFAULT CURRENT_DATE | Completion date |
| completed_at | TIMESTAMP | DEFAULT NOW() | Completion timestamp |
| points_awarded | INTEGER | DEFAULT 0 | Points earned |
| notes | TEXT | | Completion notes |

### 9. achievements
Achievement definitions.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Achievement name |
| description | TEXT | | Achievement description |
| icon | VARCHAR(50) | | Emoji or icon |
| points_required | INTEGER | | Points needed |
| type | VARCHAR(50) | | Achievement type |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

### 10. user_achievements
Earned achievements per user.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| user_id | UUID | FOREIGN KEY | Reference to users |
| achievement_id | UUID | FOREIGN KEY | Reference to achievements |
| earned_at | TIMESTAMP | DEFAULT NOW() | When earned |

**Unique Constraint**: (user_id, achievement_id)

### 11. injuries
Injury tracking with FMS correlation.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| user_id | UUID | FOREIGN KEY | Reference to users |
| injury_type | VARCHAR(100) | NOT NULL | Type (strain, sprain, tear, etc.) |
| body_location | VARCHAR(100) | NOT NULL | Body area (shoulder, knee, back, etc.) |
| injury_date | DATE | NOT NULL | Date of injury |
| days_out | INTEGER | DEFAULT 0 | Days missed from work |
| return_date | DATE | | Return to duty date |
| fms_score_at_time | INTEGER | | FMS score when injured |
| followed_protocol | BOOLEAN | DEFAULT FALSE | Was following exercise protocol |
| severity | VARCHAR(20) | CHECK | minor, moderate, severe |
| cost_impact | DECIMAL(10,2) | | Estimated cost (medical + lost work) |
| status | VARCHAR(20) | DEFAULT 'active' | active or closed |
| notes | TEXT | | Injury notes |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

---

## Indexes

- `idx_users_station` on users(station_id)
- `idx_users_role` on users(role)
- `idx_users_points` on users(points DESC)
- `idx_fms_scores_user` on fms_scores(user_id)
- `idx_series_assignments_user` on series_assignments(user_id)
- `idx_series_assignments_dates` on series_assignments(start_date, end_date)
- `idx_exercise_completions_user` on exercise_completions(user_id)
- `idx_exercise_completions_date` on exercise_completions(completed_date)
- `idx_injuries_user` on injuries(user_id)
- `idx_injuries_date` on injuries(injury_date)
- `idx_injuries_fms_score` on injuries(fms_score_at_time)
- `idx_injuries_status` on injuries(status)
- `idx_series_type` on series(series_type)
- `idx_exercises_tags` on exercises USING GIN(tags)

---

## Key Business Rules

### FMS Scoring
- Maximum total score is 21 (7 movements × 3 points each)
- Bilateral movements should use the LOWER of left/right scores
- Scores ≤1 indicate areas needing corrective exercises

### Mini-Series Model
- Each series is 3 weeks long
- Week 1: Foundation/Mobility focus
- Week 2: Strength/Stability focus
- Week 3: Integration/Advanced focus
- Users progress automatically through weeks
- **Series Types**:
  - `strength_conditioning`: Standard S&C (3 days/week)
  - `rehab`: Rehabilitation focus (7 days/week)

### Injury Tracking
- Link injuries to FMS scores for correlation analysis
- Track whether injured personnel were following their exercise protocol
- Status field: `active` (currently out) or `closed` (returned to duty)
- Prevention metrics calculated from FMS correlation data

### Points System
- 10 points per exercise completion
- Points awarded only on FIRST daily completion
- Subsequent same-day completions = 0 points
- Points accumulate toward achievements

### Streaks
- Maintained by completing ANY exercise each day
- `current_streak` resets if a day is missed
- `longest_streak` tracks personal best

### Achievement Types
- **streak**: Based on consecutive days
- **points**: Based on total points earned
- **series**: Based on series completion
- **special**: Special conditions (time of day, etc.)

---

## Sample Queries

### Get Station Leaderboard
```sql
SELECT
  u.name,
  u.badge_number,
  u.points,
  u.current_streak
FROM users u
WHERE u.station_id = $1
  AND u.role = 'firefighter'
ORDER BY u.points DESC
LIMIT 10;
```

### Get User's Current Series
```sql
SELECT
  s.name,
  s.description,
  sa.current_week,
  sa.completion_percentage
FROM series_assignments sa
JOIN series s ON s.id = sa.series_id
WHERE sa.user_id = $1
  AND sa.completed = false
  AND sa.end_date >= CURRENT_DATE;
```

### Get Exercises for Current Week
```sql
SELECT
  e.name,
  e.instructions,
  se.order_in_week,
  COALESCE(se.custom_sets, e.sets) as sets,
  COALESCE(se.custom_reps, e.reps) as reps
FROM series_assignments sa
JOIN series_exercises se ON se.series_id = sa.series_id
JOIN exercises e ON e.id = se.exercise_id
WHERE sa.user_id = $1
  AND sa.completed = false
  AND se.week_number = sa.current_week
ORDER BY se.order_in_week;
```

---

## Notes

- All tables use UUID for primary keys
- Timestamps are WITH TIME ZONE
- Updated_at columns managed by triggers
- JSONB used for flexible weak_areas storage
- Check constraints enforce data integrity
- Foreign keys maintain referential integrity