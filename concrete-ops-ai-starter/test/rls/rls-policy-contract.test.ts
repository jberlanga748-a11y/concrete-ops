import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function readMigration(fileName: string) {
  return readFileSync(resolve(process.cwd(), "supabase/migrations", fileName), "utf8");
}

describe("Supabase RLS policy contracts", () => {
  it("defines scoped helper functions for auth context", () => {
    const sql = readMigration("002_rls.sql");
    expect(sql).toMatch(/create or replace function public\.current_company_id\(\)/i);
    expect(sql).toMatch(/create or replace function public\.current_app_role\(\)/i);
    expect(sql).toMatch(/create or replace function public\.current_employee_id\(\)/i);
  });

  it("keeps time entries scoped to company and either admins or the current employee", () => {
    const sql = readMigration("002_rls.sql");
    expect(sql).toMatch(/create policy time_entries_select_scoped on public\.time_entries[\s\S]*company_id = public\.current_company_id\(\)[\s\S]*public\.is_admin_role\(\) or employee_id = public\.current_employee_id\(\)/i);
    expect(sql).toMatch(/create policy time_entries_insert_scoped on public\.time_entries[\s\S]*with check \([\s\S]*employee_id = public\.current_employee_id\(\)/i);
    expect(sql).toMatch(/create policy time_entries_update_scoped on public\.time_entries[\s\S]*with check \([\s\S]*employee_id = public\.current_employee_id\(\)/i);
  });

  it("allows daily reports for admins or the submitting user only", () => {
    const sql = readMigration("003_daily_reports.sql");
    expect(sql).toMatch(/create policy daily_reports_select_scoped on public\.daily_reports[\s\S]*submitted_by_user_id = public\.current_app_user_id\(\)/i);
    expect(sql).toMatch(/create policy daily_reports_insert_scoped on public\.daily_reports[\s\S]*submitted_by_user_id = public\.current_app_user_id\(\)/i);
    expect(sql).toMatch(/create policy daily_reports_update_scoped on public\.daily_reports[\s\S]*submitted_by_user_id = public\.current_app_user_id\(\)/i);
  });

  it("keeps job file reads and writes scoped to uploader identity and company storage paths", () => {
    const sql = readMigration("004_job_files.sql");
    expect(sql).toMatch(/create policy job_files_select_scoped on public\.job_files[\s\S]*uploaded_by_user_id = public\.current_app_user_id\(\)[\s\S]*uploaded_by_employee_id = public\.current_employee_id\(\)/i);
    expect(sql).toMatch(/create policy job_uploads_insert on storage\.objects[\s\S]*split_part\(name, '\/', 1\) = public\.current_company_id\(\)::text/i);
    expect(sql).toMatch(/create policy job_uploads_delete_admin on storage\.objects[\s\S]*public\.is_admin_role\(\)/i);
  });

  it("restricts change orders and linked records to admin roles only", () => {
    const sql = readMigration("005_change_orders.sql");
    expect(sql).toMatch(/create policy change_orders_admin_only on public\.change_orders[\s\S]*public\.is_admin_role\(\)/i);
    expect(sql).toMatch(/create policy change_order_line_items_admin_only on public\.change_order_line_items[\s\S]*public\.is_admin_role\(\)/i);
    expect(sql).toMatch(/create policy change_order_files_admin_only on public\.change_order_files[\s\S]*public\.is_admin_role\(\)/i);
  });
});
