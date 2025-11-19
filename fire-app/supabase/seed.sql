-- Fire FMS Seed Data
-- Demo data for fire departments, exercises, and mini-series programs

-- Insert demo fire station
INSERT INTO stations (name, department, location, city, state) VALUES
('Station 1', 'fire', '123 Main Street', 'Denver', 'Colorado'),
('Station 2', 'fire', '456 Oak Avenue', 'Denver', 'Colorado'),
('Central Police', 'police', '789 Center Blvd', 'Denver', 'Colorado');

-- Insert demo users (firefighters, chiefs, etc)
-- Password for all demo users: demo123
INSERT INTO users (name, email, role, station_id, badge_number, points, current_streak, longest_streak)
SELECT
  'Chief Michael Johnson',
  'chief@firestation1.com',
  'chief',
  (SELECT id FROM stations WHERE name = 'Station 1'),
  'C001',
  0,
  0,
  0
UNION ALL SELECT
  'John Smith',
  'john@firestation1.com',
  'firefighter',
  (SELECT id FROM stations WHERE name = 'Station 1'),
  'F101',
  250,
  5,
  12
UNION ALL SELECT
  'Sarah Williams',
  'sarah@firestation1.com',
  'firefighter',
  (SELECT id FROM stations WHERE name = 'Station 1'),
  'F102',
  180,
  3,
  7
UNION ALL SELECT
  'Robert Chen',
  'robert@firestation1.com',
  'firefighter',
  (SELECT id FROM stations WHERE name = 'Station 1'),
  'F103',
  320,
  8,
  15
UNION ALL SELECT
  'Emily Davis',
  'emily@firestation1.com',
  'firefighter',
  (SELECT id FROM stations WHERE name = 'Station 1'),
  'F104',
  150,
  2,
  5;

-- Insert exercises for fire departments
-- Focus on functional movements for firefighters
INSERT INTO exercises (name, description, instructions, sets, reps, duration_seconds, category, equipment_needed) VALUES
-- Mobility Exercises
('Hip Flexor Stretch', 'Improves hip mobility for ladder climbing and gear movement', 'Kneel on one knee, push hips forward while keeping back straight. Hold for 30 seconds each side.', 2, NULL, 30, 'mobility', 'None'),
('Thoracic Spine Rotation', 'Enhances upper back mobility for hose handling', 'On hands and knees, place one hand behind head, rotate upper body to ceiling. 10 reps each side.', 3, 10, NULL, 'mobility', 'None'),
('Ankle Mobility Circles', 'Improves ankle flexibility for ladder work', 'Stand on one foot, draw circles with other foot. 15 circles each direction.', 2, 15, NULL, 'mobility', 'None'),
('Shoulder Pass-Through', 'Increases shoulder range of motion', 'Hold resistance band or rope overhead, slowly move behind back and return.', 3, 12, NULL, 'mobility', 'Resistance band'),
('Cat-Cow Stretch', 'Spinal mobility exercise', 'On hands and knees, arch and round spine alternately.', 2, 15, NULL, 'mobility', 'None'),

-- Stability Exercises
('Bird Dog', 'Core stability and balance', 'On hands and knees, extend opposite arm and leg. Hold 5 seconds.', 3, 8, NULL, 'stability', 'None'),
('Dead Bug', 'Core control and coordination', 'Lie on back, extend opposite arm and leg while maintaining core stability.', 3, 10, NULL, 'stability', 'None'),
('Single Leg Stand', 'Balance and proprioception', 'Stand on one leg for time, eyes open then closed.', 3, NULL, 45, 'stability', 'None'),
('Pallof Press', 'Anti-rotation core stability', 'Hold band at chest, press out and resist rotation.', 3, 12, NULL, 'stability', 'Resistance band'),
('Plank to Downward Dog', 'Dynamic core and shoulder stability', 'Move from plank to downward dog position and back.', 3, 10, NULL, 'stability', 'None'),

