-- ============================================================================
-- FMS Mini-Series Seed Data
-- 7 series (one per FMS pattern), 3 stages each, 3 exercises per stage
-- Run this against Supabase production AFTER marking active assignments done
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CLEANUP: Delete old series, series_exercises, and unused exercises
--    KEEPS: series f8f9fa68-01ef-481f-8bb2-d270e4035035 + exercises with video_url
-- ============================================================================

-- Mark active assignments on old series as completed (skip the kept series)
UPDATE series_assignments
SET completed = true,
    completion_percentage = 100,
    updated_at = NOW()
WHERE completed = false
  AND series_id != 'f8f9fa68-01ef-481f-8bb2-d270e4035035';

-- Delete series_exercises for all series EXCEPT the kept one
DELETE FROM series_exercises
WHERE series_id != 'f8f9fa68-01ef-481f-8bb2-d270e4035035';

-- Delete all series EXCEPT the kept one
DELETE FROM series
WHERE id != 'f8f9fa68-01ef-481f-8bb2-d270e4035035';

-- Delete old exercises that:
--   - have NO video_url (NULL)
--   - are NOT in the kept series
--   - are NOT referenced by any exercise_completions (preserve history)
DELETE FROM exercises
WHERE video_url IS NULL
  AND id NOT IN (
    SELECT exercise_id FROM series_exercises
    WHERE series_id = 'f8f9fa68-01ef-481f-8bb2-d270e4035035'
  )
  AND id NOT IN (
    SELECT DISTINCT exercise_id FROM exercise_completions
  );

-- ============================================================================
-- 2. INSERT EXERCISES (idempotent — skips if name already exists)
-- ============================================================================

-- ---- Deep Squat Stage 1 ----
INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Ankle Dorsiflexion Mobilization', 'Slow controlled. 10 per side.', 2, 10, NULL, 'Bodyweight', 'Mobility', ARRAY['deep_squat', 'hurdle_step', 'stage_1', 'mobility']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Ankle Dorsiflexion Mobilization');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Goblet Squat Hold', 'Heels elevated if needed. Hold for 10 seconds.', 3, NULL, 10, 'Dumbbell or Kettlebell, Blocks for heel elevation (if needed)', 'Mobility', ARRAY['deep_squat', 'stage_1', 'mobility']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Goblet Squat Hold');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Thoracic Spine Extension Foam Roll', 'Work the whole thoracic spine. 10 reps.', 2, 10, NULL, 'Foam roller', 'Mobility', ARRAY['deep_squat', 'shoulder_mobility', 'stage_1', 'mobility']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Thoracic Spine Extension Foam Roll');

-- ---- Deep Squat Stage 2 ----
INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Goblet Squat (3-1-3 Tempo)', 'Tempo control. 3 seconds down, 1 second pause, 3 seconds up.', 3, 8, NULL, 'Dumbbell or Kettlebell', 'Strength', ARRAY['deep_squat', 'stage_2', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Goblet Squat (3-1-3 Tempo)');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Counterbalance Squat to Box', 'Depth control. 6 reps.', 3, 6, NULL, 'Dumbbell or Kettlebell', 'Strength', ARRAY['deep_squat', 'stage_2', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Counterbalance Squat to Box');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Front-Loaded Split Squat', 'Spine upright. 8 per side.', 3, 8, NULL, 'Dumbbell or Kettlebell', 'Strength', ARRAY['deep_squat', 'stage_2', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Front-Loaded Split Squat');

-- ---- Deep Squat Stage 3 ----
INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Front Squat', 'Light to moderate weight. 5 reps.', 4, 5, NULL, 'Dumbbell or Kettlebell', 'Integration', ARRAY['deep_squat', 'stage_3', 'integration']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Front Squat');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Y Squats with Hold', 'Band on wall, back engaged. 6 reps.', 3, 6, NULL, 'Bands', 'Integration', ARRAY['deep_squat', 'stage_3', 'integration']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Y Squats with Hold');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Squat to Press', 'Slow and controlled. 8 reps.', 3, 8, NULL, 'Dumbbell or Kettlebell', 'Integration', ARRAY['deep_squat', 'stage_3', 'integration']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Squat to Press');

