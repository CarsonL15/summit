-- ============================================
-- EXPANDED DEMO DATA FOR FIRE FMS
-- Spokane Valley Fire Department
-- 10 Stations, 100 People, Realistic Data
-- ============================================
-- Run this AFTER the base seed.sql

-- ============================================
-- PART 1: UPDATE/ADD STATIONS
-- All stations are part of Spokane Valley Fire Department
-- ============================================

-- First, update existing stations to Spokane Valley
UPDATE stations SET city = 'Spokane Valley', state = 'Washington', department = 'Spokane Valley Fire' WHERE name IN ('Station 1', 'Station 2');

-- Remove the police station if it exists
DELETE FROM stations WHERE department = 'police' OR name = 'Central Police';

-- Add remaining stations (3-10)
INSERT INTO stations (name, department, location, city, state) VALUES
('Station 3', 'Spokane Valley Fire', '2120 N Sullivan Rd', 'Spokane Valley', 'Washington'),
('Station 4', 'Spokane Valley Fire', '12921 E Sprague Ave', 'Spokane Valley', 'Washington'),
('Station 5', 'Spokane Valley Fire', '4114 S Bowdish Rd', 'Spokane Valley', 'Washington'),
('Station 6', 'Spokane Valley Fire', '1515 N Liberty Lake Rd', 'Spokane Valley', 'Washington'),
('Station 7', 'Spokane Valley Fire', '8415 E Trent Ave', 'Spokane Valley', 'Washington'),
('Station 8', 'Spokane Valley Fire', '2825 N Park Rd', 'Spokane Valley', 'Washington'),
('Station 9', 'Spokane Valley Fire', '15010 E Broadway Ave', 'Spokane Valley', 'Washington'),
('Station 10', 'Spokane Valley Fire', '6202 E Broadway Ave', 'Spokane Valley', 'Washington');

-- ============================================
-- PART 2: ADD USERS (Chiefs + Firefighters)
-- Each station: 1 Chief + 9 Firefighters = 10 per station
-- ============================================

-- Station 2 (currently empty)
INSERT INTO users (name, email, role, station_id, badge_number, points, current_streak, longest_streak, last_activity_date) VALUES
('Chief David Martinez', 'chief@station2.com', 'chief', (SELECT id FROM stations WHERE name = 'Station 2'), 'C002', 45, 3, 8, CURRENT_DATE - INTERVAL '1 day'),
('Carlos Ramirez', 'carlos@station2.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 2'), 'F201', 285, 12, 18, CURRENT_DATE),
('Jennifer Lee', 'jennifer@station2.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 2'), 'F202', 420, 21, 21, CURRENT_DATE),
('Marcus Johnson', 'marcus@station2.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 2'), 'F203', 95, 0, 5, CURRENT_DATE - INTERVAL '10 days'),
('Ashley Williams', 'ashley@station2.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 2'), 'F204', 310, 8, 15, CURRENT_DATE - INTERVAL '1 day'),
('Kevin O''Brien', 'kevin@station2.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 2'), 'F205', 175, 4, 12, CURRENT_DATE - INTERVAL '2 days'),
('Maria Santos', 'maria@station2.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 2'), 'F206', 560, 28, 35, CURRENT_DATE),
('Derek Thompson', 'derek@station2.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 2'), 'F207', 140, 2, 7, CURRENT_DATE - INTERVAL '3 days'),
('Nicole Brown', 'nicole@station2.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 2'), 'F208', 225, 6, 14, CURRENT_DATE - INTERVAL '1 day'),
('Ryan Mitchell', 'ryan@station2.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 2'), 'F209', 380, 15, 22, CURRENT_DATE);

-- Station 3
INSERT INTO users (name, email, role, station_id, badge_number, points, current_streak, longest_streak, last_activity_date) VALUES
('Chief Patricia Anderson', 'chief@station3.com', 'chief', (SELECT id FROM stations WHERE name = 'Station 3'), 'C003', 120, 7, 14, CURRENT_DATE - INTERVAL '1 day'),
('James Wilson', 'james@station3.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 3'), 'F301', 445, 18, 25, CURRENT_DATE),
('Samantha Clark', 'samantha@station3.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 3'), 'F302', 290, 9, 16, CURRENT_DATE - INTERVAL '2 days'),
('Michael Torres', 'michael.t@station3.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 3'), 'F303', 165, 3, 9, CURRENT_DATE - INTERVAL '4 days'),
('Elizabeth Garcia', 'elizabeth@station3.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 3'), 'F304', 510, 24, 30, CURRENT_DATE),
('Christopher White', 'chris.w@station3.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 3'), 'F305', 85, 0, 4, CURRENT_DATE - INTERVAL '15 days'),
('Amanda Rodriguez', 'amanda@station3.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 3'), 'F306', 335, 11, 19, CURRENT_DATE - INTERVAL '1 day'),
('Daniel Kim', 'daniel.k@station3.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 3'), 'F307', 195, 5, 11, CURRENT_DATE - INTERVAL '2 days'),
('Jessica Martinez', 'jessica.m@station3.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 3'), 'F308', 420, 16, 23, CURRENT_DATE),
('Brandon Davis', 'brandon@station3.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 3'), 'F309', 260, 7, 13, CURRENT_DATE - INTERVAL '3 days');

