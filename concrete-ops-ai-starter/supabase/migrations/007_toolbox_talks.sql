create table if not exists public.toolbox_talks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  topic text not null check (char_length(trim(topic)) > 1),
  talk_date date not null,
  foreman_employee_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  unique (company_id, id),
  constraint toolbox_talks_foreman_fk
    foreign key (company_id, foreman_employee_id)
    references public.employees (company_id, id)
    on delete set null
);

create table if not exists public.toolbox_talk_attendees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  toolbox_talk_id uuid not null,
  employee_id uuid not null,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (company_id, id),
  unique (toolbox_talk_id, employee_id),
  constraint toolbox_talk_attendees_talk_fk
    foreign key (company_id, toolbox_talk_id)
    references public.toolbox_talks (company_id, id)
    on delete cascade,
  constraint toolbox_talk_attendees_employee_fk
    foreign key (company_id, employee_id)
    references public.employees (company_id, id)
    on delete restrict
);

create index if not exists idx_toolbox_talks_company_date
  on public.toolbox_talks (company_id, talk_date desc);
create index if not exists idx_toolbox_talk_attendees_company_talk
  on public.toolbox_talk_attendees (company_id, toolbox_talk_id);

alter table if exists public.toolbox_talks enable row level security;
alter table if exists public.toolbox_talk_attendees enable row level security;

drop policy if exists toolbox_talks_admin_only on public.toolbox_talks;
create policy toolbox_talks_admin_only on public.toolbox_talks
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_admin_role())
  with check (company_id = public.current_company_id() and public.is_admin_role());

drop policy if exists toolbox_talk_attendees_admin_only on public.toolbox_talk_attendees;
create policy toolbox_talk_attendees_admin_only on public.toolbox_talk_attendees
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_admin_role())
  with check (company_id = public.current_company_id() and public.is_admin_role());