-- ---- Hurdle Step Stage 1 ----
INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Half-Kneeling Hip Flexor Stretch', 'Posterior pelvic tilt. 30 seconds per side.', 2, NULL, 30, 'Bodyweight', 'Mobility', ARRAY['hurdle_step', 'inline_lunge', 'stage_1', 'mobility']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Half-Kneeling Hip Flexor Stretch');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Adductor Overloaded Side Shift', 'Slow. 8 per side.', 2, 8, NULL, 'Dumbbell or Kettlebell', 'Mobility', ARRAY['hurdle_step', 'stage_1', 'mobility']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Adductor Overloaded Side Shift');

-- Ankle Dorsiflexion Mobilization already inserted above (shared with Deep Squat)

-- ---- Hurdle Step Stage 2 ----
INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Single-Leg Balance + March', 'Control pelvis. 6 per side, hold for 2 seconds.', 3, 6, NULL, 'Bodyweight', 'Strength', ARRAY['hurdle_step', 'stage_2', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Single-Leg Balance + March');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Wall March', 'Stacked posture. 8 per side.', 3, 8, NULL, 'Bodyweight', 'Strength', ARRAY['hurdle_step', 'stage_2', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Wall March');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Single-Leg RDL Reach', 'Unloaded. 6 per side.', 3, 6, NULL, 'Dumbbell or Kettlebell', 'Strength', ARRAY['hurdle_step', 'stage_2', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Single-Leg RDL Reach');

-- ---- Hurdle Step Stage 3 ----
INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Step-Ups', 'Slow eccentric. 8 per side.', 3, 8, NULL, 'Dumbbell or Kettlebell + Box', 'Integration', ARRAY['hurdle_step', 'stage_3', 'integration']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Step-Ups');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Suitcase Carry March', 'Resist side-bending. Walk 20 meters.', 3, NULL, 30, 'Dumbbell or Kettlebell', 'Integration', ARRAY['hurdle_step', 'rotary_stability', 'stage_3', 'integration']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Suitcase Carry March');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Single-Leg RDL', 'Moderate load. 6 per side.', 4, 6, NULL, 'Dumbbell or Kettlebell', 'Integration', ARRAY['hurdle_step', 'aslr', 'stage_3', 'integration']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Single-Leg RDL');

-- ---- In-Line Lunge Stage 1 ----
INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Half-Kneeling Quad Stretch', 'Posterior pelvic tilt. 30 seconds per side.', 2, NULL, 30, 'Bodyweight', 'Mobility', ARRAY['inline_lunge', 'stage_1', 'mobility']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Half-Kneeling Quad Stretch');

-- Half-Kneeling Hip Flexor Stretch already inserted above (shared with Hurdle Step)

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Half-Kneeling Thoracic Spine Rotation', 'Control. 8 per side.', 2, 8, NULL, 'Bodyweight', 'Mobility', ARRAY['inline_lunge', 'stage_1', 'mobility']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Half-Kneeling Thoracic Spine Rotation');

-- ---- In-Line Lunge Stage 2 ----
INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Split Squat Isometric Hold', 'Vertical torso. Hold for 20 seconds.', 3, NULL, 20, 'Bodyweight, Dumbbell, or Kettlebell', 'Strength', ARRAY['inline_lunge', 'stage_2', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Split Squat Isometric Hold');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Rear-Foot Elevated Split Squat', 'Slow tempo. 6 per side.', 3, 6, NULL, 'Dumbbell or Kettlebell', 'Strength', ARRAY['inline_lunge', 'stage_2', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Rear-Foot Elevated Split Squat');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Split Squat Narrow Stance Pallof Press', 'Anti-rotation. 8 reps.', 3, 8, NULL, 'Bands', 'Strength', ARRAY['inline_lunge', 'stage_2', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Split Squat Narrow Stance Pallof Press');

-- ---- In-Line Lunge Stage 3 ----
INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Walking Lunge', 'Front rack preferred, single-arm is best. 10 per side.', 3, 10, NULL, 'Dumbbell or Kettlebell', 'Integration', ARRAY['inline_lunge', 'stage_3', 'integration']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Walking Lunge');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Opposite-Side Loaded Split Squat', 'Core demand. 6 per side.', 4, 6, NULL, 'Dumbbell or Kettlebell', 'Integration', ARRAY['inline_lunge', 'stage_3', 'integration']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Opposite-Side Loaded Split Squat');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Barbell In-Line Lunge', 'Upright spine. 6 reps.', 3, 6, NULL, 'Barbell', 'Integration', ARRAY['inline_lunge', 'stage_3', 'integration']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Barbell In-Line Lunge');

