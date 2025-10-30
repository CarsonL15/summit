-- First, create a test clinic
INSERT INTO clinics (id, name, address, phone)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Test Clinic', '123 Test Street', '555-0100')
ON CONFLICT (id) DO NOTHING;

-- Create test users directly (you'll need to sign up through the app first to get auth users)
-- After signing up, run this to fix their profiles:

-- Fix for any users that failed to create profiles
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Loop through auth users that don't have profiles
    FOR user_record IN
        SELECT au.id, au.email
        FROM auth.users au
        LEFT JOIN public.users pu ON au.id = pu.id
        WHERE pu.id IS NULL
    LOOP
        -- Create user profile
        INSERT INTO public.users (id, email, first_name, last_name, role, clinic_id)
        VALUES (
            user_record.id,
            user_record.email,
            'Test',
            'User',
            'patient',
            '550e8400-e29b-41d4-a716-446655440000'
        )
        ON CONFLICT (id) DO NOTHING;

        -- Create patient progress
        INSERT INTO public.patient_progress (patient_id, phase, points, streak_days, total_exercises_completed)
        VALUES (
            user_record.id,
            'analyze',
            0,
            0,
            0
        )
        ON CONFLICT (patient_id) DO NOTHING;
    END LOOP;
END $$;

-- Check if it worked
SELECT * FROM users;
SELECT * FROM patient_progress;