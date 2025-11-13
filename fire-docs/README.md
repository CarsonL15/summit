# FireFMS - Fire Department FMS Platform

**Version**: 0.1.0 (MVP Development)
**Last Updated**: November 12, 2025
**Status**: 🚧 Demo Ready, Database Integration Pending

---

## 🎯 Overview

FireFMS is a specialized Functional Movement Screen (FMS) assessment and training platform designed specifically for fire departments and first responders. It features 3-week mini-series exercise programs with department-wide gamification to improve compliance and reduce injury rates.

### Key Differences from Clinic App
- **3-week mini-series model** instead of individual exercises
- **Station-based organization** instead of clinics
- **Department-wide leaderboards** for competitive motivation
- **Role-based for firefighters and chiefs** (no patient/employee model)

---

## 🏗️ Current Implementation Status

### ✅ Completed
- **Database Schema** - 9 tables designed for fire department needs
- **Seed Data** - 25 exercises, 6 series programs, demo users
- **Landing Page** - Fire-themed branding and features overview
- **Login Page** - Quick demo access with role-based routing
- **Firefighter Dashboard** - Stats, current series, exercises, achievements
- **UI Components** - All necessary shadcn/ui components
- **Environment Setup** - Supabase client configuration

### 🚧 In Progress (Using Mock Data)
- Firefighter dashboard displays mock data
- Authentication flow ready but needs Supabase setup

### 📋 Not Yet Built
- Fire Chief dashboard
- Real database integration
- Exercise completion flow
- Series progression logic
- Leaderboard component
- Station analytics
- FMS assessment interface

---

## 🗄️ Database Structure

### Core Tables
1. **stations** - Fire stations and departments
2. **users** - Firefighters, chiefs, admins
3. **fms_scores** - Assessment results
4. **series** - 3-week training programs
5. **exercises** - Exercise library
6. **series_exercises** - Weekly exercise mapping
7. **series_assignments** - User-to-series assignments
8. **exercise_completions** - Tracking completions
9. **achievements** - Badges and milestones
10. **user_achievements** - Earned achievements

See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for complete details.

---

## 🚀 Quick Start

