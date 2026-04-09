-- FMS Assessment Overhaul: Add clearing tests, per-side pain, and mobility scores
-- Run this in Supabase SQL Editor

-- Raw L/R score columns (store the 1-3 values as entered, before any pain/clearing zeroing)
ALTER TABLE fms_scores
  ADD COLUMN deep_squat_raw INTEGER CHECK (deep_squat_raw >= 1 AND deep_squat_raw <= 3),
  ADD COLUMN hurdle_step_left INTEGER CHECK (hurdle_step_left >= 1 AND hurdle_step_left <= 3),
  ADD COLUMN hurdle_step_right INTEGER CHECK (hurdle_step_right >= 1 AND hurdle_step_right <= 3),
  ADD COLUMN inline_lunge_left INTEGER CHECK (inline_lunge_left >= 1 AND inline_lunge_left <= 3),
  ADD COLUMN inline_lunge_right INTEGER CHECK (inline_lunge_right >= 1 AND inline_lunge_right <= 3),
  ADD COLUMN shoulder_mobility_left INTEGER CHECK (shoulder_mobility_left >= 1 AND shoulder_mobility_left <= 3),
  ADD COLUMN shoulder_mobility_right INTEGER CHECK (shoulder_mobility_right >= 1 AND shoulder_mobility_right <= 3),
  ADD COLUMN aslr_left INTEGER CHECK (aslr_left >= 1 AND aslr_left <= 3),
  ADD COLUMN aslr_right INTEGER CHECK (aslr_right >= 1 AND aslr_right <= 3),
  ADD COLUMN trunk_stability_raw INTEGER CHECK (trunk_stability_raw >= 1 AND trunk_stability_raw <= 3),
  ADD COLUMN rotary_stability_left INTEGER CHECK (rotary_stability_left >= 1 AND rotary_stability_left <= 3),
  ADD COLUMN rotary_stability_right INTEGER CHECK (rotary_stability_right >= 1 AND rotary_stability_right <= 3);

-- Per-side pain flags (14 total: 2 per movement × 7 movements)
ALTER TABLE fms_scores
  ADD COLUMN deep_squat_pain_left BOOLEAN DEFAULT false,
  ADD COLUMN deep_squat_pain_right BOOLEAN DEFAULT false,
  ADD COLUMN hurdle_step_pain_left BOOLEAN DEFAULT false,
  ADD COLUMN hurdle_step_pain_right BOOLEAN DEFAULT false,
  ADD COLUMN inline_lunge_pain_left BOOLEAN DEFAULT false,
  ADD COLUMN inline_lunge_pain_right BOOLEAN DEFAULT false,
  ADD COLUMN shoulder_mobility_pain_left BOOLEAN DEFAULT false,
  ADD COLUMN shoulder_mobility_pain_right BOOLEAN DEFAULT false,
  ADD COLUMN aslr_pain_left BOOLEAN DEFAULT false,
  ADD COLUMN aslr_pain_right BOOLEAN DEFAULT false,
  ADD COLUMN trunk_stability_pain_left BOOLEAN DEFAULT false,
  ADD COLUMN trunk_stability_pain_right BOOLEAN DEFAULT false,
  ADD COLUMN rotary_stability_pain_left BOOLEAN DEFAULT false,
  ADD COLUMN rotary_stability_pain_right BOOLEAN DEFAULT false;

-- Clearing test results (true = pass, false = fail, null = not recorded)
ALTER TABLE fms_scores
  ADD COLUMN clearing_ankle BOOLEAN,
  ADD COLUMN clearing_shoulder BOOLEAN,
  ADD COLUMN clearing_extension BOOLEAN,
  ADD COLUMN clearing_flexion BOOLEAN;

-- Mobility scores (sum of raw scores, unaffected by pain/clearing)
ALTER TABLE fms_scores
  ADD COLUMN left_mobility_score INTEGER,
  ADD COLUMN right_mobility_score INTEGER;