-- ---- Shoulder Mobility Stage 1 ----
-- Thoracic Spine Extension Foam Roll already inserted above (shared with Deep Squat)

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Dowel Flexion, Extension, Abduction, External Rotation', 'Pain free. 30 seconds per side.', 2, NULL, 30, 'Dowel or PVC', 'Mobility', ARRAY['shoulder_mobility', 'stage_1', 'mobility']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Dowel Flexion, Extension, Abduction, External Rotation');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Prayer Stretch, Thumbs Up / Palms Up', 'Keep ribs pulled down. 30 seconds.', 2, NULL, 30, 'Foam roller', 'Mobility', ARRAY['shoulder_mobility', 'stage_1', 'mobility']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Prayer Stretch, Thumbs Up / Palms Up');

-- ---- Shoulder Mobility Stage 2 ----
INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Wall Slides', 'Keep ribs pulled down. 8 reps.', 3, 8, NULL, 'Bands', 'Strength', ARRAY['shoulder_mobility', 'stage_2', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Wall Slides');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Prone Y-T-W', 'Light load. 8 each position.', 2, 8, NULL, 'Bands', 'Strength', ARRAY['shoulder_mobility', 'stage_2', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Prone Y-T-W');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Bottoms-Up Kettlebell Carry', 'Shoulder blade stability. Walk 20 meters.', 3, NULL, 30, 'Kettlebell', 'Strength', ARRAY['shoulder_mobility', 'stage_2', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Bottoms-Up Kettlebell Carry');

-- ---- Shoulder Mobility Stage 3 ----
INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Crab Walk', 'Shoulders extended, hips high. Walk 10 meters.', 3, NULL, 20, 'Bodyweight', 'Integration', ARRAY['shoulder_mobility', 'stage_3', 'integration']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Crab Walk');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Overhead Carry', 'Neutral spine. Walk 20 meters.', 3, NULL, 30, 'Dumbbell or Kettlebell', 'Integration', ARRAY['shoulder_mobility', 'stage_3', 'integration']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Overhead Carry');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Push-Up Plus', 'Side-rib muscle focus. 10 reps.', 3, 10, NULL, 'Bodyweight', 'Integration', ARRAY['shoulder_mobility', 'stage_3', 'integration']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Push-Up Plus');

-- ---- ASLR Stage 1 ----
INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Hamstring Banded Floss', 'Active. 10 per side.', 2, 10, NULL, 'Bands', 'Mobility', ARRAY['aslr', 'stage_1', 'mobility']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Hamstring Banded Floss');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), '90/90 Hip Mobility', 'Upright. 8 per side.', 2, 8, NULL, 'Bodyweight', 'Mobility', ARRAY['aslr', 'stage_1', 'mobility']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = '90/90 Hip Mobility');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Glute / Hamstring Rollout', 'As needed. 2-3 minutes.', 1, NULL, 120, 'Foam roller', 'Mobility', ARRAY['aslr', 'stage_1', 'mobility']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Glute / Hamstring Rollout');

-- ---- ASLR Stage 2 ----
INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Dead Bug', 'Opposite arm/leg. 6 per side.', 3, 6, NULL, 'Bodyweight', 'Strength', ARRAY['aslr', 'trunk_stability', 'stage_2', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Dead Bug');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Toes-Up / Heels-Up Toe Touch', 'Actively reaching down. 8 reps.', 3, 8, NULL, 'Yoga Blocks or Weight Plates', 'Strength', ARRAY['aslr', 'stage_2', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Toes-Up / Heels-Up Toe Touch');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Walking Single-Leg RDL', 'Flat back, hip hinge. Walk 20 meters.', 3, NULL, 30, 'Bodyweight', 'Strength', ARRAY['aslr', 'stage_2', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Walking Single-Leg RDL');

-- ---- ASLR Stage 3 ----
INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Single-Leg Glute Bridge', 'Progress load over time. 8 per side.', 3, 8, NULL, 'Dumbbell or Kettlebell', 'Integration', ARRAY['aslr', 'stage_3', 'integration']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Single-Leg Glute Bridge');

-- Single-Leg RDL already inserted above (shared with Hurdle Step)

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Walking A and B March', 'Tall posture, total control. Walk 20 meters.', 4, NULL, 30, 'Bodyweight', 'Integration', ARRAY['aslr', 'stage_3', 'integration']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Walking A and B March');

