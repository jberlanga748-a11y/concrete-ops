-- Seed/test data for local + Supabase manual testing.
-- This script intentionally inserts exactly one record per core entity for the first workflow.
-- Safe to run multiple times because each insert uses deterministic UUIDs + upsert behavior.

begin;

-- 1) Company
insert into public.companies (
  id,
  name,
  slug,
  email,
  subscription_plan,
  is_active
)
values (
  '11111111-1111-1111-1111-111111111111',
  'Demo Concrete Co',
  'demo-concrete',
  'owner@demo-concrete.test',
  'starter',
  true
)
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  email = excluded.email,
  subscription_plan = excluded.subscription_plan,
  is_active = excluded.is_active;

-- 2) Owner user (auth_user_id intentionally null for seed/testing)
insert into public.users (
  id,
  company_id,
  auth_user_id,
  full_name,
  email,
  role,
  status
)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  null,
  'Demo Owner',
  'owner@demo-concrete.test',
  'owner',
  'active'
)
on conflict (id) do update
set
  company_id = excluded.company_id,
  auth_user_id = excluded.auth_user_id,
  full_name = excluded.full_name,
  email = excluded.email,
  role = excluded.role,
  status = excluded.status;

-- 3) Employee
insert into public.employees (
  id,
  company_id,
  user_id,
  full_name,
  email,
  crew_name,
  job_title,
  is_active
)
values (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'Demo Worker',
  'worker@demo-concrete.test',
  'Crew A',
  'Laborer',
  true
)
on conflict (id) do update
set
  company_id = excluded.company_id,
  user_id = excluded.user_id,
  full_name = excluded.full_name,
  email = excluded.email,
  crew_name = excluded.crew_name,
  job_title = excluded.job_title,
  is_active = excluded.is_active;

-- 4) Customer
insert into public.customers (
  id,
  company_id,
  name,
  contact_name,
  email,
  status
)
values (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'Acme Development',
  'Alex Customer',
  'alex@acme.test',
  'active'
)
on conflict (id) do update
set
  company_id = excluded.company_id,
  name = excluded.name,
  contact_name = excluded.contact_name,
  email = excluded.email,
  status = excluded.status;

-- 5) Job
insert into public.jobs (
  id,
  company_id,
  customer_id,
  job_number,
  name,
  status,
  foreman_employee_id,
  estimator_user_id,
  start_date
)
values (
  '55555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  '44444444-4444-4444-4444-444444444444',
  'J-1001',
  'Demo Sidewalk Pour',
  'in_progress',
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  current_date
)
on conflict (id) do update
set
  company_id = excluded.company_id,
  customer_id = excluded.customer_id,
  job_number = excluded.job_number,
  name = excluded.name,
  status = excluded.status,
  foreman_employee_id = excluded.foreman_employee_id,
  estimator_user_id = excluded.estimator_user_id,
  start_date = excluded.start_date;

-- 6) Job phase
insert into public.job_phases (
  id,
  company_id,
  name,
  sort_order,
  is_active
)
values (
  '66666666-6666-6666-6666-666666666666',
  '11111111-1111-1111-1111-111111111111',
  'Pour',
  1,
  true
)
on conflict (id) do update
set
  company_id = excluded.company_id,
  name = excluded.name,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

commit;
