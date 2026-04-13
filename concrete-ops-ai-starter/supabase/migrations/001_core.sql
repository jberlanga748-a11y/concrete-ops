create extension if not exists pgcrypto;

create type public.app_role as enum ('owner', 'office_admin', 'foreman', 'employee');
create type public.record_status as enum ('active', 'inactive', 'invited');
create type public.job_status as enum ('proposal_sent', 'scheduled', 'in_progress', 'on_hold', 'completed', 'archived');
create type public.time_entry_status as enum ('clocked_in', 'on_break', 'clocked_out', 'approved', 'needs_review');

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  phone text,
  email text,
  address text,
  subscription_plan text default 'starter',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  auth_user_id uuid unique,
  full_name text not null,
  email text not null,
  phone text,
  role public.app_role not null,
  status public.record_status not null default 'invited',
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  full_name text not null,
  phone text,
  email text,
  crew_name text,
  job_title text,
  hourly_rate numeric(10,2),
  is_active boolean not null default true,
  hire_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  contact_name text,
  email text,
  phone text,
  billing_address text,
  notes text,
  status text default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  job_number text not null,
  name text not null,
  address text,
  status public.job_status not null default 'scheduled',
  foreman_employee_id uuid references public.employees(id) on delete set null,
  estimator_user_id uuid references public.users(id) on delete set null,
  start_date date,
  target_finish_date date,
  contract_value numeric(12,2),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, job_number)
);

create table if not exists public.job_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  assignment_role text,
  start_date date,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.job_phases (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  job_phase_id uuid references public.job_phases(id) on delete set null,
  clock_in_at timestamptz not null,
  clock_out_at timestamptz,
  break_minutes integer not null default 0,
  total_hours numeric(8,2),
  status public.time_entry_status not null default 'clocked_in',
  source text not null default 'employee_app',
  notes text,
  approved_by_user_id uuid references public.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_company_id on public.users(company_id);
create index if not exists idx_employees_company_id on public.employees(company_id);
create index if not exists idx_customers_company_id on public.customers(company_id);
create index if not exists idx_jobs_company_id on public.jobs(company_id);
create index if not exists idx_time_entries_job_id on public.time_entries(job_id);
create index if not exists idx_time_entries_employee_id on public.time_entries(employee_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_companies_updated_at before update on public.companies for each row execute function public.set_updated_at();
create trigger set_users_updated_at before update on public.users for each row execute function public.set_updated_at();
create trigger set_employees_updated_at before update on public.employees for each row execute function public.set_updated_at();
create trigger set_customers_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger set_jobs_updated_at before update on public.jobs for each row execute function public.set_updated_at();
create trigger set_time_entries_updated_at before update on public.time_entries for each row execute function public.set_updated_at();

alter table public.companies enable row level security;
alter table public.users enable row level security;
alter table public.employees enable row level security;
alter table public.customers enable row level security;
alter table public.jobs enable row level security;
alter table public.job_assignments enable row level security;
alter table public.job_phases enable row level security;
alter table public.time_entries enable row level security;

create or replace function public.current_company_id()
returns uuid
language sql
stable
as $$
  select company_id from public.users where auth_user_id = auth.uid() limit 1
$$;

create policy "company_select_companies" on public.companies
for select using (id = public.current_company_id());

create policy "company_select_users" on public.users
for select using (company_id = public.current_company_id());

create policy "company_select_employees" on public.employees
for select using (company_id = public.current_company_id());

create policy "company_select_customers" on public.customers
for select using (company_id = public.current_company_id());

create policy "company_select_jobs" on public.jobs
for select using (company_id = public.current_company_id());

create policy "company_select_job_assignments" on public.job_assignments
for select using (company_id = public.current_company_id());

create policy "company_select_job_phases" on public.job_phases
for select using (company_id = public.current_company_id());

create policy "company_select_time_entries" on public.time_entries
for select using (company_id = public.current_company_id());

create policy "company_insert_time_entries" on public.time_entries
for insert with check (company_id = public.current_company_id());
