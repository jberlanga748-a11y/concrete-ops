create table if not exists public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  job_id uuid not null,
  report_date date not null,
  submitted_by_user_id uuid not null,
  work_completed text not null check (char_length(trim(work_completed)) > 0),
  delays_issues text,
  materials_deliveries text,
  safety_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  constraint daily_reports_job_fk
    foreign key (company_id, job_id)
    references public.jobs (company_id, id)
    on delete restrict,
  constraint daily_reports_user_fk
    foreign key (company_id, submitted_by_user_id)
    references public.users (company_id, id)
    on delete restrict
);

create table if not exists public.daily_report_crew_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  daily_report_id uuid not null,
  employee_id uuid not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  constraint daily_report_crew_entries_report_fk
    foreign key (company_id, daily_report_id)
    references public.daily_reports (company_id, id)
    on delete cascade,
  constraint daily_report_crew_entries_employee_fk
    foreign key (company_id, employee_id)
    references public.employees (company_id, id)
    on delete restrict
);

create index if not exists idx_daily_reports_company_date
  on public.daily_reports (company_id, report_date desc);
create index if not exists idx_daily_reports_company_job_date
  on public.daily_reports (company_id, job_id, report_date desc);
create index if not exists idx_daily_report_crew_entries_company_report
  on public.daily_report_crew_entries (company_id, daily_report_id);

drop trigger if exists set_daily_reports_updated_at on public.daily_reports;
create trigger set_daily_reports_updated_at
before update on public.daily_reports
for each row execute function public.set_updated_at();

drop trigger if exists set_daily_report_crew_entries_updated_at on public.daily_report_crew_entries;
create trigger set_daily_report_crew_entries_updated_at
before update on public.daily_report_crew_entries
for each row execute function public.set_updated_at();

alter table if exists public.daily_reports enable row level security;
alter table if exists public.daily_report_crew_entries enable row level security;

drop policy if exists daily_reports_select_scoped on public.daily_reports;
create policy daily_reports_select_scoped on public.daily_reports
  for select
  to authenticated
  using (
    company_id = public.current_company_id()
    and (public.is_admin_role() or submitted_by_user_id = public.current_app_user_id())
  );

drop policy if exists daily_reports_insert_scoped on public.daily_reports;
create policy daily_reports_insert_scoped on public.daily_reports
  for insert
  to authenticated
  with check (
    company_id = public.current_company_id()
    and (public.is_admin_role() or submitted_by_user_id = public.current_app_user_id())
  );

drop policy if exists daily_reports_update_scoped on public.daily_reports;
create policy daily_reports_update_scoped on public.daily_reports
  for update
  to authenticated
  using (
    company_id = public.current_company_id()
    and (public.is_admin_role() or submitted_by_user_id = public.current_app_user_id())
  )
  with check (
    company_id = public.current_company_id()
    and (public.is_admin_role() or submitted_by_user_id = public.current_app_user_id())
  );

drop policy if exists daily_report_crew_entries_admin_only on public.daily_report_crew_entries;
create policy daily_report_crew_entries_admin_only on public.daily_report_crew_entries
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_admin_role())
  with check (company_id = public.current_company_id() and public.is_admin_role());
