-- Temporarily disable RLS for testing (DO NOT use in production!)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_progress DISABLE ROW LEVEL SECURITY;

-- Or alternatively, add a policy that allows users to insert their own profile
CREATE POLICY "Users can create their own profile on signup" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to create their own progress entry
CREATE POLICY "Users can create their own progress" ON patient_progress
    FOR INSERT WITH CHECK (auth.uid() = patient_id);