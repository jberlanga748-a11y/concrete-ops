create extension if not exists pgcrypto;

create type public.app_role as enum ('owner', 'office_admin', 'foreman', 'employee');
create type public.user_status as enum ('invited', 'active', 'inactive');
create type public.customer_status as enum ('active', 'inactive');
create type public.job_status as enum ('draft', 'scheduled', 'in_progress', 'on_hold', 'completed', 'archived');
create type public.assignment_role as enum ('foreman', 'lead', 'crew');
create type public.time_entry_status as enum ('clocked_in', 'on_break', 'clocked_out', 'approved', 'needs_review');
create type public.time_entry_source as enum ('employee_app', 'admin_entry', 'import');

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 1),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  logo_url text,
  phone text,
  email text,
  address text,
  subscription_plan text not null default 'starter',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  auth_user_id uuid unique,
  full_name text not null check (char_length(trim(full_name)) > 1),
  email text not null,
  phone text,
  role public.app_role not null,
  status public.user_status not null default 'invited',
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id)
);

create unique index if not exists idx_users_company_email_unique
  on public.users (company_id, lower(email));

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid,
  full_name text not null check (char_length(trim(full_name)) > 1),
  phone text,
  email text,
  crew_name text,
  job_title text,
  hourly_rate numeric(10,2) check (hourly_rate is null or hourly_rate >= 0),
  is_active boolean not null default true,
  hire_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  constraint employees_user_fk
    foreign key (company_id, user_id)
    references public.users (company_id, id)
    on delete set null
);

create unique index if not exists idx_employees_company_user_unique
  on public.employees (company_id, user_id)
  where user_id is not null;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 1),
  contact_name text,
  email text,
  phone text,
  billing_address text,
  notes text,
  status public.customer_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id)
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null,
  job_number text not null,
  name text not null check (char_length(trim(name)) > 1),
  address text,
  status public.job_status not null default 'scheduled',
  foreman_employee_id uuid,
  estimator_user_id uuid,
  start_date date,
  target_finish_date date,
  contract_value numeric(12,2) check (contract_value is null or contract_value >= 0),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  unique (company_id, job_number),
  constraint jobs_customer_fk
    foreign key (company_id, customer_id)
    references public.customers (company_id, id)
    on delete restrict,
  constraint jobs_foreman_fk
    foreign key (company_id, foreman_employee_id)
    references public.employees (company_id, id)
    on delete set null,
  constraint jobs_estimator_fk
    foreign key (company_id, estimator_user_id)
    references public.users (company_id, id)
    on delete set null,
  constraint jobs_dates_check
    check (target_finish_date is null or start_date is null or target_finish_date >= start_date)
);

create table if not exists public.job_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  job_id uuid not null,
  employee_id uuid not null,
  assignment_role public.assignment_role not null default 'crew',
  start_date date,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  unique (job_id, employee_id),
  constraint job_assignments_job_fk
    foreign key (company_id, job_id)
    references public.jobs (company_id, id)
    on delete cascade,
  constraint job_assignments_employee_fk
    foreign key (company_id, employee_id)
    references public.employees (company_id, id)
    on delete cascade,
  constraint job_assignments_dates_check
    check (end_date is null or start_date is null or end_date >= start_date)
);

