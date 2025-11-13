-- Seed data for exercises based on FMS corrective exercises
-- These exercises target specific movement patterns

-- Deep Squat Corrective Exercises
INSERT INTO exercises (name, category, description, duration_seconds, sets, reps) VALUES
('Goblet Squat', 'Deep Squat', 'Hold a weight at chest level and perform a controlled squat focusing on depth and form', 45, 3, 10),
('Wall Squat', 'Deep Squat', 'Stand with back against wall, slide down into squat position and hold', 30, 3, 8),
('Ankle Mobility Drill', 'Deep Squat', 'Place foot against wall, lean forward to stretch ankle maintaining heel contact', 30, 2, 10),
('Hip Flexor Stretch', 'Deep Squat', 'Kneel on one knee, push hips forward to stretch hip flexor', 30, 2, 10);

-- Hurdle Step Corrective Exercises
INSERT INTO exercises (name, category, description, duration_seconds, sets, reps) VALUES
('Single Leg Deadlift', 'Hurdle Step', 'Balance on one leg while hinging at hip, opposite leg extends behind', 45, 3, 8),
('High Knee March', 'Hurdle Step', 'March in place bringing knees to hip level with control', 30, 3, 20),
('Hip Flexor Activation', 'Hurdle Step', 'Lying on back, bring one knee to chest while keeping other leg straight', 30, 3, 10),
('Standing Hip Circles', 'Hurdle Step', 'Stand on one leg, make controlled circles with opposite leg', 30, 2, 10);

-- Inline Lunge Corrective Exercises
INSERT INTO exercises (name, category, description, duration_seconds, sets, reps) VALUES
('Split Squat', 'Inline Lunge', 'Rear foot elevated, lower into lunge position with control', 45, 3, 10),
('Reverse Lunge', 'Inline Lunge', 'Step back into lunge position, return to standing', 45, 3, 10),
('Lateral Lunge', 'Inline Lunge', 'Step to the side, sit back into lunge on one leg', 45, 3, 10),
('Bulgarian Split Squat', 'Inline Lunge', 'Rear foot on bench, perform single leg squat', 45, 3, 8);

-- Shoulder Mobility Corrective Exercises
INSERT INTO exercises (name, category, description, duration_seconds, sets, reps) VALUES
('Shoulder Dislocations', 'Shoulder Mobility', 'Hold resistance band wide, bring over head and behind back', 30, 3, 10),
('Wall Angels', 'Shoulder Mobility', 'Back against wall, move arms up and down maintaining contact', 30, 3, 15),
('Doorway Stretch', 'Shoulder Mobility', 'Place arm on doorframe, step forward to stretch chest', 30, 2, 30),
('Band Pull-Aparts', 'Shoulder Mobility', 'Hold band at chest level, pull apart squeezing shoulder blades', 30, 3, 15);

-- Active Straight Leg Raise Corrective Exercises
INSERT INTO exercises (name, category, description, duration_seconds, sets, reps) VALUES
('Hamstring Stretch', 'ASLR', 'Lying on back, use strap to pull straight leg up', 45, 2, 10),
('Dead Bug', 'ASLR', 'Lying on back, opposite arm and leg extensions with control', 30, 3, 10),
('Leg Lowers', 'ASLR', 'Lying on back, slowly lower straight leg from vertical', 30, 3, 10),
('Hip Flexor March', 'ASLR', 'Lying position, alternate bringing knees to chest', 30, 3, 10);

-- Trunk Stability Push-Up Corrective Exercises
INSERT INTO exercises (name, category, description, duration_seconds, sets, reps) VALUES
('Plank', 'Trunk Stability', 'Hold plank position with neutral spine', 30, 3, 1),
('Bird Dog', 'Trunk Stability', 'On hands and knees, extend opposite arm and leg', 30, 3, 10),
('Modified Push-Up', 'Trunk Stability', 'Push-up from knees maintaining straight line from head to knees', 30, 3, 10),
('Side Plank', 'Trunk Stability', 'Hold side plank position on elbow', 20, 3, 1);

-- Rotary Stability Corrective Exercises
INSERT INTO exercises (name, category, description, duration_seconds, sets, reps) VALUES
('Bear Crawl', 'Rotary Stability', 'Crawl forward on hands and feet maintaining neutral spine', 30, 3, 10),
('Pallof Press', 'Rotary Stability', 'Hold band at chest, press out resisting rotation', 30, 3, 10),
('Half-Kneeling Chop', 'Rotary Stability', 'In half-kneeling position, perform diagonal chop motion', 30, 3, 10),
('Rolling Patterns', 'Rotary Stability', 'Practice rolling from back to stomach using only upper or lower body', 30, 3, 5);

-- General Mobility Exercises
INSERT INTO exercises (name, category, description, duration_seconds, sets, reps) VALUES
('Cat-Cow Stretch', 'General Mobility', 'On hands and knees, alternate between arching and rounding spine', 30, 3, 10),
('Thread the Needle', 'General Mobility', 'From hands and knees, thread one arm under body for thoracic rotation', 30, 2, 10),
('90/90 Hip Stretch', 'General Mobility', 'Sit with both legs at 90 degrees, lean forward over front leg', 30, 2, 30),
('Foam Roll IT Band', 'General Mobility', 'Use foam roller on outside of thigh from hip to knee', 30, 2, 10);

-- Stability and Core Exercises
INSERT INTO exercises (name, category, description, duration_seconds, sets, reps) VALUES
('Glute Bridge', 'Stability', 'Lying on back, lift hips squeezing glutes', 30, 3, 15),
('Clamshells', 'Stability', 'Side-lying, keep feet together and open knees', 30, 3, 15),
('Single Leg Glute Bridge', 'Stability', 'Glute bridge with one leg extended', 30, 3, 10),
('Quadruped Hip Extension', 'Stability', 'On hands and knees, extend one leg back keeping hips level', 30, 3, 10);