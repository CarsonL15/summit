# Fire FMS Deployment Guide

**Last Updated**: November 17, 2025
**Target Platform**: Vercel
**Deployment Date**: November 18, 2025

---

## 📋 Pre-Deployment Checklist

### ✅ Completed Before Deployment
- [x] All features implemented and tested locally
- [x] Mobile responsiveness verified across all pages
- [x] Database seeded with demo data (5 users, 40+ exercises, 5 series)
- [x] Environment variables documented
- [x] Authentication working with demo accounts
- [x] Real-time data integration confirmed
- [x] Loading states and animations tested
- [x] Points and streak logic verified
- [x] FMS assessment flow tested end-to-end
- [x] Exercise completion working with confetti
- [x] Achievement system functional

### ⏳ To Complete Tomorrow (Nov 18)
- [ ] Test production build locally
- [ ] Push code to GitHub
- [ ] Create Vercel project
- [ ] Configure environment variables in Vercel
- [ ] Deploy to Vercel
- [ ] Test production deployment
- [ ] Share demo URL

---

## 🔧 Environment Variables

### Required Variables (Set in Vercel Dashboard)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xvtlnqyzbjilbqvjnppj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

**Where to find these:**
1. Go to your Supabase project: https://supabase.com/dashboard/project/xvtlnqyzbjilbqvjnppj
2. Navigate to Settings → API
3. Copy "Project URL" for `NEXT_PUBLIC_SUPABASE_URL`
4. Copy "anon/public" key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Important:**
- These are currently in your local `.env.local` file
- Do NOT commit `.env.local` to GitHub (already in `.gitignore`)
- Add these manually in Vercel dashboard after connecting repo

---

## 🚀 Deployment Steps

### Step 1: Test Production Build Locally

Before deploying, verify the build works:

```bash
cd fire-app

# Install dependencies if needed
npm install

# Build for production
npm run build

# If build succeeds, test the production server
npm start

# Visit http://localhost:3002 and test:
# - Login with both demo accounts
# - Complete an exercise
# - Conduct an FMS assessment
# - Verify mobile responsiveness
```

**Expected Output:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB          92 kB
├ ○ /auth/login                          3.8 kB          90 kB
├ ○ /chief                               8.1 kB          95 kB
├ ○ /firefighter                         7.9 kB          94 kB
└ ...

○  (Static)  prerendered as static content
```

**If build fails:**
- Check for TypeScript errors
- Verify all imports are correct
- Ensure environment variables are set
- Check that all dependencies are installed

### Step 2: Push to GitHub

```bash
# Make sure you're in the fire-app directory
cd fire-app

# Check git status
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "feat: complete Fire FMS demo v1.0

- Implemented full firefighter dashboard with real-time data
- Built chief command center with analytics and leaderboard
- Created complete FMS assessment workflow (7 patterns)
- Added series assignment based on FMS scores
- Built exercise completion system with points/streaks
- Implemented achievement unlocking system
- Added mobile-responsive design across all pages
- Polished with animations and loading states
- Integrated Supabase for database and auth
- Ready for production deployment

Demo accounts:
- chief@firestation1.com / demo123
- john@firestation1.com / demo123"

# Push to current branch
git push origin feat/phase-three

