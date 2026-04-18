# Concrete Ops

Concrete Ops is a Next.js and Supabase application for concrete contractors. The live app in this repo includes separate admin/foreman and employee workspaces, plus field documentation, compliance, customer, estimating, proposal, and change-order workflows.

## Repo Layout
- `concrete-ops-ai-starter/`: main web app
- `concrete-ops-ai-starter/supabase/`: schema migration and seed SQL
- `concrete-ops-ai-starter/docs/`: product and implementation notes

## Run The App
1. `cd concrete-ops-ai-starter`
2. Copy `.env.example` to `.env.local`
3. Fill in the required Supabase values and any optional feature-gated keys you plan to use
4. `npm ci`
5. Create a fresh Supabase project
6. Apply every SQL file in `supabase/migrations/` in ascending order, from `001_core.sql` through `017_job_cost_snapshots.sql`
7. Optional: load `supabase/seed.sql`
8. `npm run dev`

## Verification
- `npm run test`
- `npm run typecheck`
- `npm run build`

## Config-Gated Features
- Password recovery emails require Supabase Auth redirect URLs to include `<origin>/auth/callback`.
- Self-serve signup requires `SUPABASE_SERVICE_ROLE_KEY` and `DEFAULT_COMPANY_ID`.
- User invites require `SUPABASE_SERVICE_ROLE_KEY`, and invite links are best configured with `NEXT_PUBLIC_APP_URL`.
- AI-assisted routes require `OPENAI_API_KEY`.
- Record email sending requires `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.

See `concrete-ops-ai-starter/README.md` for app-specific setup details.