-- ---- Core-Biased Push-Up Stage 1 ----
INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Quadruped Rockback', 'Neutral spine. 10 reps.', 2, 10, NULL, 'Bodyweight', 'Mobility', ARRAY['trunk_stability', 'stage_1', 'mobility']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Quadruped Rockback');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Incline Push-Up', 'Brace core. 8 reps.', 3, 8, NULL, 'Bodyweight', 'Mobility', ARRAY['trunk_stability', 'stage_1', 'mobility']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Incline Push-Up');

-- Dead Bug already inserted above (shared with ASLR)

-- ---- Core-Biased Push-Up Stage 2 ----
INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Plank', 'No sag, active abs. Hold for 30 seconds.', 3, NULL, 30, 'Bodyweight', 'Strength', ARRAY['trunk_stability', 'stage_2', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Plank');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Eccentric Push-Up', '5 seconds down. 5 reps.', 3, 5, NULL, 'Bodyweight', 'Strength', ARRAY['trunk_stability', 'stage_2', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Eccentric Push-Up');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Bear Crawl Hold', 'Knees off ground. Hold for 20 seconds.', 3, NULL, 20, 'Bodyweight', 'Strength', ARRAY['trunk_stability', 'stage_2', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Bear Crawl Hold');

-- ---- Core-Biased Push-Up Stage 3 ----
INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Push-Up', 'Quality reps. 6 reps.', 4, 6, NULL, 'Bodyweight', 'Integration', ARRAY['trunk_stability', 'stage_3', 'integration']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Push-Up');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Push-Up Shoulder Taps', 'Anti-rotation. 8 per side.', 3, 8, NULL, 'Bodyweight', 'Integration', ARRAY['trunk_stability', 'stage_3', 'integration']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Push-Up Shoulder Taps');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Renegade Row', 'Wide feet for stability. 6 per side.', 3, 6, NULL, 'Dumbbell or Kettlebell', 'Integration', ARRAY['trunk_stability', 'stage_3', 'integration']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Renegade Row');

-- ---- Rotary Stability Stage 1 ----
INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Dead Bug Lateral Arms', 'Controlled. 10 per side.', 2, 10, NULL, 'Dumbbell or Kettlebell', 'Mobility', ARRAY['rotary_stability', 'stage_1', 'mobility']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Dead Bug Lateral Arms');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Bird Dog', 'Flat back. 6 per side.', 3, 6, NULL, 'Bodyweight', 'Mobility', ARRAY['rotary_stability', 'stage_1', 'mobility']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Bird Dog');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Dead Bug Pallof Press', 'Slow. 5 each side.', 2, 5, NULL, 'Bands', 'Mobility', ARRAY['rotary_stability', 'stage_1', 'mobility']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Dead Bug Pallof Press');

-- ---- Rotary Stability Stage 2 ----
INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Low Bear Bird Dog', 'Maintain body position. 6 per side.', 3, 6, NULL, 'Bodyweight', 'Strength', ARRAY['rotary_stability', 'stage_2', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Low Bear Bird Dog');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Side Plank Reach', 'Anti-rotation. 8 per side.', 3, 8, NULL, 'Bodyweight', 'Strength', ARRAY['rotary_stability', 'stage_2', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Side Plank Reach');

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Half-Kneeling Pallof Press', 'Control. 8 reps.', 3, 8, NULL, 'Bands', 'Strength', ARRAY['rotary_stability', 'stage_2', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Half-Kneeling Pallof Press');

-- ---- Rotary Stability Stage 3 ----
INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Plank Bird Dog', 'Quality. 10 second hold per side.', 4, NULL, 10, 'Bodyweight', 'Integration', ARRAY['rotary_stability', 'stage_3', 'integration']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Plank Bird Dog');

-- Suitcase Carry March already inserted above (shared with Hurdle Step)

INSERT INTO exercises (id, name, instructions, sets, reps, duration_seconds, equipment_needed, category, tags)
SELECT gen_random_uuid(), 'Cable Chop/Lift', 'Diagonal movement. 8 per side.', 3, 8, NULL, 'Bands', 'Integration', ARRAY['rotary_stability', 'stage_3', 'integration']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cable Chop/Lift');

-- ============================================================================
-- 3. INSERT 7 SERIES
-- ============================================================================