-- Station 4
INSERT INTO users (name, email, role, station_id, badge_number, points, current_streak, longest_streak, last_activity_date) VALUES
('Chief Robert Taylor', 'chief@station4.com', 'chief', (SELECT id FROM stations WHERE name = 'Station 4'), 'C004', 75, 4, 10, CURRENT_DATE - INTERVAL '2 days'),
('William Harris', 'william@station4.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 4'), 'F401', 380, 14, 20, CURRENT_DATE),
('Stephanie Moore', 'stephanie@station4.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 4'), 'F402', 215, 6, 12, CURRENT_DATE - INTERVAL '1 day'),
('Jason Allen', 'jason.a@station4.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 4'), 'F403', 490, 22, 28, CURRENT_DATE),
('Michelle Young', 'michelle@station4.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 4'), 'F404', 145, 2, 8, CURRENT_DATE - INTERVAL '5 days'),
('Andrew King', 'andrew.k@station4.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 4'), 'F405', 305, 10, 17, CURRENT_DATE - INTERVAL '1 day'),
('Laura Scott', 'laura@station4.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 4'), 'F406', 425, 17, 24, CURRENT_DATE),
('Joshua Green', 'joshua@station4.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 4'), 'F407', 110, 1, 6, CURRENT_DATE - INTERVAL '8 days'),
('Rachel Adams', 'rachel@station4.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 4'), 'F408', 275, 8, 15, CURRENT_DATE - INTERVAL '2 days'),
('Tyler Nelson', 'tyler@station4.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 4'), 'F409', 350, 12, 18, CURRENT_DATE);

-- Station 5
INSERT INTO users (name, email, role, station_id, badge_number, points, current_streak, longest_streak, last_activity_date) VALUES
('Chief Susan Campbell', 'chief@station5.com', 'chief', (SELECT id FROM stations WHERE name = 'Station 5'), 'C005', 90, 5, 12, CURRENT_DATE - INTERVAL '1 day'),
('Matthew Parker', 'matthew@station5.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 5'), 'F501', 465, 19, 26, CURRENT_DATE),
('Brittany Evans', 'brittany@station5.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 5'), 'F502', 180, 4, 10, CURRENT_DATE - INTERVAL '3 days'),
('Anthony Edwards', 'anthony@station5.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 5'), 'F503', 320, 11, 16, CURRENT_DATE - INTERVAL '1 day'),
('Megan Collins', 'megan@station5.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 5'), 'F504', 540, 25, 32, CURRENT_DATE),
('Justin Stewart', 'justin@station5.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 5'), 'F505', 95, 0, 5, CURRENT_DATE - INTERVAL '12 days'),
('Kimberly Sanchez', 'kimberly@station5.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 5'), 'F506', 245, 7, 14, CURRENT_DATE - INTERVAL '2 days'),
('Eric Morris', 'eric@station5.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 5'), 'F507', 395, 15, 21, CURRENT_DATE),
('Heather Rogers', 'heather@station5.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 5'), 'F508', 160, 3, 9, CURRENT_DATE - INTERVAL '4 days'),
('Nathan Reed', 'nathan@station5.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 5'), 'F509', 290, 9, 17, CURRENT_DATE - INTERVAL '1 day');

