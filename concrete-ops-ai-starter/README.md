# Concrete Ops App

Concrete Ops is the main web app in this repository. It is a Next.js App Router application backed by Supabase and currently supports role-based admin/foreman and employee workflows for field operations, documentation, and office follow-up.

## Current Product Surface
- Admin and foreman dashboard routes for jobs, time, daily reports, uploads, change orders, customers, estimates, proposals, approvals, incidents, policies, PPE, toolbox talks, notifications, employees, settings, and audit logs
- Employee portal routes for time entry, uploads, policies, and PPE
- Email/password auth with self-serve signup, invite handling, and password recovery
- AI-assisted routes for proposal scope generation, change-order rewriting, daily report cleanup, and admin ops copilot workflows
- PDF export and outbound email support for proposals, change orders, and daily reports

## Local Setup
1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Fill in the required Supabase values and any optional feature-gated values you need.
4. Run `npm ci`.
5. In a fresh Supabase environment, apply every SQL file in `supabase/migrations/` in ascending order.
6. The current migration chain is `001_core.sql` through `017_job_cost_snapshots.sql`; do not stop after `001_core.sql`.
7. Optional: run `supabase/seed.sql` if you want starter company, user, and job data.
8. Start the app with `npm run dev`.

## Environment Variables
Required for the app to boot:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key

Optional and feature-gated:
- `SUPABASE_SERVICE_ROLE_KEY`: enables admin-side signup, invite management, and invited-user linking in middleware
- `DEFAULT_COMPANY_ID`: required for the self-serve `/api/signup` flow
- `NEXT_PUBLIC_APP_URL`: preferred absolute base URL for invite links outside Vercel previews
- `OPENAI_API_KEY`: enables AI-assisted API routes
- `RESEND_API_KEY`: enables outbound record email delivery
- `RESEND_FROM_EMAIL`: sender identity for outbound record emails

## Auth And Redirect Configuration
- Add `<origin>/auth/callback` to the Supabase Auth redirect URL allow-list for every environment that should support auth email links.
- Password recovery uses `/auth/callback` and only redirects into `/reset-password` when Supabase marks the callback as a recovery flow.
- Generic signup, invite, or confirmation code exchanges continue through the normal login callback path.

## Config-Gated Features
- Password reset emails can be requested without extra app secrets, but the emailed link only works when Supabase redirect URLs include `/auth/callback`.
- Self-serve signup returns a configuration error until both `SUPABASE_SERVICE_ROLE_KEY` and `DEFAULT_COMPANY_ID` are present.
- User invite actions in Settings remain disabled until `SUPABASE_SERVICE_ROLE_KEY` is configured.
- Invite emails use `NEXT_PUBLIC_APP_URL` when present and otherwise fall back to `VERCEL_URL` in hosted preview environments.
- AI tools return configuration errors until `OPENAI_API_KEY` is set.
- Record email sending returns configuration errors until both Resend variables are set.

## Verification
- `npm run test`
- `npm run typecheck`
- `npm run build`

## Package Management
- `npm` is the canonical package manager for `concrete-ops-ai-starter`.
- Keep `package-lock.json` committed.
- CI installs dependencies with `npm ci` from this directory.
