-- Fire FMS Database Schema
-- For fire departments, police, and first responder organizations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Stations table (fire stations, police departments, etc.)
CREATE TABLE stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL, -- 'fire', 'police', 'swat', etc.
  location TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (firefighters, chiefs, etc.)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('firefighter', 'chief', 'admin')),
  station_id UUID REFERENCES stations(id) ON DELETE CASCADE,
  badge_number VARCHAR(50),
  points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FMS Scores table (simplified for demo)
CREATE TABLE fms_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assessed_by UUID REFERENCES users(id),
  total_score INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 21),
  deep_squat INTEGER CHECK (deep_squat >= 0 AND deep_squat <= 3),
  hurdle_step INTEGER CHECK (hurdle_step >= 0 AND hurdle_step <= 3),
  inline_lunge INTEGER CHECK (inline_lunge >= 0 AND inline_lunge <= 3),
  shoulder_mobility INTEGER CHECK (shoulder_mobility >= 0 AND shoulder_mobility <= 3),
  aslr INTEGER CHECK (aslr >= 0 AND aslr <= 3), -- Active Straight Leg Raise
  trunk_stability INTEGER CHECK (trunk_stability >= 0 AND trunk_stability <= 3),
  rotary_stability INTEGER CHECK (rotary_stability >= 0 AND rotary_stability <= 3),
  weak_areas JSONB, -- Stores which areas need work
  notes TEXT,
  assessed_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Series table (3-week mini-series programs)
CREATE TABLE series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_weeks INTEGER DEFAULT 3,
  target_area VARCHAR(100), -- 'hip', 'shoulder', 'core', etc.
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercises table
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  instructions TEXT,
  video_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  sets INTEGER DEFAULT 3,
  reps INTEGER DEFAULT 10,
  duration_seconds INTEGER,
  category VARCHAR(100), -- 'mobility', 'strength', 'stability', etc.
  equipment_needed VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Series Exercises junction table (links exercises to series with week number)
CREATE TABLE series_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES series(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 4),
  day_number INTEGER, -- Optional: specific day in the week
  order_in_week INTEGER NOT NULL, -- Order of exercise in that week
  custom_sets INTEGER,
  custom_reps INTEGER,
  custom_duration INTEGER,
  UNIQUE(series_id, week_number, order_in_week)
);

-- Series Assignments (which user has which series)
CREATE TABLE series_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  series_id UUID REFERENCES series(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  fms_score_id UUID REFERENCES fms_scores(id), -- Links to the FMS assessment
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  current_week INTEGER DEFAULT 1,
  completed BOOLEAN DEFAULT FALSE,
  completion_percentage INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercise Completions (tracks individual exercise completions)
CREATE TABLE exercise_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  series_assignment_id UUID REFERENCES series_assignments(id) ON DELETE CASCADE,
  week_number INTEGER,
  completed_date DATE DEFAULT CURRENT_DATE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  points_awarded INTEGER DEFAULT 0,
  notes TEXT
);

-- Achievements table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- emoji or icon name
  points_required INTEGER,
  type VARCHAR(50), -- 'streak', 'points', 'series', 'special'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Achievements (earned achievements)
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_station ON users(station_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_points ON users(points DESC);
CREATE INDEX idx_fms_scores_user ON fms_scores(user_id);
CREATE INDEX idx_series_assignments_user ON series_assignments(user_id);
CREATE INDEX idx_series_assignments_dates ON series_assignments(start_date, end_date);
CREATE INDEX idx_exercise_completions_user ON exercise_completions(user_id);
CREATE INDEX idx_exercise_completions_date ON exercise_completions(completed_date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_stations_updated_at BEFORE UPDATE ON stations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_series_updated_at BEFORE UPDATE ON series
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_series_assignments_updated_at BEFORE UPDATE ON series_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();