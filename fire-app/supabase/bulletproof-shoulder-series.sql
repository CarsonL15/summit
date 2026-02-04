-- Bulletproof Shoulder Program 2.0 - 8 Week Series
-- This script adds new exercises and creates the 8-week shoulder rehab series

-- =============================================
-- PART 0: Schema Update (if needed)
-- =============================================
-- Update week_number constraint to allow 8 weeks
ALTER TABLE series_exercises DROP CONSTRAINT IF EXISTS series_exercises_week_number_check;
ALTER TABLE series_exercises ADD CONSTRAINT series_exercises_week_number_check CHECK (week_number >= 1 AND week_number <= 12);

-- =============================================
-- PART 1: Add New Exercises
-- =============================================

-- Warm-up Exercises
INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Arm Circles + Scap Reset', 'mobility', 'Increase blood flow and restore scapular motion', 'Pain-free range, ribs down, relaxed neck. Perform for 1 minute.', 'None', ARRAY['shoulder', 'warm-up', 'mobility']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Arm Circles + Scap Reset');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Banded Pull-Aparts', 'corrective', 'Activate mid-back and posterior shoulder', 'Thumbs up, pause 1 second at retraction. 2 sets of 12-15 reps.', 'Resistance band', ARRAY['shoulder', 'warm-up', 'activation']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Banded Pull-Aparts');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Serratus Wall Slides', 'mobility', 'Prime serratus and upward rotation', 'Reach up and away, no lumbar arch. 2 sets of 6-8 slow reps.', 'Wall', ARRAY['shoulder', 'warm-up', 'mobility']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Serratus Wall Slides');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Quadruped Scap Push-Ups', 'stability', 'Reinforce scapular protraction control', 'Arms straight, push floor away. 1-2 sets of 8-10 reps.', 'None', ARRAY['shoulder', 'warm-up', 'stability']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Quadruped Scap Push-Ups');

-- Week 1-2 Exercises
INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'DB Bench Press', 'strength', 'Upper body pressing for shoulder stability', 'Neutral grip, ribs down, slow eccentric. 3-4 sets of 12 down to 6 reps.', 'Dumbbells', ARRAY['shoulder', 'chest', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'DB Bench Press');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Half-Kneeling DB OHP', 'strength', 'Overhead press with core engagement', 'Glute tight, no lumbar extension. 3-4 sets of 8 down to 6 reps.', 'Dumbbell', ARRAY['shoulder', 'overhead', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Half-Kneeling DB OHP');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Inverted Row', 'strength', 'Upper back pulling for shoulder balance', 'Pause at top, squeeze scap. 3-4 sets of 12 down to 8 reps.', 'Barbell or Rings', ARRAY['shoulder', 'back', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Inverted Row');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Banded External Rotation', 'corrective', 'Activate rotator cuff with control', 'Elbow tucked, slow control. 2-3 sets of 20 down to 12 reps.', 'Resistance band', ARRAY['shoulder', 'rotator-cuff', 'corrective']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Banded External Rotation');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Lat Pulldown', 'strength', 'Vertical pulling for lat and shoulder development', 'Initiate with scap depression. 4-5 sets of 8 down to 4 reps.', 'Cable machine or heavy bands', ARRAY['shoulder', 'back', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Lat Pulldown');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Landmine Press', 'strength', 'Angled pressing for shoulder-friendly overhead work', 'Drive up, ribs down. 3-4 sets of 8 down to 6 reps.', 'Barbell with landmine attachment', ARRAY['shoulder', 'overhead', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Landmine Press');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Single-Arm DB Row', 'strength', 'Unilateral pulling for back and shoulder stability', 'No torso rotation. 3-4 sets of 10 down to 8 reps.', 'Dumbbell', ARRAY['shoulder', 'back', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Single-Arm DB Row');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Y-Raise', 'corrective', 'Lower trap activation for shoulder health', 'Thumbs up, light load. 2-3 sets of 15 down to 10 reps.', 'Light dumbbells or bands', ARRAY['shoulder', 'corrective', 'activation']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Y-Raise');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'ITYs', 'corrective', 'Multi-angle shoulder activation', 'Tall posture, shoulders down. 2-3 sets of 15 down to 12 reps.', 'Light dumbbells or bands', ARRAY['shoulder', 'corrective', 'activation']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'ITYs');

