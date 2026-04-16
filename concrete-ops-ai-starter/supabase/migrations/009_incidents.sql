do $$
begin
  if not exists (select 1 from pg_type where typname = 'incident_type') then
    create type public.incident_type as enum ('near_miss', 'injury', 'property_damage', 'observation');
  end if;

  if not exists (select 1 from pg_type where typname = 'incident_status') then
    create type public.incident_status as enum ('open', 'under_review', 'closed');
  end if;
end
$$;

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  job_id uuid,
  employee_id uuid,
  reported_by_user_id uuid,
  reported_by_employee_id uuid,
  incident_type public.incident_type not null,
  incident_date date not null,
  description text not null check (char_length(trim(description)) > 0),
  corrective_action text,
  status public.incident_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  constraint incidents_job_fk
    foreign key (company_id, job_id)
    references public.jobs (company_id, id)
    on delete set null,
  constraint incidents_employee_fk
    foreign key (company_id, employee_id)
    references public.employees (company_id, id)
    on delete set null,
  constraint incidents_reported_user_fk
    foreign key (company_id, reported_by_user_id)
    references public.users (company_id, id)
    on delete set null,
  constraint incidents_reported_employee_fk
    foreign key (company_id, reported_by_employee_id)
    references public.employees (company_id, id)
    on delete set null
);

create index if not exists idx_incidents_company_created
  on public.incidents (company_id, created_at desc);
create index if not exists idx_incidents_company_date
  on public.incidents (company_id, incident_date desc);
create index if not exists idx_incidents_company_job
  on public.incidents (company_id, job_id, incident_date desc);
create index if not exists idx_incidents_company_status
  on public.incidents (company_id, status, incident_date desc);

drop trigger if exists set_incidents_updated_at on public.incidents;
create trigger set_incidents_updated_at
before update on public.incidents
for each row execute function public.set_updated_at();

alter table if exists public.incidents enable row level security;

drop policy if exists incidents_admin_only on public.incidents;
create policy incidents_admin_only on public.incidents
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_admin_role())
  with check (company_id = public.current_company_id() and public.is_admin_role());