-- Station 6
INSERT INTO users (name, email, role, station_id, badge_number, points, current_streak, longest_streak, last_activity_date) VALUES
('Chief Thomas Cook', 'chief@station6.com', 'chief', (SELECT id FROM stations WHERE name = 'Station 6'), 'C006', 55, 2, 7, CURRENT_DATE - INTERVAL '3 days'),
('Benjamin Morgan', 'benjamin@station6.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 6'), 'F601', 410, 16, 22, CURRENT_DATE),
('Lauren Bell', 'lauren@station6.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 6'), 'F602', 230, 6, 13, CURRENT_DATE - INTERVAL '2 days'),
('Jacob Murphy', 'jacob@station6.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 6'), 'F603', 135, 1, 6, CURRENT_DATE - INTERVAL '7 days'),
('Kayla Bailey', 'kayla@station6.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 6'), 'F604', 480, 20, 27, CURRENT_DATE),
('Aaron Rivera', 'aaron@station6.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 6'), 'F605', 195, 5, 11, CURRENT_DATE - INTERVAL '3 days'),
('Christina Cooper', 'christina@station6.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 6'), 'F606', 355, 13, 19, CURRENT_DATE - INTERVAL '1 day'),
('Sean Richardson', 'sean@station6.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 6'), 'F607', 70, 0, 3, CURRENT_DATE - INTERVAL '18 days'),
('Vanessa Cox', 'vanessa@station6.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 6'), 'F608', 310, 10, 16, CURRENT_DATE),
('Trevor Howard', 'trevor@station6.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 6'), 'F609', 255, 8, 14, CURRENT_DATE - INTERVAL '2 days');

-- Station 7
INSERT INTO users (name, email, role, station_id, badge_number, points, current_streak, longest_streak, last_activity_date) VALUES
('Chief Karen Ward', 'chief@station7.com', 'chief', (SELECT id FROM stations WHERE name = 'Station 7'), 'C007', 105, 6, 11, CURRENT_DATE - INTERVAL '1 day'),
('Patrick Torres', 'patrick@station7.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 7'), 'F701', 525, 23, 29, CURRENT_DATE),
('Diana Peterson', 'diana@station7.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 7'), 'F702', 185, 4, 10, CURRENT_DATE - INTERVAL '4 days'),
('George Gray', 'george@station7.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 7'), 'F703', 340, 12, 18, CURRENT_DATE - INTERVAL '1 day'),
('Victoria Ramirez', 'victoria@station7.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 7'), 'F704', 445, 18, 24, CURRENT_DATE),
('Adam James', 'adam@station7.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 7'), 'F705', 120, 1, 7, CURRENT_DATE - INTERVAL '6 days'),
('Natalie Watson', 'natalie@station7.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 7'), 'F706', 275, 9, 15, CURRENT_DATE - INTERVAL '2 days'),
('Steven Brooks', 'steven@station7.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 7'), 'F707', 390, 14, 20, CURRENT_DATE),
('Angela Kelly', 'angela@station7.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 7'), 'F708', 205, 5, 12, CURRENT_DATE - INTERVAL '3 days'),
('Keith Sanders', 'keith@station7.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 7'), 'F709', 155, 2, 8, CURRENT_DATE - INTERVAL '5 days');

-- Station 8
INSERT INTO users (name, email, role, station_id, badge_number, points, current_streak, longest_streak, last_activity_date) VALUES
('Chief Richard Price', 'chief@station8.com', 'chief', (SELECT id FROM stations WHERE name = 'Station 8'), 'C008', 85, 4, 9, CURRENT_DATE - INTERVAL '2 days'),
('Timothy Bennett', 'timothy@station8.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 8'), 'F801', 365, 13, 19, CURRENT_DATE - INTERVAL '1 day'),
('Melissa Wood', 'melissa@station8.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 8'), 'F802', 210, 6, 13, CURRENT_DATE - INTERVAL '2 days'),
('Gregory Barnes', 'gregory@station8.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 8'), 'F803', 490, 21, 28, CURRENT_DATE),
('Rebecca Ross', 'rebecca@station8.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 8'), 'F804', 150, 2, 8, CURRENT_DATE - INTERVAL '6 days'),
('Samuel Henderson', 'samuel@station8.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 8'), 'F805', 295, 10, 16, CURRENT_DATE),
('Danielle Coleman', 'danielle@station8.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 8'), 'F806', 405, 15, 22, CURRENT_DATE - INTERVAL '1 day'),
('Raymond Jenkins', 'raymond@station8.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 8'), 'F807', 100, 0, 5, CURRENT_DATE - INTERVAL '14 days'),
('Christina Perry', 'christina.p@station8.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 8'), 'F808', 240, 7, 14, CURRENT_DATE - INTERVAL '3 days'),
('Frank Powell', 'frank@station8.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 8'), 'F809', 330, 11, 17, CURRENT_DATE);