-- Week 3-4 Exercises
INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Push-Up', 'strength', 'Foundational pushing exercise', 'Maintain good posture throughout. 4 sets of 12 down to 8 reps.', 'None', ARRAY['shoulder', 'chest', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Push-Up');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Tall-Kneeling Double DB OHP', 'strength', 'Overhead press with hip stability focus', 'Glute tight, no lumbar extension. 3-4 sets of 8 down to 6 reps.', 'Dumbbells', ARRAY['shoulder', 'overhead', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Tall-Kneeling Double DB OHP');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Chest-Supported Row', 'strength', 'Supported rowing for upper back', 'Pause at top, squeeze scap. 3-4 sets of 12 down to 8 reps.', 'Dumbbells and bench', ARRAY['shoulder', 'back', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Chest-Supported Row');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Banded ER at 90 Degrees', 'corrective', 'External rotation at shoulder height', 'Elbow level with shoulder, slow control. 2-3 sets of 20 down to 12 reps.', 'Resistance band', ARRAY['shoulder', 'rotator-cuff', 'corrective']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Banded ER at 90 Degrees');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Suitcase Carry', 'stability', 'Unilateral carry for core and shoulder stability', 'Tall posture, shoulders down. 3 sets of 30-45 seconds.', 'Dumbbell or kettlebell', ARRAY['shoulder', 'core', 'stability']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Suitcase Carry');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Pull-Ups', 'strength', 'Vertical pulling for upper body strength', 'Initiate with scap depression. 4-5 sets of 8 down to 4 reps.', 'Pull-up bar', ARRAY['shoulder', 'back', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Pull-Ups');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Double-Arm DB Row', 'strength', 'Bilateral rowing for back development', 'No torso rotation. 3-4 sets of 10 down to 8 reps.', 'Dumbbells', ARRAY['shoulder', 'back', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Double-Arm DB Row');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Lateral Raises', 'strength', 'Shoulder abduction for deltoid development', 'Thumbs up, light load. 2-3 sets of 15 down to 10 reps.', 'Light dumbbells', ARRAY['shoulder', 'deltoid', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Lateral Raises');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'YTWs', 'corrective', 'Multi-position shoulder activation', 'Elbow level with shoulder. 2-3 sets of 15 down to 12 reps.', 'Light dumbbells or bands', ARRAY['shoulder', 'corrective', 'activation']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'YTWs');

-- Week 5-6 Exercises
INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Barbell Bench Press', 'strength', 'Primary horizontal pressing exercise', 'Neutral grip, ribs down, slow eccentric. Should be struggling in last 2 sets.', 'Barbell', ARRAY['shoulder', 'chest', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Barbell Bench Press');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Standing Overhead Press', 'strength', 'Full-body overhead pressing', 'Glute tight, no lumbar extension. 3-4 sets of 8 down to 6 reps.', 'Barbell or dumbbells', ARRAY['shoulder', 'overhead', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Standing Overhead Press');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Feet Elevated Ring Row', 'strength', 'Advanced horizontal pulling', 'Pause at top, squeeze scap. 3-4 sets of 12 down to 8 reps.', 'Rings and bench', ARRAY['shoulder', 'back', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Feet Elevated Ring Row');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Weighted Arm Circles', 'corrective', 'Rotator cuff endurance with light load', 'Small circles, shoulders relaxed. 2-3 sets of 30-45 seconds.', 'Light dumbbells (5-10 lbs)', ARRAY['shoulder', 'warm-up', 'corrective']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Weighted Arm Circles');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Stagger Stance Pallof Press', 'stability', 'Anti-rotation core exercise', 'Tall posture, shoulders relaxed. 3 sets of 12 down to 10 reps.', 'Resistance band or cable', ARRAY['core', 'stability', 'shoulder']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Stagger Stance Pallof Press');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Med Ball Throwdowns', 'power', 'Explosive shoulder and core power', 'Accelerate with arms. 4-5 sets of 8 down to 4 reps.', 'Medicine ball', ARRAY['shoulder', 'power', 'core']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Med Ball Throwdowns');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Kneeling Landmine Press', 'strength', 'Kneeling angled press for shoulder stability', 'Arc press side to side, ribs down. 3-4 sets of 8 down to 6 reps.', 'Barbell with landmine', ARRAY['shoulder', 'overhead', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Kneeling Landmine Press');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Banded One Arm Rows', 'strength', 'Single-arm pulling with rotation', 'Add in shoulder turn. 3-4 sets of 10 down to 8 reps.', 'Resistance band', ARRAY['shoulder', 'back', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Banded One Arm Rows');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Shoulder Windmills', 'mobility', 'Thoracic rotation with shoulder stability', 'Arm locked, rotate through thoracic spine. 2-3 sets of 15 down to 10 reps.', 'Light dumbbell', ARRAY['shoulder', 'mobility', 'thoracic']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Shoulder Windmills');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Shoulder ABCs on Wall', 'corrective', 'Shoulder control and endurance', 'Facing wall and perpendicular to wall, trace full ABCs. 2-3 sets.', 'Small ball', ARRAY['shoulder', 'corrective', 'control']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Shoulder ABCs on Wall');

