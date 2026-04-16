do $$
begin
  if not exists (select 1 from pg_type where typname = 'proposal_status') then
    create type public.proposal_status as enum ('draft', 'sent', 'approved', 'rejected');
  end if;

  if not exists (select 1 from pg_type where typname = 'proposal_section_type') then
    create type public.proposal_section_type as enum ('scope', 'exclusion', 'term');
  end if;
end
$$;

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null,
  job_id uuid,
  created_by_user_id uuid,
  title text not null check (char_length(trim(title)) > 1),
  status public.proposal_status not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  constraint proposals_customer_fk
    foreign key (company_id, customer_id)
    references public.customers (company_id, id)
    on delete restrict,
  constraint proposals_job_fk
    foreign key (company_id, job_id)
    references public.jobs (company_id, id)
    on delete set null,
  constraint proposals_created_by_fk
    foreign key (company_id, created_by_user_id)
    references public.users (company_id, id)
    on delete set null
);

create table if not exists public.proposal_sections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  proposal_id uuid not null,
  section_type public.proposal_section_type not null,
  heading text,
  content text not null check (char_length(trim(content)) > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  constraint proposal_sections_proposal_fk
    foreign key (company_id, proposal_id)
    references public.proposals (company_id, id)
    on delete cascade
);

create index if not exists idx_proposals_company_created
  on public.proposals (company_id, created_at desc);
create index if not exists idx_proposals_company_customer
  on public.proposals (company_id, customer_id, created_at desc);
create index if not exists idx_proposals_company_job
  on public.proposals (company_id, job_id, created_at desc);
create index if not exists idx_proposal_sections_company_proposal
  on public.proposal_sections (company_id, proposal_id, sort_order asc, created_at asc);

drop trigger if exists set_proposals_updated_at on public.proposals;
create trigger set_proposals_updated_at
before update on public.proposals
for each row execute function public.set_updated_at();

drop trigger if exists set_proposal_sections_updated_at on public.proposal_sections;
create trigger set_proposal_sections_updated_at
before update on public.proposal_sections
for each row execute function public.set_updated_at();

alter table if exists public.proposals enable row level security;
alter table if exists public.proposal_sections enable row level security;

drop policy if exists proposals_admin_only on public.proposals;
create policy proposals_admin_only on public.proposals
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_admin_role())
  with check (company_id = public.current_company_id() and public.is_admin_role());

drop policy if exists proposal_sections_admin_only on public.proposal_sections;
create policy proposal_sections_admin_only on public.proposal_sections
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_admin_role())
  with check (company_id = public.current_company_id() and public.is_admin_role());
