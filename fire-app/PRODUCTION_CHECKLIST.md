# Production Ship Checklist

**Last Updated**: 2026-04-08
**Status**: Nearly production-ready (5 manual items remaining + Sentry setup)

---

## MUST DO (Blocking — app is insecure without these)

- [x] **1. Enable Row-Level Security (RLS) on all Supabase tables**
  - Policies on: `users`, `stations`, `fms_scores`, `series`, `exercises`, `series_exercises`, `series_assignments`, `exercise_completions`, `achievements`, `user_achievements`, `injuries`
  - Role escalation trigger prevents field-level abuse
  - See `supabase/rls-policies.sql`

- [x] **2. Add Next.js middleware for route protection**
  - Server-side auth + role-based routing in `middleware.ts`
  - Protected routes: `/chief/*`, `/clinic/*`, `/assessor/*`, `/firefighter/*`

- [x] **3. Remove demo credentials from login page**
  - Demo buttons hidden behind `process.env.NODE_ENV === 'development'`

- [x] **4. Fix temp password generation**
  - Uses `crypto.getRandomValues()` in server API route

- [x] **5. Move `admin.createUser()` to a server API route**
  - Server-side only at `app/api/users/create/route.ts` with service role key

- [ ] **6. Verify custom domain in Resend** *(manual — Resend dashboard)*
  - Currently sending from `onboarding@resend.dev` (test domain)
  - Verify your own domain (e.g. `notifications@yourdomain.com`)

- [ ] **7. Set Vercel environment variables** *(manual — Vercel dashboard)*
  - `NEXT_PUBLIC_APP_URL` = your production domain
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `RESEND_API_KEY`

- [x] **8. Standardize password requirements**
  - 8+ characters enforced on both signup and reset password pages

- [ ] **9. Customize Supabase email templates** *(manual — Supabase dashboard)*
  - Default emails say "powered by Supabase" — not production-ready
  - Branded templates provided in `supabase/email-templates.md`
  - Templates: Reset Password, Confirm Signup, Magic Link, Change Email, Invite User
  - Optional: Set up custom SMTP to change sender from `noreply@mail.app.supabase.io`

- [x] **10. Add UNIQUE constraint on exercise_completions**
  - Prevents double-submit race condition (user could get 10 points twice)
  - UNIQUE constraint on `(user_id, exercise_id, completed_date)`

- [x] **11. Fix open redirect in auth callback**
  - `app/auth/callback/route.ts` validates `next` starts with `/` and not `//`

- [x] **12. Add HTTP security headers in `next.config.js`**
  - X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control

---

## SHOULD DO (Important for real users)

- [x] **13. Filter queries by station**
  - RLS policies enforce station-level isolation at the database layer
  - Chiefs only see same-station data; clinic/assessor see all stations (by design)

- [x] **14. Remove `ignoreBuildErrors: true` from next.config.js**
  - TypeScript types synced with actual database schema
  - All type errors fixed; build passes clean

- [x] **15. Remove `ignoreDuringBuilds: true` for ESLint**
  - All ESLint errors fixed; build passes clean

- [x] **16. Add input validation on the email API route**
  - Validates: email format, name length (1-200), score range (0-21), risk level values, weakAreas array type

- [x] **17. Add rate limiting on the email API route**
  - In-memory rate limiter: 10 emails/minute per user
  - Returns 429 when exceeded

- [x] **18. Clean up console.log/console.error statements**
  - Removed 55 client-side console statements
  - Only 2 remain in API route catch blocks for server-side logging

- [x] **19. Add rate limiting on user creation API route**
  - 10 requests/minute per caller using `lib/rate-limit.ts`

- [x] **20. Add error boundaries so users never see a crash**
  - `app/error.tsx`, `app/not-found.tsx`, `app/global-error.tsx` all created

- [ ] **21. Add error tracking and alerts (Sentry)**
  - No error reporting currently — production errors go undetected
  - `@sentry/nextjs` provides: automatic error capture, alerts via email/Slack, performance monitoring
  - Free tier: 5k errors/month, 10k transactions/month (plenty for one fire department)
  - This covers both logging and alerting in one tool

- [x] **22. Add structured logging for production debugging**
  - `lib/logger.ts` — structured JSON logger (info/warn/error) compatible with Vercel Log Drain
  - Applied to both API routes (`/api/users/create`, `/api/email/results`)

---

## CONTENT & DATA (Required before real users)

