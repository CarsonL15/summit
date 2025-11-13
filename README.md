# Summit Monorepo

**Last Updated:** November 12, 2025

This monorepo contains two independent applications for FMS-based movement screening and rehabilitation.

## 📱 Applications

### 🏥 Clinic App (`/clinic-app`)
**Summit** - A gamified rehabilitation exercise management platform for chiropractic clinics. It digitizes the Functional Movement Screen (FMS) assessment and automatically assigns corrective exercises with a mountain-climbing progress metaphor.

- **For:** Chiropractic clinics
- **Users:** Patients, Employees, Clinic Owners
- **Model:** Individual exercise assignments based on FMS scores
- **Features:** FMS assessments, exercise assignments, 4-phase mountain progression, patient progress tracking
- **Status:** ✅ v0.3.0 - Production ready with visual polish
- **Port:** 3001

### 🚒 Fire App (`/fire-app`)
**FireFMS** - A specialized FMS assessment and training platform for fire departments and first responders. Uses 3-week mini-series programs with department-wide gamification.

- **For:** Fire departments, Police, EMS, First Responders
- **Users:** Firefighters, Chiefs, Department Admins
- **Model:** 3-week mini-series programs targeting specific weaknesses
- **Features:** FMS scoring, series-based training, leaderboards, achievements, station analytics
- **Status:** 🚧 v0.1.0 - MVP in development (demo ready)
- **Port:** 3002

## 📂 Repository Structure

```
summit/
├── clinic-app/              # Chiropractic clinic application
│   ├── app/                 # Next.js App Router
│   ├── components/          # React components
│   ├── lib/                 # Utilities and helpers
│   ├── supabase/           # Database files
│   └── ...config files
│
├── fire-app/               # Fire department application
│   ├── app/                # Next.js App Router
│   ├── components/         # React components
│   ├── lib/               # Utilities and helpers
│   ├── supabase/          # Database files
│   └── ...config files
│
├── clinic-docs/            # Documentation for clinic app
│   ├── README.md
│   ├── DATABASE_SCHEMA.md
│   └── ...other docs
│
├── fire-docs/              # Documentation for fire app
│   ├── DATABASE_SCHEMA.md
│   └── SUPABASE_SETUP.md
│
├── CLAUDE.md               # AI assistant context
├── README.md               # This file
└── ROADMAP.md              # Future plans for both apps
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (for database)

### Installation

#### Clinic App
```bash
cd clinic-app
npm install
cp .env.local.example .env.local
# Add your Supabase credentials to .env.local
npm run dev
# Runs on http://localhost:3001
```

#### Fire App
```bash
cd fire-app
npm install
cp .env.local.example .env.local
# Add your Supabase credentials to .env.local
npm run dev
# Runs on http://localhost:3002
```

## 🌿 Git Workflow

This monorepo uses a branch naming convention to keep work organized:

- `dev` - Main development branch (default)
- `main` - Production branch
- `clinic/*` - Features for the clinic app
- `fire/*` - Features for the fire app
- `chore/*` - Updates to shared components or documentation

**Workflow:**
```bash
# Start new feature
git checkout dev
git pull origin dev
git checkout -b clinic/add-video-support  # or fire/chief-dashboard

# After completing work
git add .
git commit -m "feat: description"
git push origin clinic/add-video-support

# Create PR to merge back to dev
```

## 📚 Documentation

### Quick Links
- **Clinic App Docs:** `/clinic-docs/`
  - [README](clinic-docs/README.md) - Overview and features
  - [DATABASE_SCHEMA](clinic-docs/DATABASE_SCHEMA.md) - Database structure
  - [DEVELOPMENT](clinic-docs/DEVELOPMENT.md) - Development guide

- **Fire App Docs:** `/fire-docs/`
  - [DATABASE_SCHEMA](fire-docs/DATABASE_SCHEMA.md) - Database structure
  - [SUPABASE_SETUP](fire-docs/SUPABASE_SETUP.md) - Setup instructions

- **Root Docs:**
  - [CLAUDE.md](CLAUDE.md) - AI assistant context
  - [ROADMAP.md](ROADMAP.md) - Future plans

## 🛠️ Tech Stack

Both applications share similar technology:

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS + shadcn/ui
- **Animations:** Framer Motion
- **Hosting:** Vercel

## 🚀 Deployment

Each app can be deployed independently to Vercel:

### Clinic App
- Deploy from `/clinic-app` directory
- Environment variables needed (see `.env.local.example`)
- Production URL: [your-clinic-domain]

### Fire App
- Deploy from `/fire-app` directory
- Environment variables needed (see `.env.local.example`)
- Production URL: [your-fire-domain]

## 📊 Current Status

| Feature | Clinic App | Fire App |
|---------|------------|----------|
| Database Schema | ✅ Complete | ✅ Complete |
| Authentication | ✅ Working | ✅ Ready (needs setup) |
| Dashboard | ✅ All roles | 🚧 Firefighter only |
| Exercise System | ✅ Individual | 📋 Series planned |
| Gamification | ✅ Points/Streaks | 🚧 Mock data |
| Production Ready | ✅ Yes | ❌ Demo only |

## 🤝 Contributing

1. Create feature branch from `dev`
2. Follow naming convention (`clinic/*` or `fire/*`)
3. Make changes in appropriate app directory
4. Submit PR back to `dev`

---

**Important:** The applications are completely independent with separate:
- Databases (different Supabase projects)
- Authentication systems
- Deployment configurations
- No shared code or infrastructure (except UI components)