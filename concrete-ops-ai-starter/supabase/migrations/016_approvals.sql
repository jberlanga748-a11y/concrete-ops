do $$
begin
  if not exists (select 1 from pg_type where typname = 'approval_type') then
    create type public.approval_type as enum ('proposal', 'change_order');
  end if;

  if not exists (select 1 from pg_type where typname = 'approval_status') then
    create type public.approval_status as enum ('sent', 'viewed', 'approved', 'rejected');
  end if;
end
$$;

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  approval_type public.approval_type not null,
  proposal_id uuid,
  change_order_id uuid,
  created_by_user_id uuid,
  status public.approval_status not null default 'sent',
  sent_at timestamptz not null default now(),
  viewed_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique (company_id, id),
  constraint approvals_type_target_check
    check (
      (approval_type = 'proposal' and proposal_id is not null and change_order_id is null)
      or
      (approval_type = 'change_order' and change_order_id is not null and proposal_id is null)
    ),
  constraint approvals_proposal_fk
    foreign key (company_id, proposal_id)
    references public.proposals (company_id, id)
    on delete cascade,
  constraint approvals_change_order_fk
    foreign key (company_id, change_order_id)
    references public.change_orders (company_id, id)
    on delete cascade,
  constraint approvals_created_by_fk
    foreign key (company_id, created_by_user_id)
    references public.users (company_id, id)
    on delete set null
);

create index if not exists idx_approvals_company_created
  on public.approvals (company_id, created_at desc);
create index if not exists idx_approvals_company_type_status
  on public.approvals (company_id, approval_type, status, created_at desc);
create index if not exists idx_approvals_company_proposal
  on public.approvals (company_id, proposal_id, created_at desc);
create index if not exists idx_approvals_company_change_order
  on public.approvals (company_id, change_order_id, created_at desc);

alter table if exists public.approvals enable row level security;

drop policy if exists approvals_admin_only on public.approvals;
create policy approvals_admin_only on public.approvals
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_admin_role())
  with check (company_id = public.current_company_id() and public.is_admin_role());
