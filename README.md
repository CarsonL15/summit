# Summit - Gamified Rehab Exercise Management Platform

A comprehensive web application that gamifies rehabilitation exercises for chiropractic clinics, transforming manual Excel-based FMS assessments into an engaging digital experience.

## 🏔️ Project Status: Visual Polish Complete

**Current Version**: v0.3.0 (Visual Polish)
**Last Updated**: October 31, 2025
**Status**: ✅ MVP Complete + Phase 2 Enhancements + Visual Polish

## Overview

Summit helps chiropractic clinics digitize their Functional Movement Screen (FMS) assessment process and automatically assign corrective exercises. Patients progress through four phases (Analyze → Mobilize → Stabilize → Optimize) visualized as climbing a mountain to reach the summit.

## What's New in Visual Polish Update (Oct 31, 2025)

### ✨ Visual Polish Complete:
1. **Global Dark/Light Mode** - Full theme switching across entire application
2. **Summit Brand Colors** - Consistent blue (#0d3d62) and gold (#afa586) throughout
3. **Framer Motion Animations** - Smooth transitions, stagger effects, and micro-interactions
4. **Animated Components** - AnimatedCard, ProgressBar, and loading skeletons
5. **Enhanced Landing Page** - Professional hero section with feature showcase
6. **Polished All Pages** - 11+ pages redesigned with consistent branding
7. **Theme Toggle** - Easy switching between dark and soft dark modes
8. **Rounded Corners** - Soft, friendly aesthetic with xl/2xl border radius
9. **Gradient Effects** - Beautiful gradients using Summit colors for depth
10. **Progress Indicators** - Custom progress bars with phase-specific colors

### ✅ Phase 2 Completed (Oct 31, 2025):
1. **Fixed Exercise Visibility** - Patients now see exercises immediately (no 7-day wait)
2. **Weekly Exercise Programs** - Changed from single due date to date ranges (start_date → end_date)
3. **Daily Completion Tracking** - Patients can complete exercises multiple times, tracked daily
4. **Exercise Review Page** - Employees can review/edit exercises after FMS assessment
5. **Reduced Exercise Count** - From 10-14 exercises down to ~5-7 (1 per category)
6. **Fixed FMS Scoring** - Bilateral movements now use LOWER of left/right (max 21 total)
7. **Custom Exercise Parameters** - Employees can adjust sets, reps, and total completions per exercise
8. **Adjustable Program Duration** - Employees can set program length (1-30 days)
9. **Password Reset Flow** - Patients set their own password via email link
10. **Database Migrations** - 4 migrations applied for new features

## Features

### For Patients
- **Weekly Exercise Program**: See all assigned exercises immediately
- **Daily Progress Tracking**: Complete exercises multiple times per day
- **Visual Feedback**: Green highlighting for completed exercises
- **Mountain Progress Visualization**: Track your journey through recovery phases
- **Gamification System**: Earn points (10 pts for first daily completion), maintain streaks
- **Progress Dashboard**: View stats, current phase, and exercise history

### For Employees
- **Add New Patient**: Create patient accounts with email invite
- **FMS Assessment Tool**: Input 7-pattern scores with proper bilateral scoring
- **Exercise Review & Customization**:
  - Review auto-assigned exercises
  - Adjust sets, reps, and total completions per exercise
  - Add or remove exercises
  - Customize program duration (1-30 days)
- **Patient Management**: View and track all clinic patients
- **Progress Monitoring**: Track patient engagement and compliance

### For Clinic Owners
- **Analytics Dashboard**: Clinic-wide metrics and performance
- **Employee Performance**: Monitor staff efficiency and patient outcomes
- **Engagement Metrics**: Track overall patient compliance and success rates

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth with password reset
- **Styling**: Tailwind CSS + shadcn/ui components
- **Animations**: Framer Motion for smooth transitions
- **Theme**: next-themes for dark/light mode switching
- **Icons**: Lucide React
- **Hosting**: Vercel
- **Future**: Email notifications, video integration

## Project Structure

```
summit/
├── app/
│   ├── page.tsx                 # ✨ Landing page with animations
│   ├── auth/
│   │   ├── login/               # ✨ Polished with animations
│   │   ├── signup/              # ✨ Polished with animations
│   │   └── reset-password/      # ✨ Polished with animations
│   ├── patient/
│   │   ├── page.tsx             # ✨ Mountain visualization, theme toggle
│   │   └── exercise/[id]/       # ✨ Celebration animations
│   ├── employee/
│   │   ├── page.tsx             # ✨ Polished dashboard
│   │   ├── assessment/
│   │   │   ├── page.tsx         # ✨ Animated scoring interface
│   │   │   └── review/[id]/     # ✨ Collapsible panels, animations
│   │   └── patient/[id]/        # ✨ Animated progress cards
│   └── owner/                   # ✨ Polished analytics
├── components/
│   ├── ui/
│   │   ├── animated-card.tsx    # ✨ NEW: Framer Motion cards
│   │   ├── progress-bar.tsx     # ✨ NEW: Animated progress
│   │   ├── skeleton.tsx         # ✨ NEW: Loading states
│   │   └── [shadcn components]  # shadcn/ui components
│   └── theme-provider.tsx       # ✨ NEW: Dark mode provider
├── lib/supabase/                # Supabase client configuration
├── types/
│   └── supabase.ts              # Database types
├── supabase/
│   ├── schema.sql               # Initial schema
│   ├── seed.sql                 # Exercise seed data
│   └── migrations/              # Database migrations
├── DATABASE_SCHEMA.md           # Complete schema documentation
├── DEVELOPMENT.md               # Development status
├── ROADMAP.md                   # Future plans
├── STYLE_GUIDE.md               # ✨ NEW: Design system & brand guide
└── CLAUDE.md                    # AI assistant context
```

## Database Schema

### Core Tables (8 total, 88 columns)
- **users**: Extended auth users with roles (patient, employee, owner)
- **clinics**: Clinic information
- **fms_assessments**: 7 movement patterns with CORRECT bilateral scoring (max 21)
- **exercises**: Pre-seeded corrective exercise library (40+)
- **exercise_assignments**: NEW fields for custom sets/reps/completions + date ranges
- **exercise_completions**: Tracks multiple daily completions with completion_date
- **patient_progress**: Gamification data (points, streaks, phase)
- **achievements**: Unlockable badges and milestones

**See DATABASE_SCHEMA.md for complete details**

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd summit
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Supabase**
   - Create a new Supabase project at https://supabase.com
   - Go to SQL Editor and run:
     1. `supabase/schema.sql` (initial schema)
     2. `supabase/seed.sql` (exercise data)
     3. All files in `supabase/migrations/` folder (in order)

4. **Configure environment variables**
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

5. **Configure Supabase Auth**
   - Go to Authentication → URL Configuration
   - Add redirect URLs:
     - `http://localhost:3001/auth/reset-password`
     - `https://yourdomain.com/auth/reset-password`

6. **Run the development server**
```bash
npm run dev
```

7. **Open the application**
   - Navigate to http://localhost:3001
   - Create accounts for testing different roles

## FMS Assessment Scoring (FIXED)

**IMPORTANT:** For bilateral movements, we take the LOWER of left/right scores.

### Scoring Rules:
- **Score 0**: Unable to perform
- **Score 1**: Poor form/compensation
- **Score 2**: Moderate form
- **Score 3**: Good form

### Movement Patterns (Max 21 Total):
1. Deep Squat (0-3)
2. Hurdle Step - LOWER of L/R (0-3)
3. Inline Lunge - LOWER of L/R (0-3)
4. Shoulder Mobility - LOWER of L/R (0-3)
5. Active Straight Leg Raise - LOWER of L/R (0-3)
6. Trunk Stability Push-Up (0-3)
7. Rotary Stability - LOWER of L/R (0-3)

### Exercise Assignment:
- Scores ≤1 trigger corrective exercises (1 exercise per category)
- Typical patient gets 5-7 exercises (not 10-14)

## Gamification System

### Points System
- Complete exercise (first time daily): 10 points
- Subsequent completions same day: 0 points (no double-dipping)
- Maintain streak: Consecutive days with ANY exercise
- Phase completion: 100 points (future)

### Phases
1. **Analyze**: Initial assessment and baseline
2. **Mobilize**: Focus on mobility and flexibility
3. **Stabilize**: Build stability and control
4. **Optimize**: Performance enhancement

### Achievements
- First Steps (first exercise)
- Week Warrior (7-day streak)
- Phase Completion (future)
- Perfect Week (future)

## What's Next

### Immediate Priorities:
1. ✅ ~~**Framer Motion Animations**~~ - COMPLETED! Full visual polish applied
2. **Video Integration** (3-4 hrs) - Add exercise video player and hosting
3. **Email Notifications** (4-5 hrs) - Automated emails for assignments/completions
4. **Phase Progression Logic** (3-4 hrs) - Auto-advance patients between phases
5. **Mobile Responsiveness** (2-3 hrs) - Final mobile optimization tweaks

### See ROADMAP.md for complete Phase 3+ plans

## Development Workflow

### Patient Onboarding Flow:
1. Employee clicks "Add New Patient"
2. Enters name and email
3. Patient receives password reset email
4. Patient sets own password
5. Patient assigned to employee's clinic automatically

### Exercise Assignment Flow:
1. Employee conducts FMS assessment
2. System auto-assigns ~5-7 exercises (1 per low-scoring category)
3. Employee reviews on review page
4. Employee can:
   - Adjust sets/reps/total completions
   - Add/remove exercises
   - Change program duration
5. Patient sees exercises immediately
6. Patient completes exercises daily for program duration

## Known Issues & Limitations

- Video URLs are placeholders (not implemented)
- RLS policies disabled for testing (re-enable for production)
- Email templates need customization
- Phase progression only goes analyze → mobilize
- Owner analytics are static

## Testing the App

**See DEVELOPMENT.md for complete testing guide**

Quick test:
1. Create clinic in Supabase
2. Create employee user, set clinic_id
3. Login as employee
4. Add new patient
5. Conduct FMS assessment
6. Review/customize exercises
7. Login as patient (use password reset)
8. Complete exercises

## Contributing

This is currently a prototype. For production deployment:

1. Re-enable RLS policies
2. Add comprehensive error handling
3. Implement testing (Jest + Playwright)
4. Add monitoring (Sentry)
5. Optimize performance
6. Implement email service (Resend/SendGrid)
7. Add video hosting (Supabase Storage or YouTube)

## License

[Your License Here]

## Contact

For questions or support, please contact [your contact information].

---

**Built with 💪 to help patients reach their summit!**

**Latest Update**: Oct 31, 2025 - Visual Polish Complete! All pages redesigned with animations and dark mode.