-- ========================================
-- UPDATE EXERCISE VIDEO URLS
-- ========================================
-- Run this in Supabase SQL Editor

-- 1. Dumbbell Bench Press
UPDATE exercises SET video_url = 'https://youtu.be/-1-7vB6oZmM' WHERE name = 'DB Bench Press';

-- 2. Half Kneeling Overhead Press
UPDATE exercises SET video_url = 'https://youtu.be/3tHjFU4c7f8' WHERE name = 'Half-Kneeling DB OHP';

-- 3. Farmers Carry
UPDATE exercises SET video_url = 'https://youtu.be/vWk_fVI5te0' WHERE name = 'Farmers Carry';

-- 4. One Arm Row (applies to multiple similar exercises)
UPDATE exercises SET video_url = 'https://youtu.be/y628oa_ML-U' WHERE name = 'One Arm Ring Row';
UPDATE exercises SET video_url = 'https://youtu.be/y628oa_ML-U' WHERE name = 'Banded One Arm Rows';

-- 5. Inverted Row
UPDATE exercises SET video_url = 'https://youtu.be/iFojnbg4MOI' WHERE name = 'Inverted Row';
UPDATE exercises SET video_url = 'https://youtu.be/iFojnbg4MOI' WHERE name = 'Feet Elevated Ring Row';

-- 6. Banded External Rotation (applies to both variations)
UPDATE exercises SET video_url = 'https://youtu.be/xQcio5oGo70' WHERE name = 'Banded External Rotation';
UPDATE exercises SET video_url = 'https://youtu.be/xQcio5oGo70' WHERE name = 'Banded ER at 90 Degrees';

-- 7. Banded IYT
UPDATE exercises SET video_url = 'https://youtu.be/xXPugkonfuE' WHERE name = 'ITYs';
UPDATE exercises SET video_url = 'https://youtu.be/xXPugkonfuE' WHERE name = 'YTWs';

-- 8. Lat Pulldowns
UPDATE exercises SET video_url = 'https://youtu.be/dUhwKH8dItY' WHERE name = 'Lat Pulldown';

-- 9. Single Arm Landmine Press (applies to both variations)
UPDATE exercises SET video_url = 'https://youtu.be/KNed-596JdI' WHERE name = 'Landmine Press';
UPDATE exercises SET video_url = 'https://youtu.be/KNed-596JdI' WHERE name = 'Kneeling Landmine Press';

-- ========================================
-- VERIFICATION
-- ========================================
SELECT name, video_url FROM exercises WHERE video_url IS NOT NULL ORDER BY name;