INSERT INTO series (id, name, description, duration_weeks, target_area, difficulty_level, series_type, days_per_week)
VALUES
  (gen_random_uuid(), 'Deep Squat', 'Corrective series for deep squat pattern. Stage 1: Mobilize, Stage 2: Strengthen, Stage 3: Integrate.', 6, 'deep_squat', 'beginner', 'rehab', 2),
  (gen_random_uuid(), 'Hurdle Step', 'Corrective series for hurdle step pattern. Stage 1: Mobilize, Stage 2: Strengthen, Stage 3: Integrate.', 6, 'hurdle_step', 'beginner', 'rehab', 2),
  (gen_random_uuid(), 'In-Line Lunge', 'Corrective series for in-line lunge pattern. Stage 1: Mobilize, Stage 2: Strengthen, Stage 3: Integrate.', 6, 'inline_lunge', 'beginner', 'rehab', 2),
  (gen_random_uuid(), 'Shoulder Mobility', 'Corrective series for shoulder mobility pattern. Stage 1: Mobilize, Stage 2: Strengthen, Stage 3: Integrate.', 6, 'shoulder_mobility', 'beginner', 'rehab', 2),
  (gen_random_uuid(), 'Active Straight Leg Raise', 'Corrective series for ASLR pattern. Stage 1: Mobilize, Stage 2: Strengthen, Stage 3: Integrate.', 6, 'aslr', 'beginner', 'rehab', 2),
  (gen_random_uuid(), 'Core-Biased Push-Up', 'Corrective series for trunk stability push-up pattern. Stage 1: Mobilize, Stage 2: Strengthen, Stage 3: Integrate.', 6, 'trunk_stability', 'beginner', 'rehab', 2),
  (gen_random_uuid(), 'Rotary Stability', 'Corrective series for rotary stability pattern. Stage 1: Mobilize, Stage 2: Strengthen, Stage 3: Integrate.', 6, 'rotary_stability', 'beginner', 'rehab', 2);

-- ============================================================================
-- 4. INSERT SERIES_EXERCISES (63 rows: 7 series × 3 stages × 3 exercises)
--    week_number = stage number (1, 2, 3)
--    day_number = NULL (same exercises every day in a stage)
--    order_in_week = 1, 2, 3 (exercise order within the stage)
-- ============================================================================