create table if not exists public.job_phases (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 1),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  unique (company_id, name)
);

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null,
  job_id uuid not null,
  job_phase_id uuid,
  clock_in_at timestamptz not null,
  clock_out_at timestamptz,
  break_minutes integer not null default 0 check (break_minutes >= 0 and break_minutes <= 600),
  total_hours numeric(8,2) check (total_hours is null or total_hours >= 0),
  status public.time_entry_status not null default 'clocked_in',
  source public.time_entry_source not null default 'employee_app',
  notes text,
  approved_by_user_id uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  constraint time_entries_employee_fk
    foreign key (company_id, employee_id)
    references public.employees (company_id, id)
    on delete restrict,
  constraint time_entries_job_fk
    foreign key (company_id, job_id)
    references public.jobs (company_id, id)
    on delete restrict,
  constraint time_entries_phase_fk
    foreign key (company_id, job_phase_id)
    references public.job_phases (company_id, id)
    on delete set null,
  constraint time_entries_approved_by_fk
    foreign key (company_id, approved_by_user_id)
    references public.users (company_id, id)
    on delete set null,
  constraint time_entries_clock_window_check
    check (clock_out_at is null or clock_out_at >= clock_in_at),
  constraint time_entries_approval_check
    check ((approved_at is null and approved_by_user_id is null) or (approved_at is not null and approved_by_user_id is not null))
);

create index if not exists idx_users_company_id on public.users(company_id);
create index if not exists idx_users_auth_user_id on public.users(auth_user_id);
create index if not exists idx_employees_company_id on public.employees(company_id);
create index if not exists idx_employees_company_active on public.employees(company_id, is_active);
create index if not exists idx_customers_company_id on public.customers(company_id);
create index if not exists idx_customers_company_status on public.customers(company_id, status);
create index if not exists idx_jobs_company_id on public.jobs(company_id);
create index if not exists idx_jobs_company_status on public.jobs(company_id, status);
create index if not exists idx_jobs_company_customer on public.jobs(company_id, customer_id);
create index if not exists idx_job_assignments_company_job on public.job_assignments(company_id, job_id);
create index if not exists idx_job_assignments_company_employee on public.job_assignments(company_id, employee_id);
create index if not exists idx_job_phases_company_sort on public.job_phases(company_id, sort_order);
create index if not exists idx_time_entries_company_clock_in on public.time_entries(company_id, clock_in_at desc);
create index if not exists idx_time_entries_employee_clock_in on public.time_entries(company_id, employee_id, clock_in_at desc);
create index if not exists idx_time_entries_job_clock_in on public.time_entries(company_id, job_id, clock_in_at desc);
create index if not exists idx_time_entries_status on public.time_entries(company_id, status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.apply_time_entry_company_id()
returns trigger
language plpgsql
as $$
declare
  employee_company_id uuid;
  job_company_id uuid;
begin
  select company_id into employee_company_id from public.employees where id = new.employee_id;
  select company_id into job_company_id from public.jobs where id = new.job_id;

  if employee_company_id is null or job_company_id is null then
    raise exception 'time entry requires valid employee_id and job_id';
  end if;

  if employee_company_id <> job_company_id then
    raise exception 'employee and job must belong to the same company';
  end if;

  if new.company_id is null then
    new.company_id := employee_company_id;
  end if;

  if new.company_id <> employee_company_id then
    raise exception 'time entry company_id does not match employee/job company';
  end if;

  return new;
end;
$$;

create trigger set_companies_updated_at before update on public.companies for each row execute function public.set_updated_at();
create trigger set_users_updated_at before update on public.users for each row execute function public.set_updated_at();
create trigger set_employees_updated_at before update on public.employees for each row execute function public.set_updated_at();
create trigger set_customers_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger set_jobs_updated_at before update on public.jobs for each row execute function public.set_updated_at();
create trigger set_job_assignments_updated_at before update on public.job_assignments for each row execute function public.set_updated_at();
create trigger set_job_phases_updated_at before update on public.job_phases for each row execute function public.set_updated_at();
create trigger set_time_entries_updated_at before update on public.time_entries for each row execute function public.set_updated_at();

create trigger apply_time_entry_company_id_before_insert
before insert on public.time_entries
for each row execute function public.apply_time_entry_company_id();

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.id
  from public.users u
  where u.auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.company_id
  from public.users u
  where u.auth_user_id = auth.uid()
    and u.status = 'active'
  limit 1;
$$;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select u.role
  from public.users u
  where u.auth_user_id = auth.uid()
    and u.status = 'active'
  limit 1;
$$;

create or replace function public.is_admin_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() in ('owner', 'office_admin', 'foreman'), false);
$$;

