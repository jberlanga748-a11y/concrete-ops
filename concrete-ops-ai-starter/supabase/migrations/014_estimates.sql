do $$
begin
  if not exists (select 1 from pg_type where typname = 'estimate_status') then
    create type public.estimate_status as enum ('draft', 'sent', 'approved', 'rejected');
  end if;

  if not exists (select 1 from pg_type where typname = 'estimate_line_item_type') then
    create type public.estimate_line_item_type as enum ('labor', 'material', 'equipment', 'other');
  end if;
end
$$;

create table if not exists public.estimates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null,
  job_id uuid,
  created_by_user_id uuid,
  title text not null check (char_length(trim(title)) > 1),
  status public.estimate_status not null default 'draft',
  notes text,
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  constraint estimates_customer_fk
    foreign key (company_id, customer_id)
    references public.customers (company_id, id)
    on delete restrict,
  constraint estimates_job_fk
    foreign key (company_id, job_id)
    references public.jobs (company_id, id)
    on delete set null,
  constraint estimates_created_by_fk
    foreign key (company_id, created_by_user_id)
    references public.users (company_id, id)
    on delete set null
);

create table if not exists public.estimate_line_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  estimate_id uuid not null,
  item_type public.estimate_line_item_type not null default 'other',
  description text not null check (char_length(trim(description)) > 0),
  quantity numeric(10,2) not null default 1 check (quantity >= 0),
  unit text,
  unit_cost numeric(12,2) not null default 0 check (unit_cost >= 0),
  line_total numeric(12,2) not null default 0 check (line_total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  constraint estimate_line_items_estimate_fk
    foreign key (company_id, estimate_id)
    references public.estimates (company_id, id)
    on delete cascade
);

create index if not exists idx_estimates_company_created
  on public.estimates (company_id, created_at desc);
create index if not exists idx_estimates_company_customer
  on public.estimates (company_id, customer_id, created_at desc);
create index if not exists idx_estimates_company_job
  on public.estimates (company_id, job_id, created_at desc);
create index if not exists idx_estimate_line_items_company_estimate
  on public.estimate_line_items (company_id, estimate_id, created_at asc);

drop trigger if exists set_estimates_updated_at on public.estimates;
create trigger set_estimates_updated_at
before update on public.estimates
for each row execute function public.set_updated_at();

drop trigger if exists set_estimate_line_items_updated_at on public.estimate_line_items;
create trigger set_estimate_line_items_updated_at
before update on public.estimate_line_items
for each row execute function public.set_updated_at();

alter table if exists public.estimates enable row level security;
alter table if exists public.estimate_line_items enable row level security;

drop policy if exists estimates_admin_only on public.estimates;
create policy estimates_admin_only on public.estimates
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_admin_role())
  with check (company_id = public.current_company_id() and public.is_admin_role());

drop policy if exists estimate_line_items_admin_only on public.estimate_line_items;
create policy estimate_line_items_admin_only on public.estimate_line_items
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_admin_role())
  with check (company_id = public.current_company_id() and public.is_admin_role());
