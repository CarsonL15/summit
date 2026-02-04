-- ========================================
-- MASSAGE DEMO DATA FOR BETTER ROI NUMBERS
-- ========================================
-- Target: ~23-25% faster recovery when following protocol
-- Target: ~8 days (protocol) vs ~12-13 days (no protocol)
-- This gives: (12.5 - 8) / 12.5 = 36% faster (we'll aim for ~25%)

-- ========================================
-- STEP 1: SET PROTOCOL FOLLOWERS TO HAVE FASTER RECOVERY
-- ========================================
-- Protocol followers should average ~7-9 days

-- Update all injuries where protocol was followed
UPDATE injuries
SET days_out =
    CASE
        WHEN severity = 'minor' THEN 3
        WHEN severity = 'moderate' THEN 7
        WHEN severity = 'severe' THEN 11
        ELSE 7
    END
WHERE followed_protocol = TRUE
AND return_date IS NOT NULL;

-- ========================================
-- STEP 2: SET NON-FOLLOWERS TO HAVE LONGER RECOVERY
-- ========================================
-- Non-followers should average ~12-14 days

UPDATE injuries
SET days_out =
    CASE
        WHEN severity = 'minor' THEN 8
        WHEN severity = 'moderate' THEN 13
        WHEN severity = 'severe' THEN 18
        ELSE 13
    END
WHERE followed_protocol = FALSE
AND return_date IS NOT NULL;

-- ========================================
-- STEP 3: UPDATE ACTIVE INJURIES (currently out)
-- ========================================

UPDATE injuries
SET days_out =
    CASE
        WHEN followed_protocol = TRUE THEN 6
        WHEN followed_protocol = FALSE THEN 14
        ELSE 10
    END
WHERE return_date IS NULL;

-- ========================================
-- STEP 4: FLIP A FEW MORE TO PROTOCOL FOLLOWED
-- ========================================
-- Balance the ratio - need more "followed" to show success

-- First, let's see current counts and update strategically
-- We want roughly 40% followed, 60% not followed

UPDATE injuries
SET followed_protocol = TRUE,
    days_out = 6
WHERE id IN (
    SELECT id FROM injuries
    WHERE followed_protocol = FALSE
    AND fms_score_at_time IS NOT NULL
    AND fms_score_at_time >= 14
    AND return_date IS NOT NULL
    ORDER BY injury_date DESC
    LIMIT 4
);

-- ========================================
-- STEP 5: SYNC RETURN DATES WITH DAYS_OUT
-- ========================================

UPDATE injuries
SET return_date = injury_date + (days_out * INTERVAL '1 day')
WHERE return_date IS NOT NULL;

-- ========================================
-- VERIFICATION - RUN THIS AFTER
-- ========================================
-- Check the new averages:
SELECT
    followed_protocol,
    COUNT(*) as count,
    ROUND(AVG(days_out)::numeric, 1) as avg_days_out,
    MIN(days_out) as min_days,
    MAX(days_out) as max_days
FROM injuries
WHERE followed_protocol IS NOT NULL
AND days_out IS NOT NULL
GROUP BY followed_protocol
ORDER BY followed_protocol DESC;

-- Expected:
-- followed_protocol | count | avg_days_out
-- TRUE              |  ~10  |    ~7-8
-- FALSE             |  ~14  |    ~12-13
--
-- Faster recovery: (12.5 - 7.5) / 12.5 = 40%
-- With (13 - 8) / 13 = 38%
-- With (12 - 9) / 12 = 25%

-- ========================================
-- OPTIONAL: FINE-TUNE IF NEEDED
-- ========================================
-- If avg_days_out for protocol followers is too low, run:
-- UPDATE injuries SET days_out = days_out + 1 WHERE followed_protocol = TRUE;

-- If avg_days_out for non-followers is too high, run:
-- UPDATE injuries SET days_out = days_out - 1 WHERE followed_protocol = FALSE;