-- ---- Deep Squat ----
INSERT INTO series_exercises (id, series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps, custom_duration)
VALUES
  -- Stage 1
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Deep Squat'), (SELECT id FROM exercises WHERE name = 'Ankle Dorsiflexion Mobilization'), 1, NULL, 1, 2, 10, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Deep Squat'), (SELECT id FROM exercises WHERE name = 'Goblet Squat Hold'), 1, NULL, 2, 3, NULL, 10),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Deep Squat'), (SELECT id FROM exercises WHERE name = 'Thoracic Spine Extension Foam Roll'), 1, NULL, 3, 2, 10, NULL),
  -- Stage 2
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Deep Squat'), (SELECT id FROM exercises WHERE name = 'Goblet Squat (3-1-3 Tempo)'), 2, NULL, 1, 3, 8, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Deep Squat'), (SELECT id FROM exercises WHERE name = 'Counterbalance Squat to Box'), 2, NULL, 2, 3, 6, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Deep Squat'), (SELECT id FROM exercises WHERE name = 'Front-Loaded Split Squat'), 2, NULL, 3, 3, 8, NULL),
  -- Stage 3
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Deep Squat'), (SELECT id FROM exercises WHERE name = 'Front Squat'), 3, NULL, 1, 4, 5, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Deep Squat'), (SELECT id FROM exercises WHERE name = 'Y Squats with Hold'), 3, NULL, 2, 3, 6, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Deep Squat'), (SELECT id FROM exercises WHERE name = 'Squat to Press'), 3, NULL, 3, 3, 8, NULL),

  -- ---- Hurdle Step ----
  -- Stage 1
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Hurdle Step'), (SELECT id FROM exercises WHERE name = 'Half-Kneeling Hip Flexor Stretch'), 1, NULL, 1, 2, NULL, 30),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Hurdle Step'), (SELECT id FROM exercises WHERE name = 'Adductor Overloaded Side Shift'), 1, NULL, 2, 2, 8, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Hurdle Step'), (SELECT id FROM exercises WHERE name = 'Ankle Dorsiflexion Mobilization'), 1, NULL, 3, 2, 10, NULL),
  -- Stage 2
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Hurdle Step'), (SELECT id FROM exercises WHERE name = 'Single-Leg Balance + March'), 2, NULL, 1, 3, 6, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Hurdle Step'), (SELECT id FROM exercises WHERE name = 'Wall March'), 2, NULL, 2, 3, 8, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Hurdle Step'), (SELECT id FROM exercises WHERE name = 'Single-Leg RDL Reach'), 2, NULL, 3, 3, 6, NULL),
  -- Stage 3
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Hurdle Step'), (SELECT id FROM exercises WHERE name = 'Step-Ups'), 3, NULL, 1, 3, 8, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Hurdle Step'), (SELECT id FROM exercises WHERE name = 'Suitcase Carry March'), 3, NULL, 2, 3, NULL, 30),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Hurdle Step'), (SELECT id FROM exercises WHERE name = 'Single-Leg RDL'), 3, NULL, 3, 4, 6, NULL),

  -- ---- In-Line Lunge ----
  -- Stage 1
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'In-Line Lunge'), (SELECT id FROM exercises WHERE name = 'Half-Kneeling Quad Stretch'), 1, NULL, 1, 2, NULL, 30),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'In-Line Lunge'), (SELECT id FROM exercises WHERE name = 'Half-Kneeling Hip Flexor Stretch'), 1, NULL, 2, 2, NULL, 30),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'In-Line Lunge'), (SELECT id FROM exercises WHERE name = 'Half-Kneeling Thoracic Spine Rotation'), 1, NULL, 3, 2, 8, NULL),
  -- Stage 2
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'In-Line Lunge'), (SELECT id FROM exercises WHERE name = 'Split Squat Isometric Hold'), 2, NULL, 1, 3, NULL, 20),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'In-Line Lunge'), (SELECT id FROM exercises WHERE name = 'Rear-Foot Elevated Split Squat'), 2, NULL, 2, 3, 6, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'In-Line Lunge'), (SELECT id FROM exercises WHERE name = 'Split Squat Narrow Stance Pallof Press'), 2, NULL, 3, 3, 8, NULL),
  -- Stage 3
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'In-Line Lunge'), (SELECT id FROM exercises WHERE name = 'Walking Lunge'), 3, NULL, 1, 3, 10, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'In-Line Lunge'), (SELECT id FROM exercises WHERE name = 'Opposite-Side Loaded Split Squat'), 3, NULL, 2, 4, 6, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'In-Line Lunge'), (SELECT id FROM exercises WHERE name = 'Barbell In-Line Lunge'), 3, NULL, 3, 3, 6, NULL),

  -- ---- Shoulder Mobility ----
  -- Stage 1
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Shoulder Mobility'), (SELECT id FROM exercises WHERE name = 'Thoracic Spine Extension Foam Roll'), 1, NULL, 1, 2, 10, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Shoulder Mobility'), (SELECT id FROM exercises WHERE name = 'Dowel Flexion, Extension, Abduction, External Rotation'), 1, NULL, 2, 2, NULL, 30),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Shoulder Mobility'), (SELECT id FROM exercises WHERE name = 'Prayer Stretch, Thumbs Up / Palms Up'), 1, NULL, 3, 2, NULL, 30),
  -- Stage 2
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Shoulder Mobility'), (SELECT id FROM exercises WHERE name = 'Wall Slides'), 2, NULL, 1, 3, 8, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Shoulder Mobility'), (SELECT id FROM exercises WHERE name = 'Prone Y-T-W'), 2, NULL, 2, 2, 8, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Shoulder Mobility'), (SELECT id FROM exercises WHERE name = 'Bottoms-Up Kettlebell Carry'), 2, NULL, 3, 3, NULL, 30),
  -- Stage 3
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Shoulder Mobility'), (SELECT id FROM exercises WHERE name = 'Crab Walk'), 3, NULL, 1, 3, NULL, 20),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Shoulder Mobility'), (SELECT id FROM exercises WHERE name = 'Overhead Carry'), 3, NULL, 2, 3, NULL, 30),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Shoulder Mobility'), (SELECT id FROM exercises WHERE name = 'Push-Up Plus'), 3, NULL, 3, 3, 10, NULL),

  -- ---- Active Straight Leg Raise ----
  -- Stage 1
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Active Straight Leg Raise'), (SELECT id FROM exercises WHERE name = 'Hamstring Banded Floss'), 1, NULL, 1, 2, 10, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Active Straight Leg Raise'), (SELECT id FROM exercises WHERE name = '90/90 Hip Mobility'), 1, NULL, 2, 2, 8, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Active Straight Leg Raise'), (SELECT id FROM exercises WHERE name = 'Glute / Hamstring Rollout'), 1, NULL, 3, 1, NULL, 120),
  -- Stage 2
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Active Straight Leg Raise'), (SELECT id FROM exercises WHERE name = 'Dead Bug'), 2, NULL, 1, 3, 6, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Active Straight Leg Raise'), (SELECT id FROM exercises WHERE name = 'Toes-Up / Heels-Up Toe Touch'), 2, NULL, 2, 3, 8, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Active Straight Leg Raise'), (SELECT id FROM exercises WHERE name = 'Walking Single-Leg RDL'), 2, NULL, 3, 3, NULL, 30),
  -- Stage 3
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Active Straight Leg Raise'), (SELECT id FROM exercises WHERE name = 'Single-Leg Glute Bridge'), 3, NULL, 1, 3, 8, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Active Straight Leg Raise'), (SELECT id FROM exercises WHERE name = 'Single-Leg RDL'), 3, NULL, 2, 4, 6, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Active Straight Leg Raise'), (SELECT id FROM exercises WHERE name = 'Walking A and B March'), 3, NULL, 3, 4, NULL, 30),

  -- ---- Core-Biased Push-Up ----
  -- Stage 1
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Core-Biased Push-Up'), (SELECT id FROM exercises WHERE name = 'Quadruped Rockback'), 1, NULL, 1, 2, 10, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Core-Biased Push-Up'), (SELECT id FROM exercises WHERE name = 'Incline Push-Up'), 1, NULL, 2, 3, 8, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Core-Biased Push-Up'), (SELECT id FROM exercises WHERE name = 'Dead Bug'), 1, NULL, 3, 3, 6, NULL),
  -- Stage 2
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Core-Biased Push-Up'), (SELECT id FROM exercises WHERE name = 'Plank'), 2, NULL, 1, 3, NULL, 30),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Core-Biased Push-Up'), (SELECT id FROM exercises WHERE name = 'Eccentric Push-Up'), 2, NULL, 2, 3, 5, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Core-Biased Push-Up'), (SELECT id FROM exercises WHERE name = 'Bear Crawl Hold'), 2, NULL, 3, 3, NULL, 20),
  -- Stage 3
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Core-Biased Push-Up'), (SELECT id FROM exercises WHERE name = 'Push-Up'), 3, NULL, 1, 4, 6, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Core-Biased Push-Up'), (SELECT id FROM exercises WHERE name = 'Push-Up Shoulder Taps'), 3, NULL, 2, 3, 8, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Core-Biased Push-Up'), (SELECT id FROM exercises WHERE name = 'Renegade Row'), 3, NULL, 3, 3, 6, NULL),

  -- ---- Rotary Stability ----
  -- Stage 1
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Rotary Stability'), (SELECT id FROM exercises WHERE name = 'Dead Bug Lateral Arms'), 1, NULL, 1, 2, 10, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Rotary Stability'), (SELECT id FROM exercises WHERE name = 'Bird Dog'), 1, NULL, 2, 3, 6, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Rotary Stability'), (SELECT id FROM exercises WHERE name = 'Dead Bug Pallof Press'), 1, NULL, 3, 2, 5, NULL),
  -- Stage 2
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Rotary Stability'), (SELECT id FROM exercises WHERE name = 'Low Bear Bird Dog'), 2, NULL, 1, 3, 6, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Rotary Stability'), (SELECT id FROM exercises WHERE name = 'Side Plank Reach'), 2, NULL, 2, 3, 8, NULL),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Rotary Stability'), (SELECT id FROM exercises WHERE name = 'Half-Kneeling Pallof Press'), 2, NULL, 3, 3, 8, NULL),
  -- Stage 3
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Rotary Stability'), (SELECT id FROM exercises WHERE name = 'Plank Bird Dog'), 3, NULL, 1, 4, NULL, 10),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Rotary Stability'), (SELECT id FROM exercises WHERE name = 'Suitcase Carry March'), 3, NULL, 2, 4, NULL, 30),
  (gen_random_uuid(), (SELECT id FROM series WHERE name = 'Rotary Stability'), (SELECT id FROM exercises WHERE name = 'Cable Chop/Lift'), 3, NULL, 3, 3, 8, NULL);

COMMIT;
