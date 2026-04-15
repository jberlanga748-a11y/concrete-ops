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

alter table if exists public.companies enable row level security;
alter table if exists public.users enable row level security;
alter table if exists public.employees enable row level security;
alter table if exists public.customers enable row level security;
alter table if exists public.jobs enable row level security;
alter table if exists public.job_assignments enable row level security;
alter table if exists public.job_phases enable row level security;
alter table if exists public.time_entries enable row level security;

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