-- Week 7-8 Exercises
INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'One Arm Ring Row', 'strength', 'Advanced unilateral pulling', 'Pause at top, squeeze scap. 3-4 sets of 8 down to 6 reps.', 'Rings', ARRAY['shoulder', 'back', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'One Arm Ring Row');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Plank Pull Throughs', 'stability', 'Dynamic plank for core and shoulder stability', 'Shoulders engaged, no slump in back. 3 sets of 30-45 seconds.', 'Dumbbell or kettlebell', ARRAY['core', 'shoulder', 'stability']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Plank Pull Throughs');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Gorilla Rows', 'strength', 'Hinged bilateral rowing with alternating arms', 'Do not lose good posture. 3-4 sets of 10 down to 8 reps.', 'Kettlebells or dumbbells', ARRAY['shoulder', 'back', 'strength']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Gorilla Rows');

INSERT INTO exercises (name, category, description, instructions, equipment_needed, tags)
SELECT 'Turkish Get Up', 'stability', 'Full-body shoulder stability and mobility', 'Keep weight pressed overhead throughout. 2-3 sets of 5 down to 3 reps per side.', 'Kettlebell or dumbbell', ARRAY['shoulder', 'full-body', 'stability']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Turkish Get Up');

-- =============================================
-- PART 2: Create the 8-Week Series
-- =============================================

-- Delete existing series if it exists (to allow clean recreation)
DELETE FROM series_exercises WHERE series_id = (SELECT id FROM series WHERE name = 'Bulletproof Shoulder Program');
DELETE FROM series WHERE name = 'Bulletproof Shoulder Program';

INSERT INTO series (name, description, target_area, difficulty_level, series_type, days_per_week)
VALUES (
  'Bulletproof Shoulder Program',
  '8-week progressive shoulder rehabilitation and strengthening program. Includes warm-up protocol and Day A/Day B training splits designed to build resilient, pain-free shoulders.',
  'shoulder',
  'intermediate',
  'rehab',
  2
);

-- =============================================
-- PART 3: Link Exercises to Series by Week
-- =============================================

-- Week 1 - Day A
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 1, 1, 1, 1, NULL FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Arm Circles + Scap Reset';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 1, 1, 2, 2, 15 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Banded Pull-Aparts';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 1, 1, 3, 4, 12 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'DB Bench Press';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 1, 1, 4, 4, 8 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Half-Kneeling DB OHP';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 1, 1, 5, 4, 12 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Inverted Row';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 1, 1, 6, 3, 20 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Banded External Rotation';

-- Week 1 - Day B
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 1, 2, 7, 5, 8 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Lat Pulldown';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 1, 2, 8, 4, 8 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Landmine Press';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 1, 2, 9, 4, 10 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Single-Arm DB Row';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 1, 2, 10, 3, 15 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Y-Raise';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 1, 2, 11, 3, 15 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'ITYs';

-- Week 2 - Day A (same exercises, slightly progressed)
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 2, 1, 1, 1, NULL FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Arm Circles + Scap Reset';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 2, 1, 2, 2, 15 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Banded Pull-Aparts';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 2, 1, 3, 4, 10 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'DB Bench Press';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 2, 1, 4, 4, 7 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Half-Kneeling DB OHP';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 2, 1, 5, 4, 10 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Inverted Row';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 2, 1, 6, 3, 16 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Banded External Rotation';

-- Week 2 - Day B
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 2, 2, 7, 5, 6 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Lat Pulldown';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 2, 2, 8, 4, 7 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Landmine Press';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 2, 2, 9, 4, 9 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Single-Arm DB Row';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 2, 2, 10, 3, 12 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Y-Raise';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 2, 2, 11, 3, 14 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'ITYs';

-- Week 3 - Day A
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 3, 1, 1, 4, 12 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Push-Up';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 3, 1, 2, 4, 8 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Tall-Kneeling Double DB OHP';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 3, 1, 3, 4, 12 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Chest-Supported Row';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 3, 1, 4, 3, 20 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Banded ER at 90 Degrees';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 3, 1, 5, 3, NULL FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Suitcase Carry';

-- Week 3 - Day B
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 3, 2, 6, 5, 8 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Pull-Ups';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 3, 2, 7, 4, 8 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Landmine Press';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 3, 2, 8, 4, 10 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Double-Arm DB Row';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 3, 2, 9, 3, 15 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Lateral Raises';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 3, 2, 10, 3, 15 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'YTWs';

