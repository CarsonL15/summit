-- ============================================
-- CLEANUP SEED DATA & SET UP REAL ENVIRONMENT
-- ============================================
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
--
-- WHAT THIS DOES:
-- 1. Deletes all demo/seed data (users, scores, assignments, completions, injuries)
-- 2. Keeps: exercises, series, series_exercises, achievements (these are real content)
-- 3. Replaces demo stations with your real station: "Academy"
--
-- WARNING: This is destructive and irreversible. Back up your database first if needed.
-- ============================================

-- Step 1: Delete all transactional/user data (order matters due to foreign keys)
DELETE FROM user_achievements;
DELETE FROM exercise_completions;
DELETE FROM series_assignments;
DELETE FROM injuries;
DELETE FROM fms_scores;

-- Step 2: Delete all demo users
-- (This removes ALL users — you'll re-create your admin account after)
DELETE FROM users;

-- Step 3: Delete all demo stations
DELETE FROM stations;

-- Step 4: Create your real station
INSERT INTO stations (id, name, department, location, city, state)
VALUES (
  gen_random_uuid(),
  'Academy',
  'Academy',
  NULL,
  NULL,
  NULL
);

-- Step 5: Verify
SELECT 'Stations' as table_name, count(*) as rows FROM stations
UNION ALL SELECT 'Users', count(*) FROM users
UNION ALL SELECT 'FMS Scores', count(*) FROM fms_scores
UNION ALL SELECT 'Series Assignments', count(*) FROM series_assignments
UNION ALL SELECT 'Exercise Completions', count(*) FROM exercise_completions
UNION ALL SELECT 'Injuries', count(*) FROM injuries
UNION ALL SELECT 'Exercises (kept)', count(*) FROM exercises
UNION ALL SELECT 'Series (kept)', count(*) FROM series
UNION ALL SELECT 'Achievements (kept)', count(*) FROM achievements;

-- ============================================
-- AFTER RUNNING THIS:
--
-- 1. Note the Academy station ID from the stations table
-- 2. Create your admin user via Supabase Auth (Dashboard → Authentication → Users → Add User)
-- 3. Then insert the admin into the users table:
--
--    INSERT INTO users (id, name, email, role, station_id, badge_number)
--    VALUES (
--      '<your-auth-user-uuid>',
--      'Your Name',
--      'your@email.com',
--      'admin',
--      '<academy-station-id>',
--      'ADMIN1'
--    );
-- ============================================
