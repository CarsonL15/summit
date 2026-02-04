-- ========================================
-- FIRE APP: Restore Data with Correct Auth UUIDs
-- ========================================
-- This script re-inserts all demo data with your actual auth.users UUIDs
-- Run this AFTER you've deleted the tables as instructed

-- Step 1: Re-insert users with correct auth UUIDs
INSERT INTO users (id, name, email, role, station_id, badge_number, points, current_streak, longest_streak)
SELECT
  'c60c790f-5e34-4fbe-8048-ab5061ad79da'::uuid,
  'Chief Michael Johnson',
  'chief@firestation1.com',
  'chief',
  (SELECT id FROM stations WHERE name = 'Station 1'),
  'C001', 0, 0, 0
UNION ALL SELECT
  'e11738c5-9485-464f-be99-cb7b14c24d1a'::uuid,
  'Emily Davis',
  'emily@firestation1.com',
  'firefighter',
  (SELECT id FROM stations WHERE name = 'Station 1'),
  'F104', 150, 2, 5
UNION ALL SELECT
  '61ffd88a-474a-4846-856d-988e2c5db75a'::uuid,
  'John Smith',
  'john@firestation1.com',
  'firefighter',
  (SELECT id FROM stations WHERE name = 'Station 1'),
  'F101', 250, 5, 12
UNION ALL SELECT
  'a8d6fcdf-325f-4df2-b518-2ef20a22e00f'::uuid,
  'Robert Chen',
  'robert@firestation1.com',
  'firefighter',
  (SELECT id FROM stations WHERE name = 'Station 1'),
  'F103', 320, 8, 15
UNION ALL SELECT
  '9be69254-ed08-4304-9130-596b0584ff56'::uuid,
  'Sarah Williams',
  'sarah@firestation1.com',
  'firefighter',
  (SELECT id FROM stations WHERE name = 'Station 1'),
  'F102', 180, 3, 7;

-- Step 2: Insert demo FMS scores for firefighters
INSERT INTO fms_scores (user_id, assessed_by, total_score, deep_squat, hurdle_step, inline_lunge, shoulder_mobility, aslr, trunk_stability, rotary_stability, weak_areas, notes)
SELECT
  u.id,
  (SELECT id FROM users WHERE role = 'chief' LIMIT 1),
  14,
  2,
  2,
  1,
  3,
  2,
  2,
  2,
  '{"areas": ["inline_lunge", "hurdle_step", "trunk_stability"]}',
  'Needs work on single leg stability and core strength'
FROM users u WHERE u.name = 'John Smith';

INSERT INTO fms_scores (user_id, assessed_by, total_score, deep_squat, hurdle_step, inline_lunge, shoulder_mobility, aslr, trunk_stability, rotary_stability, weak_areas, notes)
SELECT
  u.id,
  (SELECT id FROM users WHERE role = 'chief' LIMIT 1),
  16,
  3,
  2,
  2,
  2,
  3,
  2,
  2,
  '{"areas": ["shoulder_mobility", "hurdle_step"]}',
  'Good overall, focus on shoulder and hip mobility'
FROM users u WHERE u.name = 'Sarah Williams';

-- Step 3: Assign series to firefighters based on their weak areas
INSERT INTO series_assignments (user_id, series_id, assigned_by, fms_score_id, start_date, end_date)
SELECT
  u.id,
  s.id,
  (SELECT id FROM users WHERE role = 'chief' LIMIT 1),
  f.id,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '21 days'
FROM users u
JOIN fms_scores f ON f.user_id = u.id
CROSS JOIN series s
WHERE u.name = 'John Smith'
AND s.name = 'Core Power Series';

INSERT INTO series_assignments (user_id, series_id, assigned_by, fms_score_id, start_date, end_date)
SELECT
  u.id,
  s.id,
  (SELECT id FROM users WHERE role = 'chief' LIMIT 1),
  f.id,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '21 days'
FROM users u
JOIN fms_scores f ON f.user_id = u.id
CROSS JOIN series s
WHERE u.name = 'Sarah Williams'
AND s.name = 'Shoulder Resilience';

-- Step 4: Give some demo achievements to users
INSERT INTO user_achievements (user_id, achievement_id)
SELECT
  u.id,
  a.id
FROM users u
CROSS JOIN achievements a
WHERE u.name = 'Robert Chen'
AND a.name IN ('First Steps', 'Week Warrior', 'Century Mark', 'Quarter K', 'Series Master');

INSERT INTO user_achievements (user_id, achievement_id)
SELECT
  u.id,
  a.id
FROM users u
CROSS JOIN achievements a
WHERE u.name = 'John Smith'
AND a.name IN ('First Steps', 'Century Mark', 'Quarter K');

-- Step 5: Add some demo exercise completions for leaderboard data
INSERT INTO exercise_completions (user_id, exercise_id, series_assignment_id, week_number, completed_date, points_awarded)
SELECT
  u.id,
  e.id,
  sa.id,
  1,
  CURRENT_DATE - INTERVAL '2 days',
  10
FROM users u
JOIN series_assignments sa ON sa.user_id = u.id
CROSS JOIN exercises e
WHERE u.name = 'John Smith'
AND e.name = 'Dead Bug'
LIMIT 1;

INSERT INTO exercise_completions (user_id, exercise_id, series_assignment_id, week_number, completed_date, points_awarded)
SELECT
  u.id,
  e.id,
  sa.id,
  1,
  CURRENT_DATE - INTERVAL '1 day',
  10
FROM users u
JOIN series_assignments sa ON sa.user_id = u.id
CROSS JOIN exercises e
WHERE u.name = 'John Smith'
AND e.name = 'Bird Dog'
LIMIT 1;

-- Step 6: Update points for users who have completions (this would normally be done by triggers)
UPDATE users
SET points = points + 20,
    current_streak = 2,
    last_activity_date = CURRENT_DATE - INTERVAL '1 day'
WHERE name = 'John Smith';

-- ========================================
-- VERIFICATION QUERY
-- ========================================
-- Run this to verify everything is correct:
SELECT
  au.email AS auth_email,
  u.email AS db_email,
  au.id AS auth_id,
  u.id AS db_id,
  CASE WHEN au.id = u.id THEN '✅ Match' ELSE '❌ Mismatch' END AS status
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
ORDER BY au.email;