-- Strength Exercises
('Goblet Squat', 'Lower body strength for lifting', 'Hold weight at chest, squat down keeping chest up.', 4, 12, NULL, 'strength', 'Dumbbell or kettlebell'),
('Farmers Carry', 'Grip and core strength for equipment carrying', 'Walk with heavy weights in each hand for distance.', 3, NULL, 60, 'strength', 'Dumbbells or kettlebells'),
('Push-Up Plus', 'Upper body and serratus strength', 'Perform push-up, then protract shoulder blades at top.', 3, 10, NULL, 'strength', 'None'),
('Romanian Deadlift', 'Posterior chain strength', 'Hinge at hips with slight knee bend, lower weight and return.', 4, 10, NULL, 'strength', 'Barbell or dumbbells'),
('Step-Ups', 'Single leg strength for ladder climbing', 'Step up onto box, control the descent.', 3, 10, NULL, 'strength', 'Box or bench'),

-- Power Exercises
('Box Jump', 'Explosive lower body power', 'Jump onto box, step down and repeat.', 4, 5, NULL, 'power', 'Plyo box'),
('Medicine Ball Slam', 'Full body power and conditioning', 'Raise ball overhead, slam down with force.', 4, 8, NULL, 'power', 'Medicine ball'),
('Battle Ropes', 'Upper body power endurance', 'Alternating or double arm waves for time.', 3, NULL, 30, 'power', 'Battle ropes'),
('Kettlebell Swing', 'Hip power and conditioning', 'Hinge and drive hips to swing kettlebell to shoulder height.', 4, 15, NULL, 'power', 'Kettlebell'),
('Broad Jump', 'Horizontal power development', 'Jump forward for maximum distance, stick landing.', 3, 5, NULL, 'power', 'None'),

-- Corrective Exercises
('Clamshells', 'Hip abductor strengthening', 'Side-lying, keep feet together and open knees.', 3, 15, NULL, 'corrective', 'Mini band'),
('Wall Slides', 'Shoulder blade control', 'Arms against wall in "W" position, slide up to "Y" position.', 3, 12, NULL, 'corrective', 'None'),
('Glute Bridge', 'Glute activation and hip extension', 'Lie on back, drive hips up squeezing glutes.', 3, 15, NULL, 'corrective', 'None'),
('Band Pull-Apart', 'Rear deltoid and rhomboid strengthening', 'Hold band at shoulder height, pull apart squeezing shoulder blades.', 3, 15, NULL, 'corrective', 'Resistance band'),
('Heel Raises', 'Calf strengthening', 'Rise up onto toes, control the descent.', 3, 20, NULL, 'corrective', 'None');

-- Insert Mini-Series Programs
INSERT INTO series (name, description, duration_weeks, target_area, difficulty_level) VALUES
('Hip Mobility Foundation', 'Improve hip mobility and stability for better movement patterns', 3, 'hip', 'beginner'),
('Core Power Series', 'Build core strength and power for equipment handling', 3, 'core', 'intermediate'),
('Shoulder Resilience', 'Enhance shoulder stability and strength for overhead work', 3, 'shoulder', 'intermediate'),
('Lower Body Strength', 'Develop leg strength for ladder climbing and gear carrying', 3, 'lower_body', 'intermediate'),
('Total Body Conditioning', 'Comprehensive program for overall fitness', 3, 'full_body', 'advanced'),
('Injury Prevention Basics', 'Foundation exercises to prevent common injuries', 3, 'full_body', 'beginner');

-- Link exercises to series (Hip Mobility Foundation - Beginner)
-- Week 1: Mobility focus
INSERT INTO series_exercises (series_id, exercise_id, week_number, order_in_week)
SELECT
  s.id,
  e.id,
  1,
  ROW_NUMBER() OVER (ORDER BY e.name)
FROM series s, exercises e
WHERE s.name = 'Hip Mobility Foundation'
AND e.name IN ('Hip Flexor Stretch', 'Ankle Mobility Circles', 'Cat-Cow Stretch', 'Clamshells');

-- Week 2: Stability focus
INSERT INTO series_exercises (series_id, exercise_id, week_number, order_in_week)
SELECT
  s.id,
  e.id,
  2,
  ROW_NUMBER() OVER (ORDER BY e.name)
FROM series s, exercises e
WHERE s.name = 'Hip Mobility Foundation'
AND e.name IN ('Bird Dog', 'Single Leg Stand', 'Glute Bridge', 'Dead Bug');

-- Week 3: Integration
INSERT INTO series_exercises (series_id, exercise_id, week_number, order_in_week)
SELECT
  s.id,
  e.id,
  3,
  ROW_NUMBER() OVER (ORDER BY e.name)
