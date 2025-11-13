-- Summit Database Schema
-- Gamified Rehab Exercise Management Platform
-- Version: 1.2.0 (Phase 2 Complete)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clinics table
CREATE TABLE IF NOT EXISTS clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(20) CHECK (role IN ('patient', 'employee', 'owner')) NOT NULL,
    clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- FMS Assessments table
CREATE TABLE IF NOT EXISTS fms_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    deep_squat INTEGER CHECK (deep_squat >= 0 AND deep_squat <= 3) NOT NULL,
    hurdle_step_left INTEGER CHECK (hurdle_step_left >= 0 AND hurdle_step_left <= 3) NOT NULL,
    hurdle_step_right INTEGER CHECK (hurdle_step_right >= 0 AND hurdle_step_right <= 3) NOT NULL,
    inline_lunge_left INTEGER CHECK (inline_lunge_left >= 0 AND inline_lunge_left <= 3) NOT NULL,
    inline_lunge_right INTEGER CHECK (inline_lunge_right >= 0 AND inline_lunge_right <= 3) NOT NULL,
    shoulder_mobility_left INTEGER CHECK (shoulder_mobility_left >= 0 AND shoulder_mobility_left <= 3) NOT NULL,
    shoulder_mobility_right INTEGER CHECK (shoulder_mobility_right >= 0 AND shoulder_mobility_right <= 3) NOT NULL,
    active_straight_leg_raise_left INTEGER CHECK (active_straight_leg_raise_left >= 0 AND active_straight_leg_raise_left <= 3) NOT NULL,
    active_straight_leg_raise_right INTEGER CHECK (active_straight_leg_raise_right >= 0 AND active_straight_leg_raise_right <= 3) NOT NULL,
    trunk_stability_push_up INTEGER CHECK (trunk_stability_push_up >= 0 AND trunk_stability_push_up <= 3) NOT NULL,
    rotary_stability_left INTEGER CHECK (rotary_stability_left >= 0 AND rotary_stability_left <= 3) NOT NULL,
    rotary_stability_right INTEGER CHECK (rotary_stability_right >= 0 AND rotary_stability_right <= 3) NOT NULL,
    total_score INTEGER GENERATED ALWAYS AS (
        deep_squat +
        LEAST(hurdle_step_left, hurdle_step_right) +
        LEAST(inline_lunge_left, inline_lunge_right) +
        LEAST(shoulder_mobility_left, shoulder_mobility_right) +
        LEAST(active_straight_leg_raise_left, active_straight_leg_raise_right) +
        trunk_stability_push_up +
        LEAST(rotary_stability_left, rotary_stability_right)
    ) STORED CHECK (total_score <= 21),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Exercises table
CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    video_url VARCHAR(500),
    duration_seconds INTEGER NOT NULL DEFAULT 30,
    sets INTEGER NOT NULL DEFAULT 3,
    reps INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Exercise Assignments table (Phase 2: Added date ranges, custom parameters, assessment link)
