# Fire FMS - Supabase Setup Guide

**Last Updated**: November 12, 2025

This guide walks you through setting up a new Supabase project for the Fire FMS application.

---

## Prerequisites

- Supabase account (free tier is fine for development)
- Access to the fire-app source code
- Node.js installed locally

---

## Step 1: Create New Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in the project details:
   - **Name**: `fire-fms` (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Free tier is sufficient for demo
4. Click **"Create New Project"** (takes ~2 minutes)

---

## Step 2: Run Database Schema

1. Once project is ready, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Copy the entire contents of `fire-app/supabase/schema.sql`
4. Paste into the SQL editor
5. Click **"Run"** (or press `Cmd/Ctrl + Enter`)
6. You should see "Success. No rows returned"

---

## Step 3: Load Seed Data

1. Still in SQL Editor, click **"New query"** (+ icon)
2. Copy the entire contents of `fire-app/supabase/seed.sql`
3. Paste into the SQL editor
4. Click **"Run"**
5. You should see multiple "INSERT 0 X" success messages

---

## Step 4: Configure Authentication

### Enable Email Auth
1. Go to **Authentication** → **Providers** (left sidebar)
2. Ensure **Email** is enabled (should be by default)
3. Under Email settings, configure:
   - **Enable Email Confirmations**: OFF (for demo)
   - **Enable Email Change Confirmations**: OFF (for demo)

### Set Redirect URLs (Optional for production)
1. Go to **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   ```
   http://localhost:3002/auth/callback
   http://localhost:3002/auth/reset-password
   ```
3. For production, add your domain URLs

---

## Step 5: Get Your API Keys

1. Go to **Settings** → **API** (left sidebar)
2. Copy these values:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **Anon/Public Key**: `eyJhbGciOiJS...` (long string)

---

## Step 6: Configure Fire App Environment

1. Navigate to your fire-app directory:
   ```bash
   cd fire-app
   ```

2. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

3. Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJS...
   ```

---

## Step 7: Test the Connection

1. Install dependencies (if not already done):
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3002](http://localhost:3002)

4. Test login with demo accounts:
   - **Fire Chief**: chief@firestation1.com / demo123
   - **Firefighter**: john@firestation1.com / demo123

---

## Step 8: Create Auth Users (Important!)

The seed data creates user records but NOT auth accounts. You need to create auth users:

### Option A: Manual Creation (Recommended for Demo)
1. Go to **Authentication** → **Users** in Supabase dashboard
2. Click **"Add user"** → **"Create new user"**
3. Create each demo user:

   **Fire Chief:**
   - Email: `chief@firestation1.com`
   - Password: `demo123`
   - Auto Confirm Email: ✓

   **Firefighter:**
   - Email: `john@firestation1.com`
   - Password: `demo123`
   - Auto Confirm Email: ✓

   Add more as needed from seed data.

### Option B: SQL Function (Advanced)
Run this in SQL Editor to create all demo users at once:
```sql
-- Create auth users for demo accounts
DO $$
DECLARE
  user_email TEXT;
  user_id UUID;
BEGIN
  -- Create auth users for each user in our users table
  FOR user_email, user_id IN
    SELECT email, id FROM users WHERE email IS NOT NULL
  LOOP
    -- This creates an auth user with password 'demo123'
    -- Note: In production, use proper password reset flow
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      user_id,
      user_email,
      crypt('demo123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}'
    ) ON CONFLICT (email) DO NOTHING;
  END LOOP;
END $$;
```

---

## Step 9: Verify Setup

### Check Database Tables
1. Go to **Table Editor** (left sidebar)
2. You should see all 10 tables:
   - stations (3 records)
   - users (5 records)
   - exercises (25 records)
   - series (6 records)
   - And others...

### Test Authentication
1. Try logging in on your local app
2. Check that role-based routing works:
   - Chief → `/chief` dashboard
   - Firefighter → `/firefighter` dashboard

---

## Troubleshooting

### "Invalid email or password"
- Ensure you created auth users (Step 8)
- Check email/password spelling
- Verify Email provider is enabled

### "Failed to fetch"
- Check your `.env.local` file has correct URLs
- Ensure Supabase project is active (not paused)
- Verify you're using the Anon/Public key (not Service Role key)

### Tables not showing data
- Re-run the seed.sql file
- Check SQL Editor for any error messages
- Ensure schema.sql ran successfully first

### App redirects to login constantly
- This is expected - the current app uses mock data
- Full database integration is still pending

---

## Next Steps

Once setup is complete:
1. The login flow will work with real authentication
2. The firefighter dashboard shows (currently with mock data)
3. You're ready to implement real database queries

For production deployment:
- Enable Row Level Security (RLS)
- Configure email templates
- Set up proper password reset flow
- Add your production domain to redirect URLs

---

## Support

- Supabase Docs: [https://supabase.com/docs](https://supabase.com/docs)
- Project Issues: Check fire-docs/README.md for known issues
- Database Schema: See fire-docs/DATABASE_SCHEMA.md for table details