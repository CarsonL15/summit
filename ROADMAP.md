# Summit Monorepo - Development Roadmap

**Last Updated**: November 30, 2025

This roadmap covers both applications in the monorepo: the production-ready Clinic App and the Fire App (deployed with clinic role feature).

## 🏥 Clinic App Status: Production Ready (v0.3.0)

All MVP features plus Phase 2 enhancements and visual polish are complete. The platform has immediate exercise visibility, proper FMS scoring, exercise customization, professional patient onboarding, and comprehensive animations with dark/light mode.

## 🚒 Fire App Status: Deployed with Clinic Feature (v0.2.0)

Core MVP deployed to Vercel. Clinic role feature implemented allowing clinic staff to:
- Conduct FMS assessments on firefighters AND chiefs
- Create chief and firefighter accounts with temp passwords
- Manage station personnel
- Assign exercise series based on FMS results

---

## ✅ Fire App - Completed Features

### Phase 1: Core MVP (November 18, 2025)
1. ✅ Supabase client/server setup with TypeScript types
2. ✅ Firefighter dashboard with real-time data
3. ✅ Chief command center with analytics
4. ✅ Complete FMS assessment workflow
5. ✅ Series assignment based on FMS scores
6. ✅ Exercise completion with points/streaks
7. ✅ Achievement system
8. ✅ Mobile-responsive across all pages
9. ✅ Animated cards and loading states
10. ✅ Login with demo account quick-fill
11. ✅ Deployed to Vercel

### Phase 2: Clinic Role Feature (November 30, 2025)
1. ✅ Clinic dashboard (`/clinic`) - Assessment-focused interface
2. ✅ FMS assessment page - Can assess both chiefs AND firefighters
3. ✅ Series assignment after assessment
4. ✅ Team roster management (`/clinic/team`)
5. ✅ Add chief/firefighter accounts with temp password display
6. ✅ Chiefs can no longer add firefighters (clinic-only)
7. ✅ Login redirects for clinic role
8. ✅ Database constraint updated for 'clinic' role
9. ✅ Profile page updated for clinic role

---

## 🔥 Fire App - Remaining Work (Priority Order)

### High Priority (Before Next Demo)

#### 1. Injury Tracking for Clinic ⏱️ 4-5 hours
- [ ] Create `/clinic/injuries` page
- [ ] Log injuries during or after FMS assessment
- [ ] Link injuries to specific users
- [ ] Track injury type, date, severity, notes
- [ ] View injury history per firefighter
- [ ] Chiefs can view (read-only) injury reports

#### 2. FMS Assessment History ⏱️ 3-4 hours
- [ ] View previous FMS assessments for a user
- [ ] Compare scores over time (score trend chart)
- [ ] Show improvement/decline indicators
- [ ] Add "View History" button on team roster
- [ ] Display last assessment date prominently

#### 3. Password Change Feature ⏱️ 2-3 hours
- [ ] Add "Change Password" to profile page
- [ ] First-login password change prompt (optional)
- [ ] Validate new password requirements
- [ ] Success confirmation

### Medium Priority (Post-Demo Enhancements)

#### 4. Reassessment Workflow ⏱️ 2-3 hours
- [ ] "Due for reassessment" indicator (e.g., 90 days since last)
- [ ] Filter team roster by assessment status
- [ ] Quick "reassess" action from team list
- [ ] Reassessment reminders/notifications

#### 5. Clinic Dashboard Analytics ⏱️ 3-4 hours
- [ ] Assessments completed this week/month
- [ ] Department-wide average FMS score
- [ ] Score trends over time (improving vs declining)
- [ ] Personnel needing attention (low scores, overdue assessments)

#### 6. Series Management for Clinic ⏱️ 2-3 hours
- [ ] View all active series assignments
- [ ] Reassign or cancel series
- [ ] Track series completion rates
- [ ] See which series are most effective

### Lower Priority (Future Iterations)

#### 7. Multi-Station Support
- [ ] Clinic assigned to multiple stations
- [ ] Station selector in clinic dashboard
- [ ] Cross-station reporting
- [ ] Separate manager app for multi-station admin

#### 8. Email Notifications
- [ ] Welcome email with credentials
- [ ] Assessment completion notifications
- [ ] Series assignment notifications
- [ ] Weekly progress summaries

#### 9. Advanced Reporting
- [ ] Export data to CSV/PDF
- [ ] Custom date range reports
- [ ] Injury correlation with FMS scores
- [ ] ROI metrics (cost savings from injury prevention)

---

## 📋 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Clinic | clinic@firestation1.com | demo123 |
| Chief | chief@firestation1.com | demo123 |
| Firefighter | john@firestation1.com | demo123 |

---

## 📋 Clinic App - Next Steps

### Phase 3: Advanced Features

