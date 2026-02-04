-- Fix Bulletproof Shoulder Program settings
-- It's a rehab program with 2 days/week (Day A/Day B split) for 8 weeks

UPDATE series
SET days_per_week = 2,
    duration_weeks = 8
WHERE name = 'Bulletproof Shoulder Program';

-- Verify the update
SELECT name, series_type, days_per_week, duration_weeks FROM series WHERE name = 'Bulletproof Shoulder Program';