### 1. Setup Supabase
Follow the detailed instructions in [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

Quick overview:
```bash
# 1. Create new Supabase project
# 2. Run fire-app/supabase/schema.sql
# 3. Run fire-app/supabase/seed.sql
# 4. Create auth users for demo accounts
# 5. Copy credentials to .env.local
```

### 2. Install & Run
```bash
cd fire-app
npm install
cp .env.local.example .env.local
# Add your Supabase credentials
npm run dev
# Open http://localhost:3002
```

### 3. Demo Accounts
- **Fire Chief**: chief@firestation1.com / demo123
- **Firefighter**: john@firestation1.com / demo123

---

## 🎮 Features

### For Firefighters
- **Personal Dashboard** - Points, streaks, current series progress
- **3-Week Programs** - Progressive training targeting weak areas
- **Daily Exercises** - Clear checklist with video demonstrations
- **Achievements** - Badges for milestones and consistency
- **Station Leaderboard** - Compete with fellow firefighters

### For Fire Chiefs
- **Station Analytics** - Department-wide compliance and progress
- **FMS Assessments** - Conduct and track assessments
- **Series Assignment** - Assign appropriate programs based on weaknesses
- **Leaderboard Management** - Monitor and motivate the team
- **Progress Reports** - Individual and station-wide metrics

### Gamification Elements
- **Points System** - 10 points per exercise (first completion daily)
- **Streak Tracking** - Consecutive days of activity
- **Achievements** - 13 different badges to earn
- **Leaderboards** - Station-wide rankings
- **Series Completion** - Progress through 3-week programs

---

## 📱 UI Pages

### Built Pages
1. **Landing Page** (`/`)
   - Hero section with fire branding
   - Features overview
   - Demo account information

2. **Login Page** (`/auth/login`)
   - Quick demo buttons
   - Auto-fill credentials
   - Role-based routing

3. **Firefighter Dashboard** (`/firefighter`)
   - Stats cards (points, streak, progress)
   - Current series display
   - Today's exercises
   - Recent achievements
   - *Currently uses mock data*

### Planned Pages
4. **Fire Chief Dashboard** (`/chief`)
5. **Exercise Detail** (`/exercise/[id]`)
6. **Series Overview** (`/series/[id]`)
7. **Leaderboard** (`/leaderboard`)
8. **Assessment** (`/assessment`)
9. **Profile** (`/profile`)

---

## 🎨 Design System

### Color Palette
```css
fire: {
  red: '#dc2626',     /* Primary brand color */
  gold: '#facc15',    /* Accent, achievements */
  navy: '#1e293b',    /* Dark backgrounds */
  smoke: '#6b7280',   /* Subtle text */
}
```

### Key Components
- AnimatedCard - Motion-enabled cards
- Badge - Status and achievement indicators
- Progress - Visual progress tracking
- Button - Consistent CTAs
- Alert - Notifications and warnings

---

## 🔄 Mini-Series Model

### How It Works
1. **Assessment** - Chief conducts FMS assessment
2. **Assignment** - Assigns 3-week series based on weak areas
3. **Week 1** - Foundation/Mobility exercises
4. **Week 2** - Strength/Stability exercises
5. **Week 3** - Integration/Advanced exercises
6. **Completion** - Earns achievement, ready for next series

### Available Series (Seed Data)
- Hip Mobility Foundation (Beginner)
- Core Power Series (Intermediate)
- Shoulder Resilience (Intermediate)
- Lower Body Strength (Intermediate)
- Total Body Conditioning (Advanced)
- Injury Prevention Basics (Beginner)

---

## 🚧 Development Roadmap

### Immediate (For Demo)
1. **Database Integration** - Replace mock data
2. **Fire Chief Dashboard** - Analytics and management
3. **Exercise Completion** - Working flow with points
4. **Basic Leaderboard** - Station rankings

### Next Phase
5. **Series Progression** - Automatic week advancement
6. **Real-time Updates** - Live leaderboard updates
7. **Mobile Optimization** - Responsive design
8. **Email Notifications** - Reminders and achievements

### Future Enhancements
9. **Video Integration** - Exercise demonstrations
10. **PWA Features** - Offline support, push notifications
11. **Advanced Analytics** - Injury prediction, trends
12. **Multi-Station** - Department-wide management

---

## 🐛 Known Issues

1. **Mock Data Only** - Dashboard doesn't connect to database yet
2. **No Chief Dashboard** - Only firefighter view built
3. **No Exercise Flow** - Can't actually complete exercises
4. **Static Leaderboard** - Doesn't update with real data
5. **No Series Progression** - Week advancement not implemented

---

## 📊 Demo Data Overview

### Users (5)
- Chief Michael Johnson (chief)
- John Smith (250 points, 5-day streak)
- Sarah Williams (180 points, 3-day streak)
- Robert Chen (320 points, 8-day streak)
- Emily Davis (150 points, 2-day streak)

### Exercises (25)
- 5 Mobility exercises
- 5 Stability exercises
- 5 Strength exercises
- 5 Power exercises
- 5 Corrective exercises

### Series Programs (6)
Each with 3 weeks of progressive exercises

### Achievements (13)
- Streak-based (7, 14, 30 days)
- Points-based (100, 250, 500)
- Series completion
- Special (time of day, etc.)

---

## 🔧 Technical Notes

### Authentication
- Uses Supabase Auth
- Role-based routing (chief vs firefighter)
- Demo accounts need manual creation in Supabase

### Database
- PostgreSQL via Supabase
- No RLS enabled (demo only)
- Separate from clinic app database

### Deployment
- Ready for Vercel deployment
- Deploy from `/fire-app` directory
- Set environment variables in Vercel

---

## 📞 Support & Documentation

- **Setup Guide**: [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
- **Database Schema**: [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
- **Main README**: [../README.md](../README.md)
- **Roadmap**: [../ROADMAP.md](../ROADMAP.md)

---

## 🎯 Success Metrics (Target)

- 73% injury reduction (based on FMS research)
- 85% compliance rate with 3-week programs
- 90% of firefighters maintaining streaks
- 50% time savings vs paper tracking
- 95% user satisfaction score

---

**Remember**: This is a demo/MVP version. Full production features including real-time data, video content, and advanced analytics are planned for future phases.