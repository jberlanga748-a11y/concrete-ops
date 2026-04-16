do $$
begin
  if not exists (select 1 from pg_type where typname = 'policy_acknowledgment_status') then
    create type public.policy_acknowledgment_status as enum ('unsigned', 'signed');
  end if;
end
$$;

create table if not exists public.policies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 1),
  category text,
  version_label text,
  content text not null check (char_length(trim(content)) > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id)
);

create table if not exists public.policy_acknowledgments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  policy_id uuid not null,
  employee_id uuid,
  user_id uuid,
  status public.policy_acknowledgment_status not null default 'unsigned',
  acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  constraint policy_acknowledgments_policy_fk
    foreign key (company_id, policy_id)
    references public.policies (company_id, id)
    on delete cascade,
  constraint policy_acknowledgments_employee_fk
    foreign key (company_id, employee_id)
    references public.employees (company_id, id)
    on delete set null,
  constraint policy_acknowledgments_user_fk
    foreign key (company_id, user_id)
    references public.users (company_id, id)
    on delete set null,
  constraint policy_acknowledgments_target_check
    check (employee_id is not null or user_id is not null)
);

create unique index if not exists idx_policy_acknowledgments_policy_user_unique
  on public.policy_acknowledgments (policy_id, user_id)
  where user_id is not null;

create unique index if not exists idx_policy_acknowledgments_policy_employee_unique
  on public.policy_acknowledgments (policy_id, employee_id)
  where employee_id is not null;

create index if not exists idx_policies_company_active
  on public.policies (company_id, is_active, created_at desc);
create index if not exists idx_policy_acknowledgments_company_policy
  on public.policy_acknowledgments (company_id, policy_id, status);
create index if not exists idx_policy_acknowledgments_company_user
  on public.policy_acknowledgments (company_id, user_id, status);
create index if not exists idx_policy_acknowledgments_company_employee
  on public.policy_acknowledgments (company_id, employee_id, status);

drop trigger if exists set_policies_updated_at on public.policies;
create trigger set_policies_updated_at
before update on public.policies
for each row execute function public.set_updated_at();

drop trigger if exists set_policy_acknowledgments_updated_at on public.policy_acknowledgments;
create trigger set_policy_acknowledgments_updated_at
before update on public.policy_acknowledgments
for each row execute function public.set_updated_at();

alter table if exists public.policies enable row level security;
alter table if exists public.policy_acknowledgments enable row level security;

drop policy if exists policies_select_company on public.policies;
create policy policies_select_company on public.policies
  for select
  to authenticated
  using (company_id = public.current_company_id());

drop policy if exists policies_write_admin on public.policies;
create policy policies_write_admin on public.policies
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_admin_role())
  with check (company_id = public.current_company_id() and public.is_admin_role());

drop policy if exists policy_acknowledgments_select_scoped on public.policy_acknowledgments;
create policy policy_acknowledgments_select_scoped on public.policy_acknowledgments
  for select
  to authenticated
  using (
    company_id = public.current_company_id()
    and (
      public.is_admin_role()
      or user_id = public.current_app_user_id()
      or employee_id = public.current_employee_id()
    )
  );

drop policy if exists policy_acknowledgments_insert_admin on public.policy_acknowledgments;
create policy policy_acknowledgments_insert_admin on public.policy_acknowledgments
  for insert
  to authenticated
  with check (company_id = public.current_company_id() and public.is_admin_role());

drop policy if exists policy_acknowledgments_update_scoped on public.policy_acknowledgments;
create policy policy_acknowledgments_update_scoped on public.policy_acknowledgments
  for update
  to authenticated
  using (
    company_id = public.current_company_id()
    and (
      public.is_admin_role()
      or user_id = public.current_app_user_id()
      or employee_id = public.current_employee_id()
    )
  )
  with check (
    company_id = public.current_company_id()
    and (
      public.is_admin_role()
      or user_id = public.current_app_user_id()
      or employee_id = public.current_employee_id()
    )
  );
