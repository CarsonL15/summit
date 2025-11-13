# Summit Monorepo

This repository contains two applications for movement screening and rehabilitation:

## 📱 Applications

### 🏥 Clinic App (`/clinic-app`)
**Summit** - A gamified rehabilitation exercise management platform for chiropractic clinics. It digitizes the Functional Movement Screen (FMS) assessment and automatically assigns corrective exercises with a mountain-climbing progress metaphor.

- **For:** Chiropractic clinics
- **Users:** Patients, Employees, Clinic Owners
- **Features:** FMS assessments, exercise assignments, gamification, patient progress tracking
- **Status:** v0.3.0 - Production ready with visual polish

### 🔥 Fire App (`/fire-app`)
**FireFMS** - A specialized FMS assessment and training platform for fire departments and first responders. Features mini-series exercise programs and department-wide compliance tracking.

- **For:** Fire departments, Police, SWAT teams
- **Users:** Firefighters, Fire Chiefs
- **Features:** FMS scoring, 3-week mini-series programs, leaderboards, compliance metrics
- **Status:** v0.1.0 - MVP in development

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
│   └── README.md
│
└── shared-docs/            # Shared documentation
    └── GIT_WORKFLOW.md
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

- `clinic/*` - Features for the clinic app
- `fire/*` - Features for the fire app
- `shared/*` - Updates to shared components or documentation

**Example:**
```bash
git checkout -b clinic/add-video-support  # Working on clinic app
git checkout -b fire/mvp-dashboard       # Working on fire app
```

## 📚 Documentation

- **Clinic App:** See `/clinic-docs/README.md` for detailed clinic app documentation
- **Fire App:** See `/fire-docs/README.md` for fire app documentation
- **Git Workflow:** See `/shared-docs/GIT_WORKFLOW.md` for branching strategy
- **Deployment:** Each app deploys independently to Vercel

## 🛠️ Tech Stack

Both applications share similar technology:

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS + shadcn/ui
- **Animations:** Framer Motion
- **Hosting:** Vercel

## 📝 License

[Your License Here]

## 🤝 Contributing

Please read the documentation in `/shared-docs/` before contributing.

---

**Note:** The applications are completely independent with separate databases, authentication, and deployment. They share no infrastructure except this repository.