FROM series s, exercises e
WHERE s.name = 'Hip Mobility Foundation'
AND e.name IN ('Goblet Squat', 'Step-Ups', 'Single Leg Stand', 'Hip Flexor Stretch');

-- Core Power Series - Week 1
INSERT INTO series_exercises (series_id, exercise_id, week_number, order_in_week)
SELECT
  s.id,
  e.id,
  1,
  ROW_NUMBER() OVER (ORDER BY e.name)
FROM series s, exercises e
WHERE s.name = 'Core Power Series'
AND e.name IN ('Dead Bug', 'Bird Dog', 'Plank to Downward Dog', 'Pallof Press');

-- Core Power Series - Week 2
INSERT INTO series_exercises (series_id, exercise_id, week_number, order_in_week)
SELECT
  s.id,
  e.id,
  2,
  ROW_NUMBER() OVER (ORDER BY e.name)
FROM series s, exercises e
WHERE s.name = 'Core Power Series'
AND e.name IN ('Farmers Carry', 'Pallof Press', 'Dead Bug', 'Plank to Downward Dog');

-- Core Power Series - Week 3
INSERT INTO series_exercises (series_id, exercise_id, week_number, order_in_week)
SELECT
  s.id,
  e.id,
  3,
  ROW_NUMBER() OVER (ORDER BY e.name)
FROM series s, exercises e
WHERE s.name = 'Core Power Series'
AND e.name IN ('Medicine Ball Slam', 'Farmers Carry', 'Battle Ropes', 'Kettlebell Swing');

-- Shoulder Resilience - Week 1
INSERT INTO series_exercises (series_id, exercise_id, week_number, order_in_week)
SELECT
  s.id,
  e.id,
  1,
  ROW_NUMBER() OVER (ORDER BY e.name)
FROM series s, exercises e
WHERE s.name = 'Shoulder Resilience'
AND e.name IN ('Shoulder Pass-Through', 'Wall Slides', 'Band Pull-Apart', 'Thoracic Spine Rotation');

-- Shoulder Resilience - Week 2
INSERT INTO series_exercises (series_id, exercise_id, week_number, order_in_week)
SELECT
  s.id,
  e.id,
  2,
  ROW_NUMBER() OVER (ORDER BY e.name)
FROM series s, exercises e
WHERE s.name = 'Shoulder Resilience'
AND e.name IN ('Push-Up Plus', 'Wall Slides', 'Pallof Press', 'Band Pull-Apart');

-- Shoulder Resilience - Week 3
INSERT INTO series_exercises (series_id, exercise_id, week_number, order_in_week)
SELECT
  s.id,
  e.id,
  3,
  ROW_NUMBER() OVER (ORDER BY e.name)
FROM series s, exercises e
WHERE s.name = 'Shoulder Resilience'
AND e.name IN ('Push-Up Plus', 'Battle Ropes', 'Medicine Ball Slam', 'Shoulder Pass-Through');

-- Insert demo FMS scores for firefighters
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

-- Assign series to firefighters based on their weak areas
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

-- Insert some demo achievements
INSERT INTO achievements (name, description, icon, points_required, type) VALUES
('First Steps', 'Complete your first exercise', '🚶', 0, 'special'),
('Week Warrior', 'Complete exercises for 7 days straight', '🔥', 0, 'streak'),
('Two Week Champion', 'Maintain a 14-day streak', '💪', 0, 'streak'),
('Fire Brigade Elite', 'Maintain a 30-day streak', '🚒', 0, 'streak'),
('Century Mark', 'Earn 100 points', '💯', 100, 'points'),
('Quarter K', 'Earn 250 points', '🎯', 250, 'points'),
('Half K Hero', 'Earn 500 points', '🏆', 500, 'points'),
('Series Starter', 'Complete Week 1 of any series', '📅', 0, 'series'),
('Series Specialist', 'Complete Week 2 of any series', '📈', 0, 'series'),
('Series Master', 'Complete a full 3-week series', '🎓', 0, 'series'),
('Station Champion', 'Top scorer in your station', '🏅', 0, 'special'),
('Early Bird', 'Complete exercises before 7 AM', '🌅', 0, 'special'),
('Night Owl', 'Complete exercises after 10 PM', '🌙', 0, 'special');

-- Give some demo achievements to users
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