# Or push to main if preferred
# git checkout main
# git merge feat/phase-three
# git push origin main
```

### Step 3: Create Vercel Project

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/
   - Sign in with your GitHub account

2. **Import Git Repository**
   - Click "Add New..." → "Project"
   - Select your GitHub account
   - Find "summit" repository
   - Click "Import"

3. **Configure Project Settings**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `fire-app` (IMPORTANT!)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)
   - **Node.js Version**: 20.x (default)

4. **Add Environment Variables**
   Click "Environment Variables" and add:

   ```
   Variable Name: NEXT_PUBLIC_SUPABASE_URL
   Value: https://xvtlnqyzbjilbqvjnppj.supabase.co

   Variable Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: <paste your anon key here>
   ```

   **Apply to:**
   - ✅ Production
   - ✅ Preview
   - ✅ Development

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - Vercel will automatically assign a URL

### Step 4: Verify Deployment

Once deployment completes, you'll get a URL like:
```
https://fire-fms-demo.vercel.app
```

**Test Checklist:**

1. **Landing Page**
   - [ ] Loads without errors
   - [ ] All images/icons display
   - [ ] Animations work smoothly
   - [ ] Links are functional
   - [ ] Mobile layout looks good

2. **Login Page**
   - [ ] Demo account buttons work
   - [ ] Can login with chief@firestation1.com
   - [ ] Redirects to /chief dashboard
   - [ ] Can logout and login with john@firestation1.com
   - [ ] Redirects to /firefighter dashboard

3. **Firefighter Dashboard**
   - [ ] Stats cards show real data
   - [ ] Current series displays correctly
   - [ ] Today's exercises load
   - [ ] Achievements show up
   - [ ] Can navigate to exercise detail

4. **Exercise Completion**
   - [ ] Exercise details load
   - [ ] Can complete exercise
   - [ ] Points are awarded (10 on first completion)
   - [ ] Confetti animation plays
   - [ ] Streak updates correctly
   - [ ] Second completion shows 0 points

5. **Chief Dashboard**
   - [ ] Station stats display
   - [ ] Leaderboard loads with firefighters
   - [ ] Quick action buttons work
   - [ ] Can navigate to FMS assessment

6. **FMS Assessment**
   - [ ] Firefighter list loads
   - [ ] Can select firefighter
   - [ ] Scoring buttons work (0-3)
   - [ ] Total score calculates correctly
   - [ ] Can save assessment
   - [ ] Redirects to review page

7. **Series Assignment**
   - [ ] Assessment summary shows
   - [ ] Series recommendations appear
   - [ ] Can preview exercise lists
   - [ ] Can assign series
   - [ ] Series appears in firefighter dashboard

8. **Mobile Testing**
   - [ ] Test on iPhone/Android
   - [ ] All pages responsive
   - [ ] Touch targets large enough
   - [ ] Navigation works on mobile
   - [ ] Forms are usable on small screens

### Step 5: Configure Custom Domain (Optional)

If you want a custom domain:

1. Go to Project Settings → Domains
2. Add your domain (e.g., `firefms.com`)
3. Update DNS records as instructed
4. Wait for SSL certificate (automatic)

For demo purposes, the Vercel URL works great!

---

## 🔍 Troubleshooting

### Build Fails on Vercel

**Error: Module not found**
```bash
# Check that all dependencies are in package.json
npm install
# Commit package-lock.json changes
git add package-lock.json
git commit -m "fix: update package-lock.json"
git push
```

**Error: Environment variable not defined**
- Double-check variable names (exact match required)
- Ensure variables are set for Production environment
- Redeploy after adding variables

**Error: TypeScript errors**
- Run `npm run build` locally first
- Fix any type errors
- Commit fixes and redeploy

### Runtime Errors in Production

**Database connection fails**
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Check Supabase project status
- Ensure RLS is disabled (for demo)

**Login not working**
- Check that demo users exist in Supabase Auth
- Verify email/password are correct
- Check browser console for errors
- Ensure Supabase project is not paused

**Data not loading**
- Check Supabase database has seed data
- Verify foreign key relationships
- Check browser Network tab for 401/403 errors
- Ensure anon key has proper permissions

### Deployment is Slow

- First deploy typically takes 2-3 minutes
- Subsequent deploys are faster (1-2 minutes)
- Check Vercel status page if unusually slow

---

## 📊 Post-Deployment Tasks

### 1. Update Demo URLs

Once deployed, update these files with production URL:

**README.md:**
```markdown
Live Demo: https://fire-fms-demo.vercel.app
```

**fire-docs/DEVELOPMENT.md:**
```markdown
Production URL: https://fire-fms-demo.vercel.app
```

### 2. Test All Features Again

Run through complete user flows:
- Chief creating assessment → assigning series
- Firefighter completing exercises → earning achievements
- Mobile experience on real devices

### 3. Monitor Performance

Vercel provides analytics:
- Visit Project → Analytics
- Check page load times
- Monitor error rates
- Review user engagement

### 4. Share Demo

**For Fire Chiefs Presentation:**

Email template:
```
Subject: Fire FMS Demo - Functional Movement Screen Platform

Hi [Fire Chief Name],

I'm excited to share the Fire FMS demo platform with you!

Demo URL: https://fire-fms-demo.vercel.app

You can test the system with these demo accounts:

For Chief/Admin View:
- Email: chief@firestation1.com
- Password: demo123

For Firefighter View:
- Email: john@firestation1.com
- Password: demo123

Key Features to Explore:
1. As Chief: Conduct an FMS assessment and assign a training series
2. As Firefighter: Complete exercises and track your progress
3. View the department leaderboard and achievement system
4. Test on mobile - it's fully responsive!

The platform includes:
- 7-pattern FMS assessments
- Automated series assignment based on weak areas
- 3-week progressive training programs
- Gamification with points, streaks, and achievements
- Department-wide leaderboards
- Mobile-first design for on-the-go access

Let me know if you have any questions or feedback!

Best regards,
[Your Name]
```

### 5. Gather Feedback

Track feedback in a document:
- What features do they love?
- What's confusing?
- What's missing?
- Technical issues encountered?
- Suggestions for improvement?

---

## 🎯 Success Metrics

After deployment, measure:

- **Technical Performance:**
  - [ ] Page load time < 3 seconds
  - [ ] No console errors
  - [ ] All features working as expected
  - [ ] Mobile experience smooth

- **User Engagement:**
  - [ ] Demo accounts can be accessed
  - [ ] Fire chiefs can complete test assessment
  - [ ] Exercise completion flow works end-to-end
  - [ ] Mobile users can navigate easily

- **Presentation Readiness:**
  - [ ] URL is shareable and memorable
  - [ ] No broken features during demo
  - [ ] Data appears realistic and complete
  - [ ] Animations enhance (not distract from) UX

---

## 🔄 Future Deployment Updates

### Automatic Deployments

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes locally
git add .
git commit -m "fix: update button color"
git push origin main

# Vercel automatically:
# 1. Detects the push
# 2. Runs build
# 3. Deploys to production
# 4. Updates your URL
# Takes ~2 minutes
```

### Preview Deployments

Every branch push gets a unique preview URL:

```bash
git checkout -b feature/new-feature
# Make changes
git push origin feature/new-feature

# Vercel creates preview:
# https://fire-fms-demo-git-feature-new-feature.vercel.app
# Perfect for testing before merging!
```

### Rollback if Needed

If something breaks:
1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"
4. Previous version is live in seconds

---

## 📚 Additional Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Supabase Docs**: https://supabase.com/docs
- **Vercel CLI**: https://vercel.com/docs/cli (for advanced users)

---

## 🎉 You're Ready!

Tomorrow's deployment should be smooth and straightforward. The app is fully tested, mobile-responsive, and ready to impress fire chiefs!

**Estimated Time**: 30-45 minutes for complete deployment and testing

**Confidence Level**: 🔥🔥🔥🔥🔥 (Very High)

Let's deploy and show the world what Fire FMS can do! 🚒