-- Week 4 - Day A
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 4, 1, 1, 4, 10 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Push-Up';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 4, 1, 2, 4, 7 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Tall-Kneeling Double DB OHP';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 4, 1, 3, 4, 10 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Chest-Supported Row';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 4, 1, 4, 3, 16 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Banded ER at 90 Degrees';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 4, 1, 5, 3, NULL FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Suitcase Carry';

-- Week 4 - Day B
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 4, 2, 6, 5, 6 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Pull-Ups';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 4, 2, 7, 4, 7 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Landmine Press';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 4, 2, 8, 4, 9 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Double-Arm DB Row';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 4, 2, 9, 3, 12 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Lateral Raises';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 4, 2, 10, 3, 14 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'YTWs';

-- Week 5 - Day A
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 5, 1, 1, 4, 12 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Barbell Bench Press';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 5, 1, 2, 4, 8 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Standing Overhead Press';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 5, 1, 3, 4, 12 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Feet Elevated Ring Row';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 5, 1, 4, 3, NULL FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Weighted Arm Circles';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 5, 1, 5, 3, 12 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Stagger Stance Pallof Press';

-- Week 5 - Day B
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 5, 2, 6, 5, 8 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Med Ball Throwdowns';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 5, 2, 7, 4, 8 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Kneeling Landmine Press';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 5, 2, 8, 4, 10 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Banded One Arm Rows';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 5, 2, 9, 3, 15 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Shoulder Windmills';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 5, 2, 10, 3, NULL FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Shoulder ABCs on Wall';

-- Week 6 - Day A
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 6, 1, 1, 4, 10 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Barbell Bench Press';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 6, 1, 2, 4, 7 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Standing Overhead Press';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 6, 1, 3, 4, 10 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Feet Elevated Ring Row';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 6, 1, 4, 3, NULL FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Weighted Arm Circles';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 6, 1, 5, 3, 10 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Stagger Stance Pallof Press';

-- Week 6 - Day B
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 6, 2, 6, 5, 6 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Med Ball Throwdowns';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 6, 2, 7, 4, 7 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Kneeling Landmine Press';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 6, 2, 8, 4, 9 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Banded One Arm Rows';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 6, 2, 9, 3, 12 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Shoulder Windmills';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 6, 2, 10, 3, NULL FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Shoulder ABCs on Wall';

-- Week 7 - Day A
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 7, 1, 1, 4, 20 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Push-Up';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 7, 1, 2, 4, 8 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Half-Kneeling DB OHP';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 7, 1, 3, 4, 8 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'One Arm Ring Row';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 7, 1, 4, 3, 20 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Banded External Rotation';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 7, 1, 5, 3, NULL FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Plank Pull Throughs';

-- Week 7 - Day B
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 7, 2, 6, 5, 8 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Pull-Ups';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 7, 2, 7, 4, 8 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Landmine Press';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 7, 2, 8, 4, 10 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Gorilla Rows';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 7, 2, 9, 3, 5 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Turkish Get Up';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 7, 2, 10, 3, 15 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Banded ER at 90 Degrees';

-- Week 8 - Day A
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 8, 1, 1, 4, 16 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Push-Up';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 8, 1, 2, 4, 7 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Half-Kneeling DB OHP';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 8, 1, 3, 4, 10 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'One Arm Ring Row';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 8, 1, 4, 3, 16 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Banded External Rotation';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 8, 1, 5, 3, NULL FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Plank Pull Throughs';

-- Week 8 - Day B
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 8, 2, 6, 5, 6 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Pull-Ups';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 8, 2, 7, 4, 7 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Landmine Press';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 8, 2, 8, 4, 9 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Gorilla Rows';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 8, 2, 9, 3, 4 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Turkish Get Up';
INSERT INTO series_exercises (series_id, exercise_id, week_number, day_number, order_in_week, custom_sets, custom_reps)
SELECT s.id, e.id, 8, 2, 10, 3, 14 FROM series s, exercises e WHERE s.name = 'Bulletproof Shoulder Program' AND e.name = 'Banded ER at 90 Degrees';

-- =============================================
-- PART 4: Verification Queries
-- =============================================
-- Run these to verify the import worked:

-- SELECT 'New Exercises' as info, COUNT(*) as count FROM exercises WHERE tags @> ARRAY['shoulder'];
-- SELECT 'Series Created' as info, name, description, days_per_week FROM series WHERE name = 'Bulletproof Shoulder Program';
-- SELECT 'Exercise Links' as info, COUNT(*) as count FROM series_exercises WHERE series_id = (SELECT id FROM series WHERE name = 'Bulletproof Shoulder Program');
-- SELECT week_number, day_number, COUNT(*) as exercises FROM series_exercises WHERE series_id = (SELECT id FROM series WHERE name = 'Bulletproof Shoulder Program') GROUP BY week_number, day_number ORDER BY week_number, day_number;