CREATE TABLE IF NOT EXISTS exercise_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
    daily_target INTEGER DEFAULT 1,
    custom_sets INTEGER,
    custom_reps INTEGER,
    total_completions_required INTEGER DEFAULT 7 CHECK (total_completions_required > 0),
    assessment_id UUID REFERENCES fms_assessments(id) ON DELETE SET NULL,
    phase VARCHAR(20) CHECK (phase IN ('analyze', 'mobilize', 'stabilize', 'optimize')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Exercise Completions table (Phase 2: Added completion_date for daily tracking)
CREATE TABLE IF NOT EXISTS exercise_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES exercise_assignments(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    completion_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Patient Progress table
CREATE TABLE IF NOT EXISTS patient_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    phase VARCHAR(20) CHECK (phase IN ('analyze', 'mobilize', 'stabilize', 'optimize')) NOT NULL DEFAULT 'analyze',
    points INTEGER NOT NULL DEFAULT 0,
    streak_days INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    total_exercises_completed INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_clinic_id ON users(clinic_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_fms_assessments_patient_id ON fms_assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_fms_assessments_employee_id ON fms_assessments(employee_id);
CREATE INDEX IF NOT EXISTS idx_exercise_assignments_patient_id ON exercise_assignments(patient_id);
CREATE INDEX IF NOT EXISTS idx_exercise_assignments_exercise_id ON exercise_assignments(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_assignments_phase ON exercise_assignments(phase);
CREATE INDEX IF NOT EXISTS idx_exercise_assignments_assessment_id ON exercise_assignments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_exercise_assignments_dates ON exercise_assignments(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_exercise_completions_patient_id ON exercise_completions(patient_id);
CREATE INDEX IF NOT EXISTS idx_exercise_completions_assignment_id ON exercise_completions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_exercise_completions_date ON exercise_completions(completion_date);
CREATE INDEX IF NOT EXISTS idx_patient_progress_patient_id ON patient_progress(patient_id);
CREATE INDEX IF NOT EXISTS idx_achievements_patient_id ON achievements(patient_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE fms_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Employees can view patients in their clinic" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users AS u
            WHERE u.id = auth.uid()
            AND u.role IN ('employee', 'owner')
            AND u.clinic_id = users.clinic_id
        )
    );

-- Policies for FMS assessments
CREATE POLICY "Patients can view their own assessments" ON fms_assessments
    FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Employees can manage assessments for their clinic patients" ON fms_assessments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users AS employee
            JOIN users AS patient ON patient.clinic_id = employee.clinic_id
            WHERE employee.id = auth.uid()
            AND employee.role IN ('employee', 'owner')
            AND patient.id = fms_assessments.patient_id
        )
    );

-- Policies for exercises (read-only for all authenticated users)
CREATE POLICY "All authenticated users can view exercises" ON exercises
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policies for exercise assignments
CREATE POLICY "Patients can view their own assignments" ON exercise_assignments
    FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Employees can manage assignments for their clinic patients" ON exercise_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users AS employee
            JOIN users AS patient ON patient.clinic_id = employee.clinic_id
            WHERE employee.id = auth.uid()
            AND employee.role IN ('employee', 'owner')
            AND patient.id = exercise_assignments.patient_id
        )
    );

-- Policies for exercise completions
CREATE POLICY "Patients can manage their own completions" ON exercise_completions
    FOR ALL USING (auth.uid() = patient_id);

CREATE POLICY "Employees can view completions for their clinic patients" ON exercise_completions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users AS employee
            JOIN users AS patient ON patient.clinic_id = employee.clinic_id
            WHERE employee.id = auth.uid()
            AND employee.role IN ('employee', 'owner')
            AND patient.id = exercise_completions.patient_id
        )
    );

-- Policies for patient progress
CREATE POLICY "Patients can view their own progress" ON patient_progress
    FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "System can update patient progress" ON patient_progress
    FOR ALL USING (auth.uid() = patient_id);

CREATE POLICY "Employees can view progress for their clinic patients" ON patient_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users AS employee
            JOIN users AS patient ON patient.clinic_id = employee.clinic_id
            WHERE employee.id = auth.uid()
            AND employee.role IN ('employee', 'owner')
            AND patient.id = patient_progress.patient_id
        )
    );

-- Policies for achievements
CREATE POLICY "Patients can view their own achievements" ON achievements
    FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "System can create achievements" ON achievements
    FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to set completion_date from completed_at (Phase 2)
CREATE OR REPLACE FUNCTION set_completion_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.completion_date = DATE(NEW.completed_at);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fms_assessments_updated_at BEFORE UPDATE ON fms_assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_assignments_updated_at BEFORE UPDATE ON exercise_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_progress_updated_at BEFORE UPDATE ON patient_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Phase 2: Trigger to automatically set completion_date
CREATE TRIGGER set_completion_date_trigger
    BEFORE INSERT OR UPDATE ON exercise_completions
    FOR EACH ROW EXECUTE FUNCTION set_completion_date();