-- Station 9
INSERT INTO users (name, email, role, station_id, badge_number, points, current_streak, longest_streak, last_activity_date) VALUES
('Chief Linda Long', 'chief@station9.com', 'chief', (SELECT id FROM stations WHERE name = 'Station 9'), 'C009', 95, 5, 10, CURRENT_DATE - INTERVAL '1 day'),
('Douglas Patterson', 'douglas@station9.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 9'), 'F901', 435, 17, 23, CURRENT_DATE),
('Catherine Hughes', 'catherine@station9.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 9'), 'F902', 175, 3, 9, CURRENT_DATE - INTERVAL '4 days'),
('Philip Flores', 'philip@station9.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 9'), 'F903', 305, 10, 16, CURRENT_DATE - INTERVAL '2 days'),
('Sandra Washington', 'sandra@station9.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 9'), 'F904', 520, 24, 31, CURRENT_DATE),
('Carl Butler', 'carl@station9.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 9'), 'F905', 130, 1, 6, CURRENT_DATE - INTERVAL '8 days'),
('Denise Simmons', 'denise@station9.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 9'), 'F906', 265, 8, 15, CURRENT_DATE - INTERVAL '1 day'),
('Larry Foster', 'larry@station9.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 9'), 'F907', 375, 14, 20, CURRENT_DATE),
('Janet Gonzales', 'janet@station9.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 9'), 'F908', 190, 4, 11, CURRENT_DATE - INTERVAL '3 days'),
('Henry Bryant', 'henry@station9.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 9'), 'F909', 280, 9, 14, CURRENT_DATE - INTERVAL '2 days');

-- Station 10
INSERT INTO users (name, email, role, station_id, badge_number, points, current_streak, longest_streak, last_activity_date) VALUES
('Chief Barbara Alexander', 'chief@station10.com', 'chief', (SELECT id FROM stations WHERE name = 'Station 10'), 'C010', 110, 6, 12, CURRENT_DATE),
('Russell Hayes', 'russell@station10.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 10'), 'F1001', 455, 19, 25, CURRENT_DATE),
('Cynthia Griffin', 'cynthia@station10.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 10'), 'F1002', 200, 5, 12, CURRENT_DATE - INTERVAL '2 days'),
('Eugene Diaz', 'eugene@station10.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 10'), 'F1003', 345, 12, 18, CURRENT_DATE - INTERVAL '1 day'),
('Gloria Hayes', 'gloria@station10.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 10'), 'F1004', 495, 22, 29, CURRENT_DATE),
('Wayne Myers', 'wayne@station10.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 10'), 'F1005', 115, 1, 5, CURRENT_DATE - INTERVAL '9 days'),
('Teresa Ford', 'teresa@station10.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 10'), 'F1006', 250, 7, 13, CURRENT_DATE - INTERVAL '3 days'),
('Louis Hamilton', 'louis@station10.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 10'), 'F1007', 385, 14, 21, CURRENT_DATE),
('Dorothy Graham', 'dorothy@station10.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 10'), 'F1008', 165, 2, 8, CURRENT_DATE - INTERVAL '5 days'),
('Roy Sullivan', 'roy@station10.com', 'firefighter', (SELECT id FROM stations WHERE name = 'Station 10'), 'F1009', 315, 11, 17, CURRENT_DATE - INTERVAL '1 day');

-- ============================================
-- PART 3: FMS SCORES FOR ALL NEW USERS
-- Using the actual schema: deep_squat, hurdle_step, inline_lunge,
-- shoulder_mobility, aslr, trunk_stability, rotary_stability (single values)
-- ============================================

-- Station 2 FMS Scores
INSERT INTO fms_scores (user_id, assessed_by, assessed_date, total_score, deep_squat, hurdle_step, inline_lunge, shoulder_mobility, aslr, trunk_stability, rotary_stability, weak_areas, notes)
SELECT u.id, (SELECT id FROM users WHERE email = 'chief@station2.com'), CURRENT_DATE - INTERVAL '45 days', 17, 3, 2, 2, 3, 2, 3, 2, '{"areas": ["hurdle_step", "inline_lunge"]}', 'Good overall movement quality'
FROM users u WHERE u.email = 'carlos@station2.com';

INSERT INTO fms_scores (user_id, assessed_by, assessed_date, total_score, deep_squat, hurdle_step, inline_lunge, shoulder_mobility, aslr, trunk_stability, rotary_stability, weak_areas, notes)
SELECT u.id, (SELECT id FROM users WHERE email = 'chief@station2.com'), CURRENT_DATE - INTERVAL '30 days', 19, 3, 3, 3, 3, 3, 2, 2, '{"areas": ["trunk_stability"]}', 'Excellent movement patterns'
FROM users u WHERE u.email = 'jennifer@station2.com';