#### High Priority
1. **Video Upload/Integration** ⏱️ 3-4 hours
   - Supabase Storage setup for videos
   - Video upload interface for exercises
   - Video player component
   - YouTube/Vimeo URL integration option

2. **Email Notifications** ⏱️ 4-5 hours
   - Resend or SendGrid integration
   - Welcome email template
   - Exercise assignment notifications
   - Streak reminder emails

#### Medium Priority
4. **Phase Progression Logic** ⏱️ 3-4 hours
   - Automatic advancement based on completion rate
   - Phase requirements (e.g., 80% completion to advance)
   - Stabilize → Optimize progression
   - Manual override for employees

5. **Owner Analytics Enhancements** ⏱️ 3-4 hours
   - Date range filters
   - Charts and graphs (Chart.js or Recharts)
   - Export to CSV/PDF
   - Trend analysis
   - Comparison metrics (month over month)

6. **Patient Profile Management** ⏱️ 2 hours
   - Edit profile page
   - Profile photo upload
   - Contact information
   - Emergency contact
   - Medical history notes

#### Lower Priority
7. **Exercise History Page** ⏱️ 2 hours
   - Patient view of all completed exercises
   - Calendar view of activity
   - Personal records tracking
   - Exercise streaks per category

8. **Achievement System Expansion** ⏱️ 2-3 hours
    - More achievement types
    - Milestone badges (10, 25, 50, 100 exercises)
    - Category-specific achievements
    - Monthly challenges
    - Achievement showcase page

9. **Search & Filters** ⏱️ 2 hours
    - Employee dashboard filters (phase, activity status)
    - Exercise library search
    - Assessment history filters
    - Date range selectors

10. **Mobile App Considerations** ⏱️ Research
    - PWA setup
    - Push notifications
    - Offline support
    - Mobile-specific UI improvements

---

## 🔧 Technical Debt & Improvements

### Code Quality
- [ ] Add comprehensive error handling
- [ ] Implement loading states consistently
- [ ] Add form validation with Zod
- [ ] Write unit tests (Jest + React Testing Library)
- [ ] Add E2E tests (Playwright or Cypress)
- [ ] Implement proper TypeScript types throughout
- [ ] Add JSDoc comments for complex functions

### Performance
- [ ] Optimize image loading (Next.js Image component)
- [ ] Implement lazy loading for heavy components
- [ ] Add pagination for long lists
- [ ] Optimize database queries (reduce N+1 queries)
- [ ] Implement caching strategy
- [ ] Add service worker for PWA

### Security
- [ ] Re-enable and refine RLS policies
- [ ] Implement rate limiting
- [ ] Add CSRF protection
- [ ] Sanitize user inputs
- [ ] Implement content security policy
- [ ] Add audit logging

### UX Improvements
- [ ] Add skeleton loaders
- [ ] Improve error messages
- [ ] Add confirmation dialogs for destructive actions
- [ ] Implement undo functionality
- [ ] Add keyboard shortcuts
- [ ] Improve accessibility (ARIA labels, focus management)

---

---

## 🚀 Phase 4: Advanced Features

### Advanced Gamification
- [ ] Leaderboards (clinic-wide, global)
- [ ] Challenges and competitions
- [ ] Reward tiers (Bronze, Silver, Gold)
- [ ] Customizable avatars
- [ ] Virtual rewards/unlockables
- [ ] Social features (share achievements)

### Clinical Features
- [ ] Custom assessment templates
- [ ] Progress photos tracking
- [ ] Pain scale tracking
- [ ] Range of motion measurements
- [ ] Note-taking for each session
- [ ] Treatment plans beyond FMS

### Multi-Clinic Support
- [ ] Organization accounts above clinics
- [ ] Clinic branding customization
- [ ] Multi-clinic reporting for franchises
- [ ] Clinic switching for employees

### Communication
- [ ] In-app messaging between employee and patient
- [ ] Appointment scheduling
- [ ] Reminder system
- [ ] Exercise feedback loop
- [ ] Video call integration for remote sessions

### Billing & Subscription
- [ ] Stripe integration
- [ ] Per-clinic subscription tiers
- [ ] Per-patient billing
- [ ] Invoice generation
- [ ] Payment history

---

## 🎨 UI/UX Enhancements

### Design Improvements
- [ ] Dark mode support
- [ ] Custom themes per clinic
- [ ] Improved print styles
- [ ] Better mobile navigation
- [ ] Onboarding tour for new users
- [ ] Help tooltips and documentation

### Data Visualization
- [ ] Progress charts (line/bar graphs)
- [ ] FMS score comparisons over time
- [ ] Exercise completion heatmap
- [ ] Body map for pain/mobility tracking
- [ ] Interactive mountain visualization

---

## 🏗️ Infrastructure