-- Add some demo exercise completions for leaderboard data
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

-- Update points for users who have completions (this would normally be done by triggers)
UPDATE users
SET points = points + 20,
    current_streak = 2,
    last_activity_date = CURRENT_DATE - INTERVAL '1 day'
WHERE name = 'John Smith';

-- ========================================
-- AUTH UUID SYNC SECTION
-- ========================================
-- IMPORTANT: After creating auth users in Supabase Authentication,
-- you need to sync the UUIDs. Follow these steps:
--
-- 1. Create auth users in Supabase Dashboard:
--    Authentication → Users → Add user
--    Create accounts for:
--    - chief@firestation1.com (password: demo123)
--    - john@firestation1.com (password: demo123)
--    - sarah@firestation1.com (password: demo123)
--    - robert@firestation1.com (password: demo123)
--    - emily@firestation1.com (password: demo123)
--
-- 2. Get the auth UUIDs:
--    Run: SELECT id, email FROM auth.users ORDER BY email;
--
-- 3. Delete all dependent data and users:
--    Run the commands below in order
--
-- 4. Re-insert users with correct auth UUIDs using the template below

-- DELETE COMMANDS (run these if UUIDs don't match):
-- DELETE FROM user_achievements;
-- DELETE FROM exercise_completions;
-- DELETE FROM series_assignments;
-- DELETE FROM fms_scores;
-- DELETE FROM users;

-- RE-INSERT USERS WITH CORRECT AUTH UUIDs
-- Replace the UUIDs below with actual UUIDs from auth.users
-- Then uncomment and run:

/*
INSERT INTO users (id, name, email, role, station_id, badge_number, points, current_streak, longest_streak)
SELECT
  'c60c790f-5e34-4fbe-8048-ab5061ad79da'::uuid,  -- chief@firestation1.com
  'Chief Michael Johnson',
  'chief@firestation1.com',
  'chief',
  (SELECT id FROM stations WHERE name = 'Station 1'),
  'C001', 0, 0, 0
UNION ALL SELECT
  'e11738c5-9485-464f-be99-cb7b14c24d1a'::uuid,  -- emily@firestation1.com
  'Emily Davis',
  'emily@firestation1.com',
  'firefighter',
  (SELECT id FROM stations WHERE name = 'Station 1'),
  'F104', 150, 2, 5
UNION ALL SELECT
  '61ffd88a-474a-4846-856d-988e2c5db75a'::uuid,  -- john@firestation1.com
  'John Smith',
  'john@firestation1.com',
  'firefighter',
  (SELECT id FROM stations WHERE name = 'Station 1'),
  'F101', 250, 5, 12
UNION ALL SELECT
  'a8d6fcdf-325f-4df2-b518-2ef20a22e00f'::uuid,  -- robert@firestation1.com
  'Robert Chen',
  'robert@firestation1.com',
  'firefighter',
  (SELECT id FROM stations WHERE name = 'Station 1'),
  'F103', 320, 8, 15
UNION ALL SELECT
  '9be69254-ed08-4304-9130-596b0584ff56'::uuid,  -- sarah@firestation1.com
  'Sarah Williams',
  'sarah@firestation1.com',
  'firefighter',
  (SELECT id FROM stations WHERE name = 'Station 1'),
  'F102', 180, 3, 7;
*/

-- After re-inserting users, re-run the FMS scores, series assignments,
-- achievements, and completions sections above (lines 206-339)

-- ========================================
-- INJURY TRACKING SEED DATA
-- ========================================
-- Demonstrates correlation between FMS scores and injuries
-- Shows ROI and prevention success stories

-- PREVENTION SUCCESS: Robert Chen (high FMS score, followed protocol)
-- FMS Score: High (>16), Following exercises = NO injuries
INSERT INTO fms_scores (user_id, assessed_by, total_score, deep_squat, hurdle_step, inline_lunge, shoulder_mobility, aslr, trunk_stability, rotary_stability, weak_areas, assessed_date, notes)
SELECT
  u.id,
  (SELECT id FROM users WHERE role = 'chief' LIMIT 1),
  18,
  3,
  3,
  2,
  3,
  3,
  2,
  2,
  '{"areas": ["inline_lunge", "trunk_stability"]}',
  CURRENT_DATE - INTERVAL '90 days',
  'Excellent movement quality, assigned preventative exercises'
FROM users u WHERE u.name = 'Robert Chen';

-- PREDICTED INJURY: Emily Davis (low FMS, NOT following protocol)
-- FMS Score: 12 (high risk), NOT following exercises = shoulder strain
INSERT INTO fms_scores (user_id, assessed_by, total_score, deep_squat, hurdle_step, inline_lunge, shoulder_mobility, aslr, trunk_stability, rotary_stability, weak_areas, assessed_date, notes)
SELECT
  u.id,
  (SELECT id FROM users WHERE role = 'chief' LIMIT 1),
  12,
  2,
  2,
  1,
  1,
  2,
  2,
  2,
  '{"areas": ["shoulder_mobility", "inline_lunge"]}',
  CURRENT_DATE - INTERVAL '45 days',
  'High risk: Poor shoulder mobility and single-leg stability'
FROM users u WHERE u.name = 'Emily Davis';

INSERT INTO injuries (user_id, injury_type, body_location, injury_date, days_out, return_date, fms_score_at_time, followed_protocol, severity, cost_impact, notes)
SELECT
  u.id,
  'Rotator Cuff Strain',
  'Right Shoulder',
  CURRENT_DATE - INTERVAL '15 days',
  10,
  CURRENT_DATE - INTERVAL '5 days',
  12,
  FALSE,
  'moderate',
  4500.00,
  'Injured during ladder carry. FMS showed shoulder mobility score of 1. Was NOT following assigned exercises.'
FROM users u WHERE u.name = 'Emily Davis';

-- REACTIVE INJURY: John Smith (moderate FMS, partial protocol)
-- FMS Score: 14 (borderline), Inconsistent exercises = back strain
INSERT INTO injuries (user_id, injury_type, body_location, injury_date, days_out, return_date, fms_score_at_time, followed_protocol, severity, cost_impact, notes)
SELECT
  u.id,
  'Lower Back Strain',
  'Lumbar Spine',
  CURRENT_DATE - INTERVAL '30 days',
  7,
  CURRENT_DATE - INTERVAL '23 days',
  14,
  FALSE,
  'moderate',
  3200.00,
  'Lifting equipment during fire call. FMS trunk stability score: 2. Only completed 40% of assigned exercises.'
FROM users u WHERE u.name = 'John Smith';

-- HISTORICAL INJURY (BEFORE FMS): Sarah Williams
-- Shows what happened BEFORE FMS implementation
INSERT INTO injuries (user_id, injury_type, body_location, injury_date, days_out, return_date, fms_score_at_time, followed_protocol, severity, cost_impact, notes)
SELECT
  u.id,
  'Knee Sprain',
  'Left Knee',
  CURRENT_DATE - INTERVAL '120 days',
  14,
  CURRENT_DATE - INTERVAL '106 days',
  NULL,
  NULL,
  'moderate',
  5800.00,
  'Occurred before FMS program implementation. No preventative exercises assigned.'
FROM users u WHERE u.name = 'Sarah Williams';

-- MINOR INJURY: Sarah Williams (improved FMS, following protocol)
-- After starting FMS program - much less severe
INSERT INTO injuries (user_id, injury_type, body_location, injury_date, days_out, return_date, fms_score_at_time, followed_protocol, severity, cost_impact, notes)
SELECT
  u.id,
  'Minor Ankle Strain',
  'Right Ankle',
  CURRENT_DATE - INTERVAL '10 days',
  2,
  CURRENT_DATE - INTERVAL '8 days',
  16,
  TRUE,
  'minor',
  800.00,
  'Minor tweak during training. FMS improved to 16 and following exercises. Quick recovery compared to previous knee injury.'
FROM users u WHERE u.name = 'Sarah Williams';

-- ADDITIONAL FIREFIGHTERS WITH INJURIES (for statistical significance)
-- Add 2 more firefighters with injury history

-- Low FMS firefighter with multiple injuries
INSERT INTO users (name, email, role, station_id, badge_number, points, current_streak, longest_streak)
SELECT
  'Mike Rodriguez',
  'mike@firestation1.com',
  'firefighter',
  (SELECT id FROM stations WHERE name = 'Station 1'),
  'F105',
  80,
  0,
  3;

INSERT INTO fms_scores (user_id, assessed_by, total_score, deep_squat, hurdle_step, inline_lunge, shoulder_mobility, aslr, trunk_stability, rotary_stability, weak_areas, assessed_date, notes)
SELECT
  u.id,
  (SELECT id FROM users WHERE role = 'chief' LIMIT 1),
  11,
  1,
  2,
  1,
  2,
  1,
  2,
  2,
  '{"areas": ["deep_squat", "inline_lunge", "aslr"]}',
  CURRENT_DATE - INTERVAL '60 days',
  'CRITICAL: Multiple areas of concern. High injury risk.'
FROM users u WHERE u.name = 'Mike Rodriguez';

INSERT INTO injuries (user_id, injury_type, body_location, injury_date, days_out, return_date, fms_score_at_time, followed_protocol, severity, cost_impact, notes)
SELECT
  u.id,
  'Hip Flexor Strain',
  'Right Hip',
  CURRENT_DATE - INTERVAL '40 days',
  12,
  CURRENT_DATE - INTERVAL '28 days',
  11,
  FALSE,
  'severe',
  6200.00,
  'Climbing ladder during rescue. FMS score 11 with deep squat=1. Not following protocol.'
FROM users u WHERE u.name = 'Mike Rodriguez';

INSERT INTO injuries (user_id, injury_type, body_location, injury_date, days_out, return_date, fms_score_at_time, followed_protocol, severity, cost_impact, notes)
SELECT
  u.id,
  'Hamstring Pull',
  'Left Hamstring',
  CURRENT_DATE - INTERVAL '5 days',
  NULL,
  NULL,
  11,
  FALSE,
  'moderate',
  3500.00,
  'Currently out. Running during training drill. Still not following exercises despite previous injury.'
FROM users u WHERE u.name = 'Mike Rodriguez';

-- High FMS firefighter with NO injuries (prevention success)
INSERT INTO users (name, email, role, station_id, badge_number, points, current_streak, longest_streak)
SELECT
  'Lisa Thompson',
  'lisa@firestation1.com',
  'firefighter',
  (SELECT id FROM stations WHERE name = 'Station 1'),
  'F106',
  380,
  15,
  20;

INSERT INTO fms_scores (user_id, assessed_by, total_score, deep_squat, hurdle_step, inline_lunge, shoulder_mobility, aslr, trunk_stability, rotary_stability, weak_areas, assessed_date, notes)
SELECT
  u.id,
  (SELECT id FROM users WHERE role = 'chief' LIMIT 1),
  19,
  3,
  3,
  3,
  2,
  3,
  3,
  2,
  '{"areas": ["shoulder_mobility", "rotary_stability"]}',
  CURRENT_DATE - INTERVAL '90 days',
  'Outstanding movement quality. Consistently follows exercise protocol.'
FROM users u WHERE u.name = 'Lisa Thompson';

-- Assign preventative series to Lisa (she follows it!)
INSERT INTO series_assignments (user_id, series_id, assigned_by, fms_score_id, start_date, end_date, current_week, completed)
SELECT
  u.id,
  s.id,
  (SELECT id FROM users WHERE role = 'chief' LIMIT 1),
  f.id,
  CURRENT_DATE - INTERVAL '21 days',
  CURRENT_DATE,
  3,
  TRUE
FROM users u
JOIN fms_scores f ON f.user_id = u.id
CROSS JOIN series s
WHERE u.name = 'Lisa Thompson'
AND s.name = 'Shoulder Resilience';

-- Lisa has NO injuries - prevention success!

-- Summary Statistics:
-- Total Injuries: 6
-- High FMS (>16) + Following Protocol: 0 injuries (Robert, Lisa)
-- Moderate FMS (14-16) + Partial Protocol: 1 moderate injury (John)
-- Low FMS (<14) + NOT Following Protocol: 3 severe/moderate injuries (Emily, Mike x2)
-- Before FMS Implementation: 1 severe injury (Sarah historical)
-- After FMS Implementation + Following Protocol: 1 minor injury only (Sarah recent)
--
-- Total Days Missed BEFORE proper FMS adherence: 43 days
-- Total Days Missed AFTER following FMS protocol: 2 days
-- Cost Impact Reduction: $20,000 → $800 (96% reduction for Sarah's cases)
-- ROI: 96% reduction in injury severity and 86% reduction in days missed