# Launch Review Checklist

## Release Gate

Run the same verification chain before every launch candidate or merge checkpoint:

```bash
npm ci
npm run test
npm run typecheck
npm run build
```

## Visual QA Routes

### Owner and office admin

- `/dashboard`
- `/dashboard/time`
- `/dashboard/daily-reports`
- `/dashboard/change-orders`
- `/dashboard/uploads`
- `/dashboard/approvals`
- `/dashboard/settings`

### Foreman

- `/dashboard/foreman`
- `/dashboard/jobs`
- `/dashboard/daily-reports`
- `/dashboard/change-orders`
- `/dashboard/uploads`
- `/dashboard/time`

### Employee

- `/employee`
- `/employee/time`
- `/employee/uploads`
- `/employee/policies`
- `/employee/ppe`

## Role-Access QA

- Unauthenticated visitors should be redirected back through the correct `next=` destination for office, foreman, and employee entrypoints.
- Employee users should be redirected away from the dashboard shell to `/employee`.
- Owner and office-admin users should be redirected away from `/employee` to `/dashboard`.
- Foremen should be redirected away from office-only routes to `/dashboard/foreman`.
- Admin Ops Copilot should only surface for owner and office-admin roles.
- Shared modules should preserve the existing shared date and time rendering behavior across office and foreman views.

## Launch-Sensitive Workflows

- Office command view: dashboard metrics should fail visibly instead of silently showing zeroed activity.
- Employee portal: missing employee linkage should show setup guidance, while data-service failures should show an explicit error state.
- Shared uploads, daily reports, change orders, and approvals are the main regression hotspots when role or access hardening changes land.
- Settings, audit logs, and approvals should render clear empty and error states rather than blank tables.

## Regression Suites To Watch

- `tests/auth/access-routing.test.ts`
- `tests/ui/dashboard-page.test.tsx`
- `tests/ui/dashboard-route-access.test.tsx`
- `tests/ui/employee-home-page.test.tsx`
- `tests/ui/launch-role-access.test.tsx`
- `tests/ui/shared-dashboard-release-readiness.test.tsx`
- `tests/ui/shared-dashboard-role-visibility.test.tsx`