### DevOps
- [ ] Set up CI/CD pipeline
- [ ] Automated testing in CI
- [ ] Staging environment
- [ ] Database backups
- [ ] Monitoring (Sentry, LogRocket)
- [ ] Performance monitoring (Vercel Analytics)

### Database
- [ ] Database migrations system
- [ ] Backup and restore procedures
- [ ] Data retention policies
- [ ] Archive old data

### Documentation
- [ ] API documentation
- [ ] Component storybook
- [ ] User manuals for each role
- [ ] Video tutorials
- [ ] Deployment guide

---

## 📅 Suggested Timeline

### ✅ Phase 1: MVP (Completed Oct 30, 2025)
- Core authentication and dashboards
- FMS assessment tool
- Exercise assignment and completion
- Basic gamification

### ✅ Phase 2: Critical Fixes (Completed Oct 31, 2025)
- Fixed exercise visibility
- Fixed FMS scoring
- Exercise customization
- Professional onboarding

### Phase 3: Polish & Enhancements (Next 1-2 weeks)
- Animations (Framer Motion)
- Video integration
- Email notifications
- Phase progression logic

### Phase 4: Analytics & Advanced Features (Weeks 3-4)
- Enhanced owner analytics
- Patient profile management
- Exercise history
- Achievement expansion

### Phase 5: Testing & Refinement (Month 2)
- Comprehensive testing
- Security hardening
- Performance optimization
- Bug fixes

### Phase 6: Advanced Gamification (Month 3)
- Leaderboards
- Challenges
- Enhanced achievement system
- Social features

### Phase 7: Scale & Growth (Month 4+)
- Multi-clinic support
- Advanced clinical features
- Mobile app
- Billing integration

---

## 🎯 Success Metrics

### Phase 1 Goals (Achieved ✅)
- ✅ Functional assessment tool
- ✅ Automated exercise assignment
- ✅ Patient engagement gamification
- ✅ Multi-role system working
- ✅ Data persistence and tracking

### Phase 2 Goals (Achieved ✅)
- ✅ Exercise visibility fixed
- ✅ FMS scoring accurate
- ✅ Exercise customization working
- ✅ Professional patient onboarding
- ✅ Complete documentation
- ✅ Ready for client demo

### Phase 3 Goals (In Progress)
- [ ] 80%+ exercise completion rate
- [ ] Average 5+ day patient streaks
- [ ] Employee time savings (50% faster vs Excel)
- [ ] Positive user feedback from pilot clinic
- [ ] Video content integrated
- [ ] Animations polished

### Long-term Goals
- [ ] 10+ clinic customers
- [ ] 1000+ active patients
- [ ] 90%+ patient retention
- [ ] Measurable improvement in FMS scores
- [ ] Reduced patient dropout rates

---

## 🤔 Open Questions / Decisions Needed

1. **Video Hosting**: Self-host on Supabase or use YouTube/Vimeo?
2. **Email Service**: Resend, SendGrid, or Amazon SES?
3. **Charts Library**: Chart.js, Recharts, or D3?
4. **Mobile Strategy**: PWA first or native app?
5. **Pricing Model**: Per-clinic, per-patient, or per-employee?
6. **Branding**: Allow clinic white-labeling?
7. **Data Export**: What formats needed? (CSV, PDF, XLSX?)

---

## 📞 Next Session Prep

### Before You Start Tomorrow:
1. Review `DEVELOPMENT.md` for Phase 2 summary
2. Review `README.md` for complete feature list
3. Check `DATABASE_SCHEMA.md` if working with database
4. Run `npm run dev` to ensure everything still works
5. Decide which feature from Phase 3 to tackle first
   - **Recommended**: Start with Framer Motion animations for polish
   - **Alternative**: Video integration if you have video content ready
   - **Alternative**: Email notifications for production readiness

### Quick Start Commands:
```bash
# Start development server
npm run dev

# Check if Supabase is connected
# (Visit http://localhost:3001 and try logging in)

# Test password reset flow
# (Add a patient via employee dashboard, check email)

# Verify FMS scoring
# (Create assessment with bilateral movements, check score ≤ 21)

# Test daily tracking
# (Complete same exercise multiple times, verify points only on first)
```

### Phase 2 Recap:
- ✅ 10 major features completed
- ✅ 5 critical bugs fixed
- ✅ 3 database migrations applied
- ✅ Complete documentation written
- ✅ Ready for client demo

### Recommended Next Features (in order):
1. **Framer Motion Animations** - Quick visual polish (2-3 hrs)
2. **Video Integration** - Core functionality enhancement (3-4 hrs)
3. **Email Notifications** - Production readiness (4-5 hrs)
4. **Phase Progression Logic** - Gamification enhancement (3-4 hrs)

---

**Last Updated**: November 30, 2025 (Clinic Role Feature Complete)
**Next Review**: After Fire App High Priority Features