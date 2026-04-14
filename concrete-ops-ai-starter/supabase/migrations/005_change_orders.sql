do $$
begin
  if not exists (select 1 from pg_type where typname = 'change_order_status') then
    create type public.change_order_status as enum ('draft', 'submitted', 'approved', 'rejected', 'executed');
  end if;
end
$$;

create table if not exists public.change_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  job_id uuid not null,
  daily_report_id uuid,
  title text not null check (char_length(trim(title)) > 1),
  description text,
  status public.change_order_status not null default 'draft',
  direct_cost_total numeric(12,2) not null default 0 check (direct_cost_total >= 0),
  markup_percent numeric(5,2) not null default 0 check (markup_percent >= 0),
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  created_by_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  constraint change_orders_job_fk
    foreign key (company_id, job_id)
    references public.jobs (company_id, id)
    on delete restrict,
  constraint change_orders_daily_report_fk
    foreign key (company_id, daily_report_id)
    references public.daily_reports (company_id, id)
    on delete set null,
  constraint change_orders_created_by_fk
    foreign key (company_id, created_by_user_id)
    references public.users (company_id, id)
    on delete set null
);

create table if not exists public.change_order_line_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  change_order_id uuid not null,
  description text not null check (char_length(trim(description)) > 0),
  quantity numeric(10,2) not null default 1 check (quantity >= 0),
  unit_cost numeric(12,2) not null default 0 check (unit_cost >= 0),
  line_total numeric(12,2) not null default 0 check (line_total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  constraint change_order_line_items_change_order_fk
    foreign key (company_id, change_order_id)
    references public.change_orders (company_id, id)
    on delete cascade
);

create table if not exists public.change_order_files (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  change_order_id uuid not null,
  job_file_id uuid not null,
  created_at timestamptz not null default now(),
  unique (change_order_id, job_file_id),
  unique (company_id, id),
  constraint change_order_files_change_order_fk
    foreign key (company_id, change_order_id)
    references public.change_orders (company_id, id)
    on delete cascade,
  constraint change_order_files_job_file_fk
    foreign key (company_id, job_file_id)
    references public.job_files (company_id, id)
    on delete cascade
);

create index if not exists idx_change_orders_company_created on public.change_orders (company_id, created_at desc);
create index if not exists idx_change_orders_company_job on public.change_orders (company_id, job_id, created_at desc);
create index if not exists idx_change_order_line_items_company_change_order on public.change_order_line_items (company_id, change_order_id);
create index if not exists idx_change_order_files_company_change_order on public.change_order_files (company_id, change_order_id);

drop trigger if exists set_change_orders_updated_at on public.change_orders;
create trigger set_change_orders_updated_at
before update on public.change_orders
for each row execute function public.set_updated_at();

drop trigger if exists set_change_order_line_items_updated_at on public.change_order_line_items;
create trigger set_change_order_line_items_updated_at
before update on public.change_order_line_items
for each row execute function public.set_updated_at();

alter table if exists public.change_orders enable row level security;
alter table if exists public.change_order_line_items enable row level security;
alter table if exists public.change_order_files enable row level security;

drop policy if exists change_orders_admin_only on public.change_orders;
create policy change_orders_admin_only on public.change_orders
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_admin_role())
  with check (company_id = public.current_company_id() and public.is_admin_role());

drop policy if exists change_order_line_items_admin_only on public.change_order_line_items;
create policy change_order_line_items_admin_only on public.change_order_line_items
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_admin_role())
  with check (company_id = public.current_company_id() and public.is_admin_role());

drop policy if exists change_order_files_admin_only on public.change_order_files;
create policy change_order_files_admin_only on public.change_order_files
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_admin_role())
  with check (company_id = public.current_company_id() and public.is_admin_role());