- [ ] **23. Add exercise videos to Supabase**
  - Upload demonstration videos for each exercise
  - Update `exercises.video_url` column with URLs
  - Verify videos load on the exercise detail page

- [ ] **24. Confirm mini series are correct**
  - Review all series in `series` table (names, descriptions, target areas, difficulty)
  - Verify `series_exercises` mappings (correct exercises per week, correct order)
  - Test full 3-week progression for each series

- [ ] **25. Remove all seed data and replace with real data**
  - Delete demo/seed users, stations, FMS scores, series assignments, exercise completions
  - Insert real stations, real exercises, real series
  - Keep only the admin account for initial setup

- [x] **26. Fix series assignment algorithm to not be hard-coded**
  - Sorts by weak area match count (dynamic), alphabetical tiebreaker
  - Both assessor and clinic review pages updated

---

## NICE TO HAVE (Can ship without, add later)

- [x] **27. Pagination on large queries**
  - `.limit(500)` on user/firefighter queries, `.limit(200)` on FMS/injury queries across all pages

- [x] **28. Use specific column selects instead of `.select('*')`**
  - Narrowed selects across all pages to only fetch needed columns

- [ ] **29. Forced password change on first login**
  - So temporary passwords don't stay active indefinitely

- [ ] **30. Supabase API key migration**
  - Switch from legacy anon/service_role keys to new publishable/secret keys
  - Deadline: late 2026 (legacy keys will be deleted)
  - See `memory/project_supabase_key_migration.md` for migration steps

---

## When You Get the Production Domain

Everything in one place — do all of these when you have your domain (e.g. `app.firefms.com`):

### Vercel
- [ ] Add custom domain in Vercel dashboard (Settings → Domains)
- [ ] Set `NEXT_PUBLIC_APP_URL` env var to `https://yourdomain.com`
- [ ] Set all other env vars if not already done (#7 above)

### Supabase — URL Configuration (Authentication → URL Configuration)
- [ ] Change **Site URL** from `http://localhost:3002` to `https://yourdomain.com`
- [ ] Add **Redirect URL**: `https://yourdomain.com/auth/callback`
- [ ] Keep localhost URLs if you still want local dev to work

### Supabase — Custom SMTP (optional but recommended)
- [ ] Set up custom SMTP (Settings → Authentication → SMTP) so emails come from your domain instead of `noreply@mail.app.supabase.io`

### Resend
- [ ] Verify your domain in Resend dashboard (DNS records)
- [ ] Update `RESEND_API_KEY` env var in Vercel if using a new key
- [ ] Update sender address in `app/api/email/results/route.ts` from `onboarding@resend.dev` to your verified domain

### DNS
- [ ] Point domain to Vercel (CNAME or A record per Vercel instructions)
- [ ] SSL certificate auto-provisions via Vercel

---

## Paid Services

| Service | Free Tier | When You Need to Pay | Estimated Cost |
|---------|-----------|---------------------|----------------|
| **Vercel** | 100GB bandwidth, hobby tier | Team features, custom domain SSL, or bandwidth exceeded | ~$20/mo Pro |
| **Supabase** | 500MB DB, 50k auth users | Exceed storage/users or need backups | ~$25/mo Pro |
| **Resend** | 100 emails/day, 3k/month | More than ~100 firefighters getting regular emails | ~$20/mo |
| **Domain** | N/A | Required for production | ~$12/year |

You can start on free tiers for Vercel, Supabase, and Resend. One fire department will likely stay within free tier limits for a while.

---

## Already Done

- [x] API route authentication (only clinic/assessor/admin can send emails)
- [x] XSS protection in email templates (HTML escaping)
- [x] Sanitized error messages (internal details not leaked to client)
- [x] URL hash cleanup after token extraction on reset password page
- [x] Role-aware redirect after password set
- [x] Expired link detection and user-friendly error on reset password page
- [x] Password minimum bumped to 8 characters on reset page
- [x] TypeScript types synced with actual database schema (`types/database.ts`)
- [x] Removed orphaned chief pages (assessment, reports, firefighters, series)
- [x] Signup page disabled — redirects to login via middleware
- [x] Forgot password flow added to login page
- [x] Supabase packages updated (`@supabase/ssr` 0.10.0, `@supabase/supabase-js` 2.102.1)
- [x] Exercise completion race condition fix prepared (UNIQUE constraint — needs manual SQL)
- [x] Branded email templates created (`supabase/email-templates.md` — needs manual setup)
