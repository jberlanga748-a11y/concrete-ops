do $$
begin
  if not exists (select 1 from pg_type where typname = 'ppe_item_status') then
    create type public.ppe_item_status as enum ('issued', 'needs_replacement', 'pending_fit_check');
  end if;
end
$$;

create table if not exists public.ppe_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null,
  item_name text not null check (char_length(trim(item_name)) > 0),
  status public.ppe_item_status not null default 'issued',
  fit_notes text,
  issued_at date,
  replacement_due_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  constraint ppe_items_employee_fk
    foreign key (company_id, employee_id)
    references public.employees (company_id, id)
    on delete cascade
);

create index if not exists idx_ppe_items_company_employee
  on public.ppe_items (company_id, employee_id, created_at desc);
create index if not exists idx_ppe_items_company_status
  on public.ppe_items (company_id, status, replacement_due_at);

drop trigger if exists set_ppe_items_updated_at on public.ppe_items;
create trigger set_ppe_items_updated_at
before update on public.ppe_items
for each row execute function public.set_updated_at();

alter table if exists public.ppe_items enable row level security;

drop policy if exists ppe_items_select_scoped on public.ppe_items;
create policy ppe_items_select_scoped on public.ppe_items
  for select
  to authenticated
  using (
    company_id = public.current_company_id()
    and (
      public.is_admin_role()
      or employee_id = public.current_employee_id()
    )
  );

drop policy if exists ppe_items_write_admin on public.ppe_items;
create policy ppe_items_write_admin on public.ppe_items
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_admin_role())
  with check (company_id = public.current_company_id() and public.is_admin_role());
