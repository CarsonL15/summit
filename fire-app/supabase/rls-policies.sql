-- ============================================================
-- Row-Level Security (RLS) Policies for Fire FMS App
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- Helper functions (run with SECURITY DEFINER to bypass RLS and avoid recursion)

CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth_user_station_id()
RETURNS UUID AS $$
  SELECT station_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================================
-- 1. STATIONS
-- ============================================================
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read stations
CREATE POLICY "stations_select" ON stations
  FOR SELECT TO authenticated USING (true);

-- Only admin can modify stations
CREATE POLICY "stations_modify" ON stations
  FOR ALL TO authenticated USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');


-- ============================================================
-- 2. USERS
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can see: own profile, same-station users, or all if clinic/assessor/admin
CREATE POLICY "users_select" ON users
  FOR SELECT TO authenticated USING (
    id = auth.uid()
    OR station_id = auth_user_station_id()
    OR auth_user_role() IN ('clinic', 'assessor', 'admin')
  );

-- Users can update their own profile (points, streaks, etc.)
CREATE POLICY "users_update_own" ON users
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- Clinic/admin can also update any user (e.g. badge number corrections)
CREATE POLICY "users_update_staff" ON users
  FOR UPDATE TO authenticated USING (auth_user_role() IN ('clinic', 'admin'));

-- Clinic/admin can insert users (API route uses service role, but safety net)
CREATE POLICY "users_insert" ON users
  FOR INSERT TO authenticated WITH CHECK (auth_user_role() IN ('clinic', 'admin'));

-- Only admin can delete users
CREATE POLICY "users_delete" ON users
  FOR DELETE TO authenticated USING (auth_user_role() = 'admin');


-- ============================================================
-- 3. FMS_SCORES
-- ============================================================
ALTER TABLE fms_scores ENABLE ROW LEVEL SECURITY;

-- Own scores, same-station scores (for chiefs), all if clinic/assessor/admin
CREATE POLICY "fms_scores_select" ON fms_scores
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = fms_scores.user_id AND station_id = auth_user_station_id()
    )
    OR auth_user_role() IN ('clinic', 'assessor', 'admin')
  );

-- Clinic/assessor/admin can create assessments
CREATE POLICY "fms_scores_insert" ON fms_scores
  FOR INSERT TO authenticated WITH CHECK (
    auth_user_role() IN ('clinic', 'assessor', 'admin')
  );

-- Only admin can update/delete scores
CREATE POLICY "fms_scores_update" ON fms_scores
  FOR UPDATE TO authenticated USING (auth_user_role() = 'admin');

CREATE POLICY "fms_scores_delete" ON fms_scores
  FOR DELETE TO authenticated USING (auth_user_role() = 'admin');


-- ============================================================
-- 4. SERIES (exercise program library — read-only for most)
-- ============================================================
ALTER TABLE series ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read series
CREATE POLICY "series_select" ON series
  FOR SELECT TO authenticated USING (true);

-- Only admin can modify the series library
CREATE POLICY "series_modify" ON series
  FOR ALL TO authenticated USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');


-- ============================================================
-- 5. EXERCISES (exercise library — read-only for most)
-- ============================================================
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read exercises
CREATE POLICY "exercises_select" ON exercises
  FOR SELECT TO authenticated USING (true);

-- Only admin can modify exercises
CREATE POLICY "exercises_modify" ON exercises
  FOR ALL TO authenticated USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');


-- ============================================================
-- 6. SERIES_EXERCISES (junction table — read-only for most)
-- ============================================================
ALTER TABLE series_exercises ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "series_exercises_select" ON series_exercises
  FOR SELECT TO authenticated USING (true);

-- Only admin can modify
CREATE POLICY "series_exercises_modify" ON series_exercises
  FOR ALL TO authenticated USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');


-- ============================================================
-- 7. SERIES_ASSIGNMENTS
-- ============================================================
ALTER TABLE series_assignments ENABLE ROW LEVEL SECURITY;

-- Own assignments, same-station assignments (chiefs), all if clinic/assessor/admin
CREATE POLICY "series_assignments_select" ON series_assignments
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = series_assignments.user_id AND station_id = auth_user_station_id()
    )
    OR auth_user_role() IN ('clinic', 'assessor', 'admin')
  );

-- Clinic/assessor/admin can assign series
CREATE POLICY "series_assignments_insert" ON series_assignments
  FOR INSERT TO authenticated WITH CHECK (
    auth_user_role() IN ('clinic', 'assessor', 'admin')
  );