create or replace function public.current_employee_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select e.id
  from public.employees e
  where e.company_id = public.current_company_id()
    and e.user_id = public.current_app_user_id()
  limit 1;
$$;

alter table public.companies enable row level security;
alter table public.users enable row level security;
alter table public.employees enable row level security;
alter table public.customers enable row level security;
alter table public.jobs enable row level security;
alter table public.job_assignments enable row level security;
alter table public.job_phases enable row level security;
alter table public.time_entries enable row level security;

drop policy if exists companies_select_company on public.companies;
create policy companies_select_company on public.companies
  for select
  to authenticated
  using (id = public.current_company_id());

drop policy if exists companies_update_admin on public.companies;
create policy companies_update_admin on public.companies
  for update
  to authenticated
  using (id = public.current_company_id() and public.is_admin_role())
  with check (id = public.current_company_id() and public.is_admin_role());

drop policy if exists users_select_scoped on public.users;
create policy users_select_scoped on public.users
  for select
  to authenticated
  using (
    company_id = public.current_company_id()
    and (public.is_admin_role() or auth_user_id = auth.uid())
  );

drop policy if exists users_write_admin on public.users;
create policy users_write_admin on public.users
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_admin_role())
  with check (company_id = public.current_company_id() and public.is_admin_role());

drop policy if exists employees_select_scoped on public.employees;
create policy employees_select_scoped on public.employees
  for select
  to authenticated
  using (
    company_id = public.current_company_id()
    and (public.is_admin_role() or user_id = public.current_app_user_id())
  );

drop policy if exists employees_write_admin on public.employees;
create policy employees_write_admin on public.employees
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_admin_role())
  with check (company_id = public.current_company_id() and public.is_admin_role());

drop policy if exists customers_admin_only on public.customers;
create policy customers_admin_only on public.customers
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_admin_role())
  with check (company_id = public.current_company_id() and public.is_admin_role());

drop policy if exists jobs_select_company on public.jobs;
create policy jobs_select_company on public.jobs
  for select
  to authenticated
  using (company_id = public.current_company_id());

drop policy if exists jobs_write_admin on public.jobs;
create policy jobs_write_admin on public.jobs
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_admin_role())
  with check (company_id = public.current_company_id() and public.is_admin_role());

drop policy if exists job_assignments_admin_only on public.job_assignments;
create policy job_assignments_admin_only on public.job_assignments
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_admin_role())
  with check (company_id = public.current_company_id() and public.is_admin_role());

drop policy if exists job_phases_select_company on public.job_phases;
create policy job_phases_select_company on public.job_phases
  for select
  to authenticated
  using (company_id = public.current_company_id());

drop policy if exists job_phases_write_admin on public.job_phases;
create policy job_phases_write_admin on public.job_phases
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_admin_role())
  with check (company_id = public.current_company_id() and public.is_admin_role());

drop policy if exists time_entries_select_scoped on public.time_entries;
create policy time_entries_select_scoped on public.time_entries
  for select
  to authenticated
  using (
    company_id = public.current_company_id()
    and (public.is_admin_role() or employee_id = public.current_employee_id())
  );

drop policy if exists time_entries_insert_scoped on public.time_entries;
create policy time_entries_insert_scoped on public.time_entries
  for insert
  to authenticated
  with check (
    company_id = public.current_company_id()
    and (public.is_admin_role() or employee_id = public.current_employee_id())
  );

drop policy if exists time_entries_update_scoped on public.time_entries;
create policy time_entries_update_scoped on public.time_entries
  for update
  to authenticated
  using (
    company_id = public.current_company_id()
    and (public.is_admin_role() or employee_id = public.current_employee_id())
  )
  with check (
    company_id = public.current_company_id()
    and (public.is_admin_role() or employee_id = public.current_employee_id())
  );
