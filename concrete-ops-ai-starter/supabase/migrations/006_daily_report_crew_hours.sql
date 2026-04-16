alter table if exists public.daily_report_crew_entries
  add column if not exists hours numeric(6,2) not null default 0 check (hours >= 0);