-- Users can update their own assignments (completion tracking)
CREATE POLICY "series_assignments_update_own" ON series_assignments
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Clinic/admin can also update any assignment
CREATE POLICY "series_assignments_update_staff" ON series_assignments
  FOR UPDATE TO authenticated USING (auth_user_role() IN ('clinic', 'admin'));

-- Only admin can delete assignments
CREATE POLICY "series_assignments_delete" ON series_assignments
  FOR DELETE TO authenticated USING (auth_user_role() = 'admin');


-- ============================================================
-- 8. EXERCISE_COMPLETIONS
-- ============================================================
ALTER TABLE exercise_completions ENABLE ROW LEVEL SECURITY;

-- Own completions, same-station completions (chiefs), all if clinic/assessor/admin
CREATE POLICY "exercise_completions_select" ON exercise_completions
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = exercise_completions.user_id AND station_id = auth_user_station_id()
    )
    OR auth_user_role() IN ('clinic', 'assessor', 'admin')
  );

-- Users can insert their own completions
CREATE POLICY "exercise_completions_insert" ON exercise_completions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Only admin can update/delete completions
CREATE POLICY "exercise_completions_update" ON exercise_completions
  FOR UPDATE TO authenticated USING (auth_user_role() = 'admin');

CREATE POLICY "exercise_completions_delete" ON exercise_completions
  FOR DELETE TO authenticated USING (auth_user_role() = 'admin');


-- ============================================================
-- 9. ACHIEVEMENTS (library — read-only for most)
-- ============================================================
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read achievements
CREATE POLICY "achievements_select" ON achievements
  FOR SELECT TO authenticated USING (true);

-- Only admin can modify achievements
CREATE POLICY "achievements_modify" ON achievements
  FOR ALL TO authenticated USING (auth_user_role() = 'admin')
  WITH CHECK (auth_user_role() = 'admin');


-- ============================================================
-- 10. USER_ACHIEVEMENTS
-- ============================================================
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Own achievements, same-station achievements (leaderboard), all if clinic/assessor/admin
CREATE POLICY "user_achievements_select" ON user_achievements
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = user_achievements.user_id AND station_id = auth_user_station_id()
    )
    OR auth_user_role() IN ('clinic', 'assessor', 'admin')
  );

-- Users can earn their own achievements
CREATE POLICY "user_achievements_insert" ON user_achievements
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Only admin can delete achievements
CREATE POLICY "user_achievements_delete" ON user_achievements
  FOR DELETE TO authenticated USING (auth_user_role() = 'admin');


-- ============================================================
-- 11. INJURIES
-- ============================================================
ALTER TABLE injuries ENABLE ROW LEVEL SECURITY;

-- Own injuries, same-station injuries (chiefs), all if clinic/assessor/admin
CREATE POLICY "injuries_select" ON injuries
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR (auth_user_role() = 'chief' AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = injuries.user_id AND station_id = auth_user_station_id()
    ))
    OR auth_user_role() IN ('clinic', 'assessor', 'admin')
  );

-- Clinic/admin can log injuries
CREATE POLICY "injuries_insert" ON injuries
  FOR INSERT TO authenticated WITH CHECK (
    auth_user_role() IN ('clinic', 'admin')
  );

-- Clinic/admin can update injuries
CREATE POLICY "injuries_update" ON injuries
  FOR UPDATE TO authenticated USING (auth_user_role() IN ('clinic', 'admin'));

-- Only admin can delete injuries
CREATE POLICY "injuries_delete" ON injuries
  FOR DELETE TO authenticated USING (auth_user_role() = 'admin');


-- ============================================================
-- 12. TRIGGER: Prevent role/station/email escalation
-- ============================================================
-- RLS can't restrict which COLUMNS a user updates, only which ROWS.
-- Without this trigger, a firefighter could update their own role to 'admin'
-- via browser console. This trigger silently reverts unauthorized field changes.

CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Service role (auth.uid() is null) can change anything
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only admin can change role
  IF NEW.role IS DISTINCT FROM OLD.role AND auth_user_role() != 'admin' THEN
    NEW.role := OLD.role;
  END IF;

  -- Only admin/clinic can change station_id
  IF NEW.station_id IS DISTINCT FROM OLD.station_id AND auth_user_role() NOT IN ('admin', 'clinic') THEN
    NEW.station_id := OLD.station_id;
  END IF;

  -- Only admin can change email
  IF NEW.email IS DISTINCT FROM OLD.email AND auth_user_role() != 'admin' THEN
    NEW.email := OLD.email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER protect_user_sensitive_fields
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_escalation();


-- ============================================================
-- DONE
-- ============================================================
-- To verify policies, run:
--   SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
--
-- To verify trigger, run:
--   SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';
