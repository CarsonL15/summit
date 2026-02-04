# Summit - AI Assistant Context File

**Last Updated**: October 31, 2025
**Version**: 0.3.0 (Visual Polish Complete)
**Purpose**: Quick reference for Claude Code or other AI assistants

---

## 🎯 Project Overview

**Summit** is a gamified rehabilitation exercise management platform for chiropractic clinics. It digitizes the Functional Movement Screen (FMS) assessment and automatically assigns corrective exercises with a mountain-climbing progress metaphor.

### Key Concept
Patients "climb the mountain" through 4 phases (Analyze → Mobilize → Stabilize → Optimize) by completing exercises assigned based on their FMS assessment scores.

---

## 📂 Project Structure

```
summit/
├── app/                          # Next.js 14 App Router
│   ├── page.tsx                  # ✨ Landing page with animations
│   ├── auth/
│   │   ├── login/                # ✨ Polished with animations
│   │   ├── signup/               # ✨ Polished with animations
│   │   └── reset-password/       # ✨ Polished with animations
│   ├── patient/
│   │   ├── page.tsx              # ✨ Mountain visualization, theme toggle
│   │   └── exercise/[id]/        # ✨ Celebration animations
│   ├── employee/
│   │   ├── page.tsx              # ✨ Polished dashboard
│   │   ├── assessment/
│   │   │   ├── page.tsx          # ✨ Animated scoring interface
│   │   │   └── review/[id]/      # ✨ Collapsible panels, animations
│   │   └── patient/[id]/         # ✨ Animated progress cards
│   └── owner/                    # ✨ Polished analytics
├── components/
│   ├── ui/
│   │   ├── animated-card.tsx     # ✨ NEW: Framer Motion cards
│   │   ├── progress-bar.tsx      # ✨ NEW: Animated progress
│   │   ├── skeleton.tsx          # ✨ NEW: Loading states
│   │   └── [shadcn]              # shadcn/ui components
│   └── theme-provider.tsx        # ✨ NEW: Dark mode provider
├── lib/supabase/                 # Supabase client setup
├── types/supabase.ts             # Database TypeScript types
├── supabase/
│   ├── schema.sql                # Initial database schema
│   └── seed.sql                  # 40+ exercise seed data
├── DATABASE_SCHEMA.md            # ⭐ SINGLE SOURCE OF TRUTH for DB
├── DEVELOPMENT.md                # Development guide & testing
├── ROADMAP.md                    # Future features & timeline
├── STYLE_GUIDE.md                # ✨ NEW: Design system & brand guide
└── README.md                     # Main project documentation
```

---

## 🗄️ Database Schema (8 Tables, 88 Columns)

**IMPORTANT**: Always check `DATABASE_SCHEMA.md` before making database changes!

### Core Tables:
1. **clinics** - Clinic information
2. **users** - User profiles (extends auth.users) with roles
3. **fms_assessments** - FMS scores (7 patterns, max 21 points)
4. **exercises** - Exercise library (40+ pre-seeded)
5. **exercise_assignments** - Patient exercise assignments with date ranges
6. **exercise_completions** - Daily completion tracking
7. **patient_progress** - Gamification (points, streaks, phase)
8. **achievements** - Earned badges

### Key Database Rules:
- **FMS Scoring**: Bilateral movements use LOWER of L/R scores (max 21 total)
- **Date Ranges**: Exercises use `start_date` and `end_date` (not single `due_date`)
- **Daily Tracking**: `completion_date` tracks daily completions via trigger
- **Custom Parameters**: `custom_sets`, `custom_reps`, `total_completions_required` per assignment

---

## 🔑 Key Business Logic

### FMS Assessment Flow:
1. Employee conducts 7-pattern FMS assessment
2. Bilateral movements scored (take lower of L/R)
3. Scores ≤1 trigger **1 exercise per category** (~5-7 total)
4. Redirect to review page for customization
5. Employee adjusts sets/reps/program duration
6. Patient sees exercises immediately

### Exercise Completion:
- Patients can complete exercises **multiple times per day**
- **10 points** awarded only on **FIRST daily completion**
- Subsequent completions same day = 0 points (no double-dipping)
- Streak maintained by completing ANY exercise each day