INSERT INTO fms_scores (user_id, assessed_by, assessed_date, total_score, deep_squat, hurdle_step, inline_lunge, shoulder_mobility, aslr, trunk_stability, rotary_stability, weak_areas, notes)
SELECT u.id, (SELECT id FROM users WHERE email = 'chief@station2.com'), CURRENT_DATE - INTERVAL '60 days', 12, 2, 2, 1, 2, 2, 2, 1, '{"areas": ["inline_lunge", "rotary_stability"]}', 'HIGH RISK - Multiple areas of concern'
FROM users u WHERE u.email = 'marcus@station2.com';

INSERT INTO fms_scores (user_id, assessed_by, assessed_date, total_score, deep_squat, hurdle_step, inline_lunge, shoulder_mobility, aslr, trunk_stability, rotary_stability, weak_areas, notes)
SELECT u.id, (SELECT id FROM users WHERE email = 'chief@station2.com'), CURRENT_DATE - INTERVAL '40 days', 16, 2, 3, 2, 2, 3, 2, 2, '{"areas": ["deep_squat", "shoulder_mobility"]}', 'Moderate - focus on mobility'
FROM users u WHERE u.email = 'ashley@station2.com';

INSERT INTO fms_scores (user_id, assessed_by, assessed_date, total_score, deep_squat, hurdle_step, inline_lunge, shoulder_mobility, aslr, trunk_stability, rotary_stability, weak_areas, notes)
SELECT u.id, (SELECT id FROM users WHERE email = 'chief@station2.com'), CURRENT_DATE - INTERVAL '55 days', 14, 2, 2, 2, 2, 2, 2, 2, '{"areas": ["all"]}', 'Borderline - needs improvement in all areas'
FROM users u WHERE u.email = 'kevin@station2.com';

INSERT INTO fms_scores (user_id, assessed_by, assessed_date, total_score, deep_squat, hurdle_step, inline_lunge, shoulder_mobility, aslr, trunk_stability, rotary_stability, weak_areas, notes)
SELECT u.id, (SELECT id FROM users WHERE email = 'chief@station2.com'), CURRENT_DATE - INTERVAL '20 days', 20, 3, 3, 3, 3, 3, 3, 2, '{"areas": ["rotary_stability"]}', 'Outstanding - role model for station'
FROM users u WHERE u.email = 'maria@station2.com';

INSERT INTO fms_scores (user_id, assessed_by, assessed_date, total_score, deep_squat, hurdle_step, inline_lunge, shoulder_mobility, aslr, trunk_stability, rotary_stability, weak_areas, notes)
SELECT u.id, (SELECT id FROM users WHERE email = 'chief@station2.com'), CURRENT_DATE - INTERVAL '50 days', 13, 2, 2, 1, 2, 2, 2, 2, '{"areas": ["inline_lunge"]}', 'HIGH RISK - Lower body weakness'
FROM users u WHERE u.email = 'derek@station2.com';

INSERT INTO fms_scores (user_id, assessed_by, assessed_date, total_score, deep_squat, hurdle_step, inline_lunge, shoulder_mobility, aslr, trunk_stability, rotary_stability, weak_areas, notes)
SELECT u.id, (SELECT id FROM users WHERE email = 'chief@station2.com'), CURRENT_DATE - INTERVAL '35 days', 15, 2, 2, 2, 3, 2, 2, 2, '{"areas": ["deep_squat", "hurdle_step"]}', 'Moderate - shoulder mobility is strength'
FROM users u WHERE u.email = 'nicole@station2.com';

INSERT INTO fms_scores (user_id, assessed_by, assessed_date, total_score, deep_squat, hurdle_step, inline_lunge, shoulder_mobility, aslr, trunk_stability, rotary_stability, weak_areas, notes)
SELECT u.id, (SELECT id FROM users WHERE email = 'chief@station2.com'), CURRENT_DATE - INTERVAL '25 days', 18, 3, 3, 2, 3, 3, 2, 2, '{"areas": ["inline_lunge", "trunk_stability"]}', 'Good movement quality'
FROM users u WHERE u.email = 'ryan@station2.com';

-- Station 3 FMS Scores
INSERT INTO fms_scores (user_id, assessed_by, assessed_date, total_score, deep_squat, hurdle_step, inline_lunge, shoulder_mobility, aslr, trunk_stability, rotary_stability, weak_areas, notes)
SELECT u.id, (SELECT id FROM users WHERE email = 'chief@station3.com'), CURRENT_DATE - INTERVAL '30 days', 18, 3, 3, 2, 3, 3, 2, 2, '{"areas": []}', 'Strong performance'
FROM users u WHERE u.email = 'james@station3.com';

