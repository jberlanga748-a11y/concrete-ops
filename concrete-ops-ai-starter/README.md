# Concrete Ops AI Starter

## What this gives you
- Next.js starter structure
- Supabase browser/server clients
- login page scaffold
- admin dashboard scaffold
- jobs list and job detail starter pages
- employee clock-in starter component
- admin labor mirror table
- first Supabase SQL migration
- AI route placeholders

## Start
1. Create a new Supabase project.
2. Copy `.env.example` to `.env.local` and fill in your values.
3. Run `npm install`.
4. Run the SQL in `supabase/migrations/001_core.sql`.
5. Create at least one company, user, employee, customer, job, and phase in Supabase.
6. Start the app with `npm run dev`.

## Package management
- `npm` is the canonical package manager for `concrete-ops-ai-starter`.
- Keep `package-lock.json` committed and do not add `pnpm-lock.yaml`.
- CI installs dependencies with `npm ci` from the app directory.

## Important note
The employee clock card uses real database IDs. Until you add seed data, use Supabase directly or add a seed script.

## Recommended next files to add
- seed script
- daily reports schema
- documents storage schema
- auth callback route
- real role middleware redirect logic
- estimate/proposal/change-order tables
