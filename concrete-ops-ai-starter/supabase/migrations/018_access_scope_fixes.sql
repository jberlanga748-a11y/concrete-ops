create or replace function public.is_office_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() in ('owner', 'office_admin'), false);
$$;

drop policy if exists companies_update_admin on public.companies;
drop policy if exists companies_update_office on public.companies;
create policy companies_update_office on public.companies
  for update
  to authenticated
  using (id = public.current_company_id() and public.is_office_role())
  with check (id = public.current_company_id() and public.is_office_role());

drop policy if exists users_write_admin on public.users;
drop policy if exists users_write_office on public.users;
create policy users_write_office on public.users
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_office_role())
  with check (company_id = public.current_company_id() and public.is_office_role());

drop policy if exists employees_write_admin on public.employees;
drop policy if exists employees_write_office on public.employees;
create policy employees_write_office on public.employees
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_office_role())
  with check (company_id = public.current_company_id() and public.is_office_role());

drop policy if exists customers_admin_only on public.customers;
drop policy if exists customers_select_admin on public.customers;
drop policy if exists customers_write_office on public.customers;
create policy customers_select_admin on public.customers
  for select
  to authenticated
  using (company_id = public.current_company_id() and public.is_office_role());

create policy customers_write_office on public.customers
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_office_role())
  with check (company_id = public.current_company_id() and public.is_office_role());

drop policy if exists job_assignments_admin_only on public.job_assignments;
drop policy if exists job_assignments_select_scoped on public.job_assignments;
drop policy if exists job_assignments_write_admin on public.job_assignments;
create policy job_assignments_select_scoped on public.job_assignments
  for select
  to authenticated
  using (
    company_id = public.current_company_id()
    and (
      public.is_admin_role()
      or employee_id = public.current_employee_id()
    )
  );

create policy job_assignments_write_admin on public.job_assignments
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_admin_role())
  with check (company_id = public.current_company_id() and public.is_admin_role());

drop policy if exists document_links_insert_admin on public.document_links;
drop policy if exists document_links_insert_scoped on public.document_links;
create policy document_links_insert_scoped on public.document_links
  for insert
  to authenticated
  with check (
    company_id = public.current_company_id()
    and (
      public.is_admin_role()
      or (
        link_type in ('job', 'daily_report')
        and exists (
          select 1
          from public.documents d
          where d.company_id = public.current_company_id()
            and d.id = document_id
            and (
              d.uploaded_by_user_id = public.current_app_user_id()
              or d.uploaded_by_employee_id = public.current_employee_id()
            )
            and (
              (link_type = 'job' and d.job_id = linked_record_id)
              or (link_type = 'daily_report' and d.daily_report_id = linked_record_id)
            )
        )
      )
    )
  );

drop policy if exists estimates_admin_only on public.estimates;
drop policy if exists estimates_office_only on public.estimates;
create policy estimates_office_only on public.estimates
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_office_role())
  with check (company_id = public.current_company_id() and public.is_office_role());

drop policy if exists estimate_line_items_admin_only on public.estimate_line_items;
drop policy if exists estimate_line_items_office_only on public.estimate_line_items;
create policy estimate_line_items_office_only on public.estimate_line_items
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_office_role())
  with check (company_id = public.current_company_id() and public.is_office_role());

drop policy if exists proposals_admin_only on public.proposals;
drop policy if exists proposals_office_only on public.proposals;
create policy proposals_office_only on public.proposals
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_office_role())
  with check (company_id = public.current_company_id() and public.is_office_role());

drop policy if exists proposal_sections_admin_only on public.proposal_sections;
drop policy if exists proposal_sections_office_only on public.proposal_sections;
create policy proposal_sections_office_only on public.proposal_sections
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_office_role())
  with check (company_id = public.current_company_id() and public.is_office_role());

drop policy if exists approvals_admin_only on public.approvals;
drop policy if exists approvals_office_only on public.approvals;
create policy approvals_office_only on public.approvals
  for all
  to authenticated
  using (company_id = public.current_company_id() and public.is_office_role())
  with check (company_id = public.current_company_id() and public.is_office_role());

drop policy if exists "job_cost_snapshots_admin_only" on public.job_cost_snapshots;
drop policy if exists "job_cost_snapshots_office_only" on public.job_cost_snapshots;
create policy "job_cost_snapshots_office_only"
  on public.job_cost_snapshots
  for all
  using (company_id = public.current_company_id() and public.is_office_role())
  with check (company_id = public.current_company_id() and public.is_office_role());