INSERT INTO fms_scores (user_id, assessed_by, assessed_date, total_score, deep_squat, hurdle_step, inline_lunge, shoulder_mobility, aslr, trunk_stability, rotary_stability, weak_areas, notes)
SELECT u.id, (SELECT id FROM users WHERE email = 'chief@station3.com'), CURRENT_DATE - INTERVAL '45 days', 16, 2, 3, 2, 2, 3, 2, 2, '{"areas": ["deep_squat"]}', 'Moderate risk'
FROM users u WHERE u.email = 'samantha@station3.com';

INSERT INTO fms_scores (user_id, assessed_by, assessed_date, total_score, deep_squat, hurdle_step, inline_lunge, shoulder_mobility, aslr, trunk_stability, rotary_stability, weak_areas, notes)
SELECT u.id, (SELECT id FROM users WHERE email = 'chief@station3.com'), CURRENT_DATE - INTERVAL '60 days', 11, 1, 2, 1, 2, 2, 2, 1, '{"areas": ["deep_squat", "inline_lunge", "rotary_stability"]}', 'CRITICAL - needs immediate attention'
FROM users u WHERE u.email = 'michael.t@station3.com';

INSERT INTO fms_scores (user_id, assessed_by, assessed_date, total_score, deep_squat, hurdle_step, inline_lunge, shoulder_mobility, aslr, trunk_stability, rotary_stability, weak_areas, notes)
SELECT u.id, (SELECT id FROM users WHERE email = 'chief@station3.com'), CURRENT_DATE - INTERVAL '25 days', 20, 3, 3, 3, 3, 3, 3, 2, '{"areas": []}', 'Excellent'
FROM users u WHERE u.email = 'elizabeth@station3.com';

INSERT INTO fms_scores (user_id, assessed_by, assessed_date, total_score, deep_squat, hurdle_step, inline_lunge, shoulder_mobility, aslr, trunk_stability, rotary_stability, weak_areas, notes)
SELECT u.id, (SELECT id FROM users WHERE email = 'chief@station3.com'), CURRENT_DATE - INTERVAL '75 days', 10, 1, 1, 1, 2, 2, 2, 1, '{"areas": ["deep_squat", "hurdle_step", "inline_lunge"]}', 'HIGH RISK - multiple limitations'
FROM users u WHERE u.email = 'chris.w@station3.com';

INSERT INTO fms_scores (user_id, assessed_by, assessed_date, total_score, deep_squat, hurdle_step, inline_lunge, shoulder_mobility, aslr, trunk_stability, rotary_stability, weak_areas, notes)
SELECT u.id, (SELECT id FROM users WHERE email = 'chief@station3.com'), CURRENT_DATE - INTERVAL '35 days', 17, 2, 3, 2, 3, 3, 2, 2, '{"areas": ["deep_squat"]}', 'Good overall'
FROM users u WHERE u.email = 'amanda@station3.com';

INSERT INTO fms_scores (user_id, assessed_by, assessed_date, total_score, deep_squat, hurdle_step, inline_lunge, shoulder_mobility, aslr, trunk_stability, rotary_stability, weak_areas, notes)
SELECT u.id, (SELECT id FROM users WHERE email = 'chief@station3.com'), CURRENT_DATE - INTERVAL '40 days', 15, 2, 2, 2, 2, 3, 2, 2, '{"areas": ["shoulder_mobility"]}', 'Moderate'
FROM users u WHERE u.email = 'daniel.k@station3.com';

INSERT INTO fms_scores (user_id, assessed_by, assessed_date, total_score, deep_squat, hurdle_step, inline_lunge, shoulder_mobility, aslr, trunk_stability, rotary_stability, weak_areas, notes)
SELECT u.id, (SELECT id FROM users WHERE email = 'chief@station3.com'), CURRENT_DATE - INTERVAL '20 days', 19, 3, 3, 3, 2, 3, 3, 2, '{"areas": []}', 'Very good'
FROM users u WHERE u.email = 'jessica.m@station3.com';

INSERT INTO fms_scores (user_id, assessed_by, assessed_date, total_score, deep_squat, hurdle_step, inline_lunge, shoulder_mobility, aslr, trunk_stability, rotary_stability, weak_areas, notes)
SELECT u.id, (SELECT id FROM users WHERE email = 'chief@station3.com'), CURRENT_DATE - INTERVAL '50 days', 14, 2, 2, 2, 2, 2, 2, 2, '{"areas": ["all"]}', 'Borderline - needs work'
FROM users u WHERE u.email = 'brandon@station3.com';

