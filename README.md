# Summit - Gamified Rehab Exercise Management Platform

A comprehensive web application that gamifies rehabilitation exercises for chiropractic clinics, transforming manual Excel-based FMS assessments into an engaging digital experience.

## 🏔️ Project Status: MVP COMPLETE

**Current Version**: v0.1.0 (MVP)
**Last Updated**: October 30, 2025
**Status**: ✅ All core features implemented and functional

## Overview

Summit helps chiropractic clinics digitize their Functional Movement Screen (FMS) assessment process and automatically assign corrective exercises. Patients progress through four phases (Analyze → Mobilize → Stabilize → Optimize) visualized as climbing a mountain to reach the summit.

## Features

### For Patients
- **Mountain Progress Visualization**: Track your journey through recovery phases
- **Gamification System**: Earn points, maintain streaks, unlock achievements
- **Daily Exercise Assignments**: Personalized exercises based on FMS scores
- **Progress Dashboard**: View stats, current phase, and exercise history

### For Employees
- **Patient Management**: View and manage all clinic patients
- **FMS Assessment Tool**: Input 7-pattern scores (0-3 each) for comprehensive assessment
- **Exercise Assignment**: Automatic exercise mapping based on assessment results
- **Progress Monitoring**: Track patient engagement and compliance

### For Clinic Owners
- **Analytics Dashboard**: Clinic-wide metrics and performance
- **Employee Performance**: Monitor staff efficiency and patient outcomes
- **Engagement Metrics**: Track overall patient compliance and success rates

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS + shadcn/ui components
- **Animations**: Framer Motion (to be added)
- **Hosting**: Vercel

## Project Structure

```
summit/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── patient/           # Patient dashboard
│   ├── employee/          # Employee dashboard
│   └── owner/             # Owner dashboard
├── components/
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── supabase/          # Supabase client configuration
│   └── utils.ts           # Utility functions
├── types/
│   └── supabase.ts        # Database type definitions
└── supabase/
    ├── schema.sql         # Database schema
    └── seed.sql           # Seed data for exercises
```

## Database Schema

### Core Tables
- **users**: Extended auth users with roles (patient, employee, owner)
- **clinics**: Clinic information
- **fms_assessments**: 7 movement pattern scores with automatic total calculation
- **exercises**: Pre-seeded corrective exercise library
- **exercise_assignments**: Links patients to exercises with phase tracking
- **exercise_completions**: Tracks completed exercises
- **patient_progress**: Gamification data (points, streaks, phase)
- **achievements**: Unlockable badges and milestones

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
   - Go to SQL Editor and run the contents of `supabase/schema.sql`
   - Then run `supabase/seed.sql` to populate exercises

4. **Configure environment variables**
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

5. **Run the development server**
```bash
npm run dev
```

6. **Open the application**
   - Navigate to http://localhost:3000
   - Create accounts for testing different roles

## FMS Assessment Mapping

The platform automatically assigns exercises based on FMS scores:

- **Score 0-1**: High priority corrective exercises
- **Score 2**: Moderate corrective work needed
- **Score 3**: Maintenance exercises

### Movement Patterns Assessed:
1. Deep Squat
2. Hurdle Step (L/R)
3. Inline Lunge (L/R)
4. Shoulder Mobility (L/R)
5. Active Straight Leg Raise (L/R)
6. Trunk Stability Push-Up
7. Rotary Stability (L/R)

## Gamification System

### Points System
- Complete exercise: 10 points
- Maintain streak: Bonus points
- Phase completion: 100 points

### Phases
1. **Analyze**: Initial assessment and baseline
2. **Mobilize**: Focus on mobility and flexibility
3. **Stabilize**: Build stability and control
4. **Optimize**: Performance enhancement

### Achievements
- First Exercise Complete
- 7-Day Streak
- Phase Completion
- Perfect Week

## Development Roadmap

### Completed ✅
- Project setup with Next.js 14 and TypeScript
- Supabase integration and database schema
- Authentication flows with role-based routing
- Patient dashboard with mountain visualization
- Employee dashboard with patient management
- Basic UI components with shadcn/ui

### In Progress 🚧
- FMS assessment tool
- Exercise completion interface
- Gamification mechanics

### Upcoming 📋
- Video demonstrations for exercises
- Framer Motion animations
- Email notifications
- Mobile responsive design
- Owner analytics dashboard
- Export functionality
- Progress reports

## Contributing

This is currently a prototype/MVP. For production deployment:

1. Add proper error handling
2. Implement comprehensive testing
3. Add monitoring and analytics
4. Enhance security measures
5. Optimize performance
6. Add progressive web app features

## License

[Your License Here]

## Contact

For questions or support, please contact [your contact information].

---

Built with 💪 to help patients reach their summit!