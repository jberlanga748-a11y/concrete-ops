# Database-layer test suite

This suite covers:
- `lib/db/mutations.ts`
- `lib/db/queries.ts`
- `app/api/uploads/route.ts`
- Supabase RLS migration contracts under `supabase/migrations`

## Running locally

Install the app dependencies first:

```bash
npm install
npm install --no-save vitest @vitest/coverage-v8
npx vitest run
npx vitest run --coverage
```

## Structure

- `test/fixtures/databaseSeed.ts` provides deterministic seed data for isolated runs.
- `test/helpers/supabaseMock.ts` provides a chainable Supabase query-builder mock.
- `test/rls/rls-policy-contract.test.ts` protects policy names and access-control expressions from regression.

## Notes

The RLS tests are migration contract tests against SQL definitions. They validate access-control intent without requiring a live Supabase instance in CI.