-- Stations 4-10: Bulk insert FMS scores with varied values
-- Using a pattern: high points users get higher FMS, low points users get lower FMS

INSERT INTO fms_scores (user_id, assessed_by, assessed_date, total_score, deep_squat, hurdle_step, inline_lunge, shoulder_mobility, aslr, trunk_stability, rotary_stability, weak_areas, notes)
SELECT
  u.id,
  (SELECT id FROM users WHERE role = 'chief' AND station_id = u.station_id LIMIT 1),
  CURRENT_DATE - (30 + (RANDOM() * 60)::int) * INTERVAL '1 day',
  CASE
    WHEN u.points > 400 THEN 17 + (RANDOM() * 4)::int
    WHEN u.points > 250 THEN 15 + (RANDOM() * 3)::int
    WHEN u.points > 150 THEN 13 + (RANDOM() * 3)::int
    ELSE 10 + (RANDOM() * 4)::int
  END,
  CASE WHEN RANDOM() > 0.3 THEN 3 ELSE 2 END,
  CASE WHEN RANDOM() > 0.4 THEN 3 ELSE 2 END,
  CASE WHEN RANDOM() > 0.5 THEN 2 ELSE 1 END,
  CASE WHEN RANDOM() > 0.3 THEN 3 ELSE 2 END,
  CASE WHEN RANDOM() > 0.4 THEN 3 ELSE 2 END,
  CASE WHEN RANDOM() > 0.5 THEN 2 ELSE 3 END,
  CASE WHEN RANDOM() > 0.5 THEN 2 ELSE 1 END,
  '{"areas": []}',
  'Assessment complete'
FROM users u
WHERE u.role = 'firefighter'
  AND u.station_id IN (SELECT id FROM stations WHERE name IN ('Station 4', 'Station 5', 'Station 6', 'Station 7', 'Station 8', 'Station 9', 'Station 10'));

-- ============================================
-- PART 4: SERIES ASSIGNMENTS
-- Assign series to ~60% of users who have been assessed
-- ============================================

INSERT INTO series_assignments (user_id, series_id, assigned_by, start_date, end_date, current_week, completion_percentage, completed, points_earned)
SELECT
  u.id,
  (SELECT id FROM series ORDER BY RANDOM() LIMIT 1),
  (SELECT id FROM users WHERE role = 'chief' AND station_id = u.station_id LIMIT 1),
  CURRENT_DATE - (RANDOM() * 14)::int * INTERVAL '1 day',
  CURRENT_DATE + (21 - (RANDOM() * 14)::int) * INTERVAL '1 day',
  CASE WHEN RANDOM() > 0.6 THEN 2 WHEN RANDOM() > 0.3 THEN 1 ELSE 3 END,
  (RANDOM() * 80 + 10)::int,
  CASE WHEN RANDOM() > 0.85 THEN TRUE ELSE FALSE END,
  (RANDOM() * 100)::int
FROM users u
WHERE u.role = 'firefighter'
  AND u.station_id IN (SELECT id FROM stations WHERE name IN ('Station 2', 'Station 3', 'Station 4', 'Station 5', 'Station 6', 'Station 7', 'Station 8', 'Station 9', 'Station 10'))
  AND RANDOM() > 0.4;

-- ============================================
-- PART 5: INJURIES (Realistic distribution)
-- ~15% injury rate, correlated with FMS scores
-- ============================================

-- Closed injuries (past injuries, returned to duty)
INSERT INTO injuries (user_id, injury_type, body_location, injury_date, days_out, return_date, fms_score_at_time, followed_protocol, severity, status, cost_impact, notes)
SELECT
  f.user_id,
  (ARRAY['Shoulder Strain', 'Lower Back Strain', 'Knee Sprain', 'Ankle Sprain', 'Hip Flexor Strain'])[1 + (RANDOM() * 4)::int],
  (ARRAY['Shoulder', 'Back - Lower', 'Knee', 'Ankle', 'Hip'])[1 + (RANDOM() * 4)::int],
  CURRENT_DATE - (30 + (RANDOM() * 60)::int) * INTERVAL '1 day',
  (5 + (RANDOM() * 10)::int),
  CURRENT_DATE - (10 + (RANDOM() * 20)::int) * INTERVAL '1 day',
  f.total_score,
  CASE WHEN RANDOM() > 0.6 THEN TRUE ELSE FALSE END,
  CASE WHEN f.total_score < 13 THEN 'moderate' ELSE 'minor' END,
  'closed',
  (1500 + (RANDOM() * 4000))::numeric(10,2),
  'Recovered and returned to duty'
