create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_user_id uuid,
  actor_employee_id uuid,
  action_type text not null check (char_length(trim(action_type)) > 0),
  target_table text not null check (char_length(trim(target_table)) > 0),
  target_id uuid not null,
  summary text not null check (char_length(trim(summary)) > 0),
  created_at timestamptz not null default now(),
  unique (company_id, id),
  constraint audit_logs_actor_user_fk
    foreign key (company_id, actor_user_id)
    references public.users (company_id, id)
    on delete set null,
  constraint audit_logs_actor_employee_fk
    foreign key (company_id, actor_employee_id)
    references public.employees (company_id, id)
    on delete set null
);

create index if not exists idx_audit_logs_company_created
  on public.audit_logs (company_id, created_at desc);
create index if not exists idx_audit_logs_company_target
  on public.audit_logs (company_id, target_table, created_at desc);
create index if not exists idx_audit_logs_company_action
  on public.audit_logs (company_id, action_type, created_at desc);

alter table if exists public.audit_logs enable row level security;

drop policy if exists audit_logs_select_admin on public.audit_logs;
create policy audit_logs_select_admin on public.audit_logs
  for select
  to authenticated
  using (
    company_id = public.current_company_id()
    and public.current_app_role() in ('owner', 'office_admin')
  );

drop policy if exists audit_logs_insert_admin on public.audit_logs;
create policy audit_logs_insert_admin on public.audit_logs
  for insert
  to authenticated
  with check (
    company_id = public.current_company_id()
    and public.is_admin_role()
  );
