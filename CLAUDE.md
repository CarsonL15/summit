# Summit Clinic - AI Assistant Context File

**Last Updated**: April 16, 2026
**Purpose**: Quick reference for Claude Code or other AI assistants

---

## 🎯 Project Overview

**Summit** is a gamified rehabilitation exercise management platform for chiropractic clinics. It digitizes the Functional Movement Screen (FMS) assessment and automatically assigns corrective exercises with a mountain-climbing progress metaphor.

Patients "climb the mountain" through 4 phases (Analyze → Mobilize → Stabilize → Optimize) by completing exercises assigned based on their FMS assessment scores.

> **Note**: This repo previously also contained `fire-app/` (a separate FireFMS application for fire departments). That code has been extracted to its own repository at https://github.com/CarsonL15/fire-app and is no longer part of this repo.

---

## 📂 Repo Structure

```
summit/
├── clinic-app/                   # Summit Clinic Application (Next.js 14)
│   ├── app/                      # App Router
│   │   ├── page.tsx              # Landing page
│   │   ├── auth/                 # Authentication pages
│   │   ├── patient/              # Patient dashboard & exercises
│   │   ├── employee/             # Employee assessment & management
│   │   └── owner/                # Owner analytics
│   ├── components/               # React components
│   ├── lib/supabase/             # Supabase client setup
│   ├── types/                    # TypeScript types
│   ├── supabase/                 # Database schemas
│   └── package.json              # Port 3001
│
├── clinic-docs/                  # Clinic app documentation
│   ├── DATABASE_SCHEMA.md        # ⭐ Database reference
│   ├── DEVELOPMENT.md            # Development guide
│   ├── STYLE_GUIDE.md            # Design system
│   └── MIGRATION_INSTRUCTIONS.md
│
├── CLAUDE.md                     # This file
├── ROADMAP.md                    # Future features & timeline
├── README.md                     # Repo overview
└── .gitignore
```

---

## 🗄️ Database Schema

**IMPORTANT**: Check `clinic-docs/DATABASE_SCHEMA.md` before making changes!

**8 core tables:**
1. **clinics** - Clinic information
2. **users** - User profiles with roles
3. **fms_assessments** - FMS scores (7 patterns, max 21 points)
4. **exercises** - Exercise library (40+ pre-seeded)
5. **exercise_assignments** - Patient exercise assignments with date ranges
6. **exercise_completions** - Daily completion tracking
7. **patient_progress** - Gamification (points, streaks, phase)
8. **achievements** - Earned badges

---

## 🔑 Key Business Logic

### FMS Assessment Flow
1. Employee conducts 7-pattern FMS assessment
2. Bilateral movements scored (take lower of L/R)
3. Scores ≤1 trigger **1 exercise per category** (~5-7 total)
4. Redirect to review page for customization
5. Employee adjusts sets/reps/program duration
6. Patient sees exercises immediately

### Exercise Completion
- Patients can complete exercises **multiple times per day**
- **10 points** awarded only on **FIRST daily completion**
- Subsequent completions same day = 0 points (no double-dipping)
- Streak maintained by completing ANY exercise each day

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL with Row Level Security - currently disabled)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS + shadcn/ui components
- **Animations**: Framer Motion
- **Theme**: next-themes (dark/light mode)
- **Hosting**: Vercel
- **Package Manager**: npm
- **Dev Server**: `npm run dev` (runs on port 3001)

### Important Dependencies
- `@supabase/supabase-js` - Supabase client
- `@supabase/ssr` - Server-side rendering support
- `framer-motion` - Animation library
- `next-themes` - Theme switching
- `canvas-confetti` - Celebration animations
- `lucide-react` - Icons

---

## 📋 Common Commands

```bash
cd clinic-app
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:3001)
npm run build        # Build for production
npm start            # Start production server
```

---

## 🚨 Critical Things to Know

### 1. Database Schema Changes
- **ALWAYS** read `clinic-docs/DATABASE_SCHEMA.md` first
- **ALWAYS** update `DATABASE_SCHEMA.md` after schema changes
- Update `types/supabase.ts` to match schema

### 2. FMS Scoring
- Bilateral movements use `Math.min(left, right)` in frontend
- Database uses `LEAST(left, right)` in generated column
- **Max total score is 21** (not 36!)
- See `app/employee/assessment/page.tsx:100-109` for scoring logic