FROM fms_scores f
WHERE f.total_score < 16
  AND RANDOM() > 0.7
LIMIT 15;

-- Active injuries (currently out)
INSERT INTO injuries (user_id, injury_type, body_location, injury_date, days_out, return_date, fms_score_at_time, followed_protocol, severity, status, cost_impact, notes)
SELECT
  f.user_id,
  (ARRAY['Rotator Cuff Strain', 'Lumbar Strain', 'Hamstring Pull', 'Calf Strain', 'Quad Strain'])[1 + (RANDOM() * 4)::int],
  (ARRAY['Shoulder', 'Back - Lower', 'Hamstring', 'Calf', 'Quadricep'])[1 + (RANDOM() * 4)::int],
  CURRENT_DATE - (3 + (RANDOM() * 10)::int) * INTERVAL '1 day',
  (7 + (RANDOM() * 14)::int),
  NULL,
  f.total_score,
  FALSE,
  CASE WHEN f.total_score < 13 THEN 'severe' ELSE 'moderate' END,
  'active',
  (2500 + (RANDOM() * 5000))::numeric(10,2),
  'Currently out - monitoring recovery'
FROM fms_scores f
WHERE f.total_score < 15
  AND RANDOM() > 0.85
LIMIT 5;

-- ============================================
-- PART 6: USER ACHIEVEMENTS
-- Distribute achievements based on user stats
-- ============================================

-- First Steps achievement for everyone with points
INSERT INTO user_achievements (user_id, achievement_id, earned_at)
SELECT u.id, a.id, CURRENT_DATE - (30 + (RANDOM() * 60)::int) * INTERVAL '1 day'
FROM users u
CROSS JOIN achievements a
WHERE u.points > 0
  AND a.name = 'First Steps'
  AND u.role = 'firefighter'
  AND u.station_id IN (SELECT id FROM stations WHERE name LIKE 'Station%')
ON CONFLICT DO NOTHING;

-- Week Warrior for users with 7+ day streaks
INSERT INTO user_achievements (user_id, achievement_id, earned_at)
SELECT u.id, a.id, CURRENT_DATE - (20 + (RANDOM() * 40)::int) * INTERVAL '1 day'
FROM users u
CROSS JOIN achievements a
WHERE u.longest_streak >= 7
  AND a.name = 'Week Warrior'
  AND u.role = 'firefighter'
ON CONFLICT DO NOTHING;

-- Century Mark for users with 100+ points
INSERT INTO user_achievements (user_id, achievement_id, earned_at)
SELECT u.id, a.id, CURRENT_DATE - (15 + (RANDOM() * 30)::int) * INTERVAL '1 day'
FROM users u
CROSS JOIN achievements a
WHERE u.points >= 100
  AND a.name = 'Century Mark'
  AND u.role = 'firefighter'
ON CONFLICT DO NOTHING;

-- Quarter K for users with 250+ points
INSERT INTO user_achievements (user_id, achievement_id, earned_at)
SELECT u.id, a.id, CURRENT_DATE - (10 + (RANDOM() * 20)::int) * INTERVAL '1 day'
FROM users u
CROSS JOIN achievements a
WHERE u.points >= 250
  AND a.name = 'Quarter K'
  AND u.role = 'firefighter'
ON CONFLICT DO NOTHING;

-- Half K Hero for users with 500+ points
INSERT INTO user_achievements (user_id, achievement_id, earned_at)
SELECT u.id, a.id, CURRENT_DATE - (RANDOM() * 14)::int * INTERVAL '1 day'
FROM users u
CROSS JOIN achievements a
WHERE u.points >= 500
  AND a.name = 'Half K Hero'
  AND u.role = 'firefighter'
ON CONFLICT DO NOTHING;

-- ============================================
-- SUMMARY QUERY
-- ============================================
SELECT 'Stations' as entity, COUNT(*) as count FROM stations
UNION ALL SELECT 'Total Users', COUNT(*) FROM users
UNION ALL SELECT 'Chiefs', COUNT(*) FROM users WHERE role = 'chief'
UNION ALL SELECT 'Firefighters', COUNT(*) FROM users WHERE role = 'firefighter'
UNION ALL SELECT 'FMS Assessments', COUNT(*) FROM fms_scores
UNION ALL SELECT 'Series Assignments', COUNT(*) FROM series_assignments
UNION ALL SELECT 'Total Injuries', COUNT(*) FROM injuries
UNION ALL SELECT 'Active Injuries', COUNT(*) FROM injuries WHERE status = 'active'
UNION ALL SELECT 'User Achievements', COUNT(*) FROM user_achievements;