### Patient Onboarding:
1. Employee clicks "Add New Patient"
2. System generates temp password (user never sees it)
3. Patient receives **password reset email**
4. Patient sets own password via reset link
5. Patient auto-assigned to employee's clinic

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL with Row Level Security - currently disabled)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS + shadcn/ui components
- **Animations**: Framer Motion ✨ NEW
- **Theme**: next-themes (dark/light mode) ✨ NEW
- **Hosting**: Vercel
- **Package Manager**: npm
- **Dev Server**: `npm run dev` (runs on port 3001)

### Important Dependencies:
- `@supabase/supabase-js` - Supabase client
- `@supabase/ssr` - Server-side rendering support
- `framer-motion` - ✨ Animation library
- `next-themes` - ✨ Theme switching
- `canvas-confetti` - Celebration animations
- `lucide-react` - Icons
- `class-variance-authority`, `clsx`, `tailwind-merge` - Utility classes

---

## 📋 Common Commands

```bash
# Development
npm run dev          # Start dev server (http://localhost:3001)

# Production
npm run build        # Build for production
npm start            # Start production server

# Linting
npm run lint         # Run Next.js linter
```

---

## 🚨 Critical Things to Know

### 1. Database Schema Changes
- **ALWAYS** read `DATABASE_SCHEMA.md` first
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

### Quick Test (Employee → Patient Flow):
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

### Test FMS Scoring:
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

## 📈 Current Phase Status

### ✅ Phase 1 Complete (Oct 30, 2025)
- MVP with all core features

### ✅ Phase 2 Complete (Oct 31, 2025)
- Fixed exercise visibility
- Fixed FMS scoring
- Exercise review & customization
- Password reset flow
- Daily tracking improvements

### ✅ Visual Polish Complete (Oct 31, 2025) ✨ NEW
- Global dark/light mode with next-themes
- Framer Motion animations across all pages
- Summit brand colors (#0d3d62, #afa586)
- AnimatedCard, ProgressBar, Skeleton components
- Landing page redesign with hero & features
- STYLE_GUIDE.md for consistent design
- 11+ pages polished with animations

### 🔄 Phase 3 Next (Recommended):
1. ✅ ~~Framer Motion animations~~ - COMPLETED!
2. Video integration (3-4 hrs)
3. Email notifications (4-5 hrs)
4. Phase progression logic (3-4 hrs)
5. Mobile optimization (2-3 hrs)

---

## 💡 Quick Tips for AI Assistants

### Before Making Changes:
1. Read `DATABASE_SCHEMA.md` if touching database
2. Read `DEVELOPMENT.md` for current status
3. Read `ROADMAP.md` for planned features
4. Check if feature already exists (don't duplicate)

### When Writing Code:
- **FMS Scoring**: Use `Math.min()` for bilateral movements
- **Exercise Queries**: Filter by date ranges, not due_date
- **Points**: Check daily completions first
- **Types**: Import from `@/types/supabase`
- **Client**: Use `createClient()` from `@/lib/supabase/client` or `server`
- **Animations**: Use Framer Motion for all animations ✨ NEW
- **Theme**: Use `useTheme()` from next-themes for dark mode ✨ NEW
- **Components**: Use AnimatedCard instead of Card for polish ✨ NEW
- **Colors**: Use Summit brand colors from tailwind.config.ts ✨ NEW

### When Updating Database:
1. Update `types/supabase.ts`
2. Update `DATABASE_SCHEMA.md`

### Common File Paths:
- FMS scoring logic: `app/employee/assessment/page.tsx:100-109`
- Exercise assignment: `app/employee/assessment/page.tsx:280-300`
- Review page: `app/employee/assessment/review/[assessmentId]/page.tsx`
- Patient dashboard query: `app/patient/page.tsx:40-60`
- Exercise completion: `app/patient/exercise/[id]/page.tsx:150-180`
- Add patient flow: `app/employee/page.tsx:90-120`

---

## 🔗 Related Files

- **User-facing docs**: `README.md`
- **Developer guide**: `DEVELOPMENT.md`
- **Future plans**: `ROADMAP.md`
- **Database reference**: `DATABASE_SCHEMA.md` ⭐
- **Design system**: `STYLE_GUIDE.md` ✨ NEW
- **This file**: `CLAUDE.md`

---

**Remember**: This project is fully polished and ready for client demo! The visual design is complete with animations and dark mode. Core functionality works well. Next focus should be on videos or production readiness (email notifications).
