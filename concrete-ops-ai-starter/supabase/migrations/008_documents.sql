do $$
begin
  if not exists (select 1 from pg_type where typname = 'document_link_type') then
    create type public.document_link_type as enum ('job', 'daily_report', 'incident', 'change_order');
  end if;
end
$$;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  source_job_file_id uuid unique,
  job_id uuid,
  daily_report_id uuid,
  uploaded_by_user_id uuid,
  uploaded_by_employee_id uuid,
  file_name text not null check (char_length(trim(file_name)) > 0),
  file_type text not null check (char_length(trim(file_type)) > 0),
  storage_bucket text not null default 'job-uploads' check (char_length(trim(storage_bucket)) > 0),
  storage_path text not null unique check (char_length(trim(storage_path)) > 3),
  file_size_bytes bigint,
  tag public.upload_tag not null,
  note text,
  created_at timestamptz not null default now(),
  unique (company_id, id),
  constraint documents_job_file_fk
    foreign key (company_id, source_job_file_id)
    references public.job_files (company_id, id)
    on delete set null,
  constraint documents_job_fk
    foreign key (company_id, job_id)
    references public.jobs (company_id, id)
    on delete cascade,
  constraint documents_daily_report_fk
    foreign key (company_id, daily_report_id)
    references public.daily_reports (company_id, id)
    on delete set null,
  constraint documents_uploaded_user_fk
    foreign key (company_id, uploaded_by_user_id)
    references public.users (company_id, id)
    on delete set null,
  constraint documents_uploaded_employee_fk
    foreign key (company_id, uploaded_by_employee_id)
    references public.employees (company_id, id)
    on delete set null,
  constraint documents_uploader_check
    check (uploaded_by_user_id is not null or uploaded_by_employee_id is not null),
  constraint documents_file_size_check
    check (file_size_bytes is null or file_size_bytes >= 0)
);

create table if not exists public.document_links (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  document_id uuid not null,
  link_type public.document_link_type not null,
  linked_record_id uuid not null,
  created_at timestamptz not null default now(),
  unique (company_id, id),
  unique (document_id, link_type, linked_record_id),
  constraint document_links_document_fk
    foreign key (company_id, document_id)
    references public.documents (company_id, id)
    on delete cascade
);

create index if not exists idx_documents_company_created
  on public.documents (company_id, created_at desc);
create index if not exists idx_documents_company_job
  on public.documents (company_id, job_id, created_at desc);
create index if not exists idx_documents_company_report
  on public.documents (company_id, daily_report_id, created_at desc);
create index if not exists idx_document_links_company_document
  on public.document_links (company_id, document_id);
create index if not exists idx_document_links_company_target
  on public.document_links (company_id, link_type, linked_record_id);

alter table if exists public.documents enable row level security;
alter table if exists public.document_links enable row level security;

drop policy if exists documents_select_scoped on public.documents;
create policy documents_select_scoped on public.documents
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

drop policy if exists documents_insert_scoped on public.documents;
create policy documents_insert_scoped on public.documents
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

drop policy if exists documents_update_admin on public.documents;
create policy documents_update_admin on public.documents
  for update
  to authenticated
  using (company_id = public.current_company_id() and public.is_admin_role())
  with check (company_id = public.current_company_id() and public.is_admin_role());

drop policy if exists document_links_select_scoped on public.document_links;
create policy document_links_select_scoped on public.document_links
  for select
  to authenticated
  using (company_id = public.current_company_id());

drop policy if exists document_links_insert_admin on public.document_links;
create policy document_links_insert_admin on public.document_links
  for insert
  to authenticated
  with check (company_id = public.current_company_id() and public.is_admin_role());

drop policy if exists document_links_update_admin on public.document_links;
create policy document_links_update_admin on public.document_links
  for update
  to authenticated
  using (company_id = public.current_company_id() and public.is_admin_role())
  with check (company_id = public.current_company_id() and public.is_admin_role());

drop policy if exists document_links_delete_admin on public.document_links;
create policy document_links_delete_admin on public.document_links
  for delete
  to authenticated
  using (company_id = public.current_company_id() and public.is_admin_role());

insert into public.documents (
  company_id,
  source_job_file_id,
  job_id,
  daily_report_id,
  uploaded_by_user_id,
  uploaded_by_employee_id,
  file_name,
  file_type,
  storage_bucket,
  storage_path,
  tag,
  note,
  created_at
)
select
  jf.company_id,
  jf.id,
  jf.job_id,
  jf.daily_report_id,
  jf.uploaded_by_user_id,
  jf.uploaded_by_employee_id,
  jf.file_name,
  jf.file_type,
  'job-uploads',
  jf.storage_path,
  jf.tag,
  jf.note,
  jf.created_at
from public.job_files jf
where not exists (
  select 1
  from public.documents d
  where d.company_id = jf.company_id
    and d.source_job_file_id = jf.id
);

insert into public.document_links (company_id, document_id, link_type, linked_record_id, created_at)
select
  d.company_id,
  d.id,
  'job'::public.document_link_type,
  d.job_id,
  d.created_at
from public.documents d
where d.job_id is not null
on conflict (document_id, link_type, linked_record_id) do nothing;

insert into public.document_links (company_id, document_id, link_type, linked_record_id, created_at)
select
  d.company_id,
  d.id,
  'daily_report'::public.document_link_type,
  d.daily_report_id,
  d.created_at
from public.documents d
where d.daily_report_id is not null
on conflict (document_id, link_type, linked_record_id) do nothing;

insert into public.document_links (company_id, document_id, link_type, linked_record_id, created_at)
select
  cof.company_id,
  d.id,
  'change_order'::public.document_link_type,
  cof.change_order_id,
  cof.created_at
from public.change_order_files cof
join public.documents d
  on d.company_id = cof.company_id
 and d.source_job_file_id = cof.job_file_id
on conflict (document_id, link_type, linked_record_id) do nothing;
