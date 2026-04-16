do $$
begin
  if not exists (select 1 from pg_type where typname = 'notification_priority') then
    create type public.notification_priority as enum ('low', 'normal', 'high');
  end if;

  if not exists (select 1 from pg_type where typname = 'notification_type') then
    create type public.notification_type as enum ('daily_report_submitted', 'change_order_created', 'incident_created', 'ppe_attention');
  end if;
end
$$;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null,
  notification_type public.notification_type not null,
  title text not null check (char_length(trim(title)) > 0),
  body text not null check (char_length(trim(body)) > 0),
  related_table text,
  related_id uuid,
  priority public.notification_priority not null default 'normal',
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  unique (company_id, id),
  constraint notifications_user_fk
    foreign key (company_id, user_id)
    references public.users (company_id, id)
    on delete cascade
);

create index if not exists idx_notifications_company_user_created
  on public.notifications (company_id, user_id, created_at desc);
create index if not exists idx_notifications_company_user_read
  on public.notifications (company_id, user_id, is_read, created_at desc);

alter table if exists public.notifications enable row level security;

drop policy if exists notifications_select_scoped on public.notifications;
create policy notifications_select_scoped on public.notifications
  for select
  to authenticated
  using (
    company_id = public.current_company_id()
    and user_id = public.current_app_user_id()
  );

drop policy if exists notifications_insert_admin on public.notifications;
create policy notifications_insert_admin on public.notifications
  for insert
  to authenticated
  with check (
    company_id = public.current_company_id()
    and public.is_admin_role()
  );

drop policy if exists notifications_update_scoped on public.notifications;
create policy notifications_update_scoped on public.notifications
  for update
  to authenticated
  using (
    company_id = public.current_company_id()
    and user_id = public.current_app_user_id()
  )
  with check (
    company_id = public.current_company_id()
    and user_id = public.current_app_user_id()
  );
