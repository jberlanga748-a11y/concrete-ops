do $$
begin
  if not exists (select 1 from pg_type where typname = 'upload_tag') then
    create type public.upload_tag as enum ('progress', 'issue', 'safety', 'delivery', 'damage', 'change_order_support');
  end if;
end
$$;

create table if not exists public.job_files (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  job_id uuid not null,
  daily_report_id uuid,
  uploaded_by_user_id uuid,
  uploaded_by_employee_id uuid,
  file_name text not null check (char_length(trim(file_name)) > 0),
  file_type text not null check (char_length(trim(file_type)) > 0),
  storage_path text not null unique check (char_length(trim(storage_path)) > 3),
  tag public.upload_tag not null,
  note text,
  created_at timestamptz not null default now(),
  unique (company_id, id),
  constraint job_files_job_fk
    foreign key (company_id, job_id)
    references public.jobs (company_id, id)
    on delete cascade,
  constraint job_files_daily_report_fk
    foreign key (company_id, daily_report_id)
    references public.daily_reports (company_id, id)
    on delete set null,
  constraint job_files_uploaded_user_fk
    foreign key (company_id, uploaded_by_user_id)
    references public.users (company_id, id)
    on delete set null,
  constraint job_files_uploaded_employee_fk
    foreign key (company_id, uploaded_by_employee_id)
    references public.employees (company_id, id)
    on delete set null,
  constraint job_files_uploader_check
    check (uploaded_by_user_id is not null or uploaded_by_employee_id is not null)
);

create index if not exists idx_job_files_company_created
  on public.job_files (company_id, created_at desc);
create index if not exists idx_job_files_company_job
  on public.job_files (company_id, job_id, created_at desc);
create index if not exists idx_job_files_company_report
  on public.job_files (company_id, daily_report_id, created_at desc);

alter table if exists public.job_files enable row level security;

drop policy if exists job_files_select_scoped on public.job_files;
create policy job_files_select_scoped on public.job_files
  for select
  to authenticated
  using (
    company_id = public.current_company_id()
    and (
      public.is_admin_role()
      or uploaded_by_user_id = public.current_app_user_id()
      or uploaded_by_employee_id = public.current_employee_id()
    )
  );

drop policy if exists job_files_insert_scoped on public.job_files;
create policy job_files_insert_scoped on public.job_files
  for insert
  to authenticated
  with check (
    company_id = public.current_company_id()
    and (
      public.is_admin_role()
      or uploaded_by_user_id = public.current_app_user_id()
      or uploaded_by_employee_id = public.current_employee_id()
    )
  );

drop policy if exists job_files_update_admin on public.job_files;
create policy job_files_update_admin on public.job_files
  for update
  to authenticated
  using (company_id = public.current_company_id() and public.is_admin_role())
  with check (company_id = public.current_company_id() and public.is_admin_role());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'job-uploads',
  'job-uploads',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists job_uploads_select on storage.objects;
create policy job_uploads_select on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'job-uploads'
    and split_part(name, '/', 1) = public.current_company_id()::text
  );

drop policy if exists job_uploads_insert on storage.objects;
create policy job_uploads_insert on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'job-uploads'
    and split_part(name, '/', 1) = public.current_company_id()::text
  );

drop policy if exists job_uploads_update_admin on storage.objects;
create policy job_uploads_update_admin on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'job-uploads'
    and split_part(name, '/', 1) = public.current_company_id()::text
    and public.is_admin_role()
  )
  with check (
    bucket_id = 'job-uploads'
    and split_part(name, '/', 1) = public.current_company_id()::text
    and public.is_admin_role()
  );

drop policy if exists job_uploads_delete_admin on storage.objects;
create policy job_uploads_delete_admin on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'job-uploads'
    and split_part(name, '/', 1) = public.current_company_id()::text
    and public.is_admin_role()
  );