### 3. Exercise Assignment
- Only assign **1 exercise per category** (not 2)
- Use date ranges: `start_date` to `end_date`
- Default program duration is 7 days
- See `app/employee/assessment/page.tsx:280-300` for assignment logic

### 4. Points System
- Check for daily completions FIRST before awarding points
- Use `completion_date` field (not `completed_at`) for daily checks
- See `app/patient/exercise/[id]/page.tsx:150-180` for points logic

### 5. Authentication
- Password reset requires Supabase redirect URL configuration
- Redirect URLs: `/auth/reset-password`
- See `app/employee/page.tsx:90-120` for patient creation flow

---

## 🧪 Testing Workflow

### Quick Test (Employee → Patient Flow)
1. Create clinic in Supabase (if not exists)
2. Login as employee (set role + clinic_id in Supabase)
3. Add patient via "Add New Patient"
4. Check email for password reset link
5. Conduct FMS assessment (test bilateral scoring)
6. Review exercises on review page (~5-7 exercises)
7. Customize sets/reps/duration
8. Login as patient
9. Verify exercises show immediately
10. Complete exercise twice (verify points only on first)

### Test FMS Scoring
Enter: Deep Squat=3, Hurdle(L=3,R=3), Inline(L=2,R=3), Shoulder(L=3,R=3), ASLR(L=2,R=3), Trunk=3, Rotary(L=3,R=3)
**Expected Total**: 19 (not 33)

---

## 🐛 Known Issues

1. **Video URLs are placeholders** - Not implemented yet
2. **RLS is disabled** - Need to re-enable for production
3. **Email templates** - Need customization
4. **Phase progression** - Only analyze → mobilize works
5. **Owner analytics** - Static data (no filtering)

---

## 📈 Status

### ✅ Phase 1 Complete (Oct 30, 2025)
- MVP with all core features

### ✅ Phase 2 Complete (Oct 31, 2025)
- Fixed exercise visibility
- Fixed FMS scoring
- Exercise review & customization
- Password reset flow
- Daily tracking improvements

### ✅ Visual Polish Complete (Oct 31, 2025)
- Global dark/light mode with next-themes
- Framer Motion animations across all pages
- Summit brand colors (#0d3d62, #afa586)
- AnimatedCard, ProgressBar, Skeleton components
- Landing page redesign with hero & features
- STYLE_GUIDE.md for consistent design

### 🔄 Phase 3 Next (Recommended)
1. Video integration (3-4 hrs)
2. Email notifications (4-5 hrs)
3. Phase progression logic (3-4 hrs)
4. Mobile optimization (2-3 hrs)

---

## 💡 Quick Tips for AI Assistants

### Before Making Changes
1. Read `clinic-docs/DATABASE_SCHEMA.md` if touching database
2. Read `clinic-docs/DEVELOPMENT.md` for current status
3. Read `ROADMAP.md` for planned features
4. Check if feature already exists (don't duplicate)

### When Writing Code
- **FMS Scoring**: Use `Math.min()` for bilateral movements
- **Exercise Queries**: Filter by date ranges, not due_date
- **Points**: Check daily completions first
- **Types**: Import from `@/types/supabase`
- **Client**: Use `createClient()` from `@/lib/supabase/client` or `server`
- **Animations**: Use Framer Motion for all animations
- **Theme**: Use `useTheme()` from next-themes for dark mode
- **Components**: Use AnimatedCard instead of Card for polish
- **Colors**: Use Summit brand colors from tailwind.config.ts

### When Updating Database
1. Update `types/supabase.ts`
2. Update `clinic-docs/DATABASE_SCHEMA.md`

### Common File Paths
- FMS scoring logic: `clinic-app/app/employee/assessment/page.tsx:100-109`
- Exercise assignment: `clinic-app/app/employee/assessment/page.tsx:280-300`
- Review page: `clinic-app/app/employee/assessment/review/[assessmentId]/page.tsx`
- Patient dashboard: `clinic-app/app/patient/page.tsx:40-60`
- Exercise completion: `clinic-app/app/patient/exercise/[id]/page.tsx:150-180`
- Add patient flow: `clinic-app/app/employee/page.tsx:90-120`

---

## 🔗 Related Files

- **Database reference**: `clinic-docs/DATABASE_SCHEMA.md` ⭐
- **Developer guide**: `clinic-docs/DEVELOPMENT.md`
- **Design system**: `clinic-docs/STYLE_GUIDE.md`
- **Migration guide**: `clinic-docs/MIGRATION_INSTRUCTIONS.md`
- **Future plans**: `ROADMAP.md`
