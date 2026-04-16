create table if not exists public.job_cost_snapshots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  snapshot_date date not null default current_date,
  actual_labor_hours numeric(12,2) not null default 0,
  actual_labor_cost numeric(12,2) not null default 0,
  approved_change_order_total numeric(12,2) not null default 0,
  projected_revenue_total numeric(12,2) not null default 0,
  time_entry_count integer not null default 0,
  daily_report_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (company_id, job_id)
);

create index if not exists idx_job_cost_snapshots_company_job
  on public.job_cost_snapshots (company_id, job_id);

create index if not exists idx_job_cost_snapshots_company_updated
  on public.job_cost_snapshots (company_id, updated_at desc);

alter table public.job_cost_snapshots enable row level security;

create policy "job_cost_snapshots_admin_only"
  on public.job_cost_snapshots
  for all
  using (company_id = public.current_company_id() and public.is_admin_role())
  with check (company_id = public.current_company_id() and public.is_admin_role());
