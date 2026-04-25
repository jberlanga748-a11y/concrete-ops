import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("010_policies migration", () => {
  const migrationPath = path.resolve(process.cwd(), "supabase/migrations/010_policies.sql");
  const sql = readFileSync(migrationPath, "utf8");

  it("creates the shared policies tables", () => {
    expect(sql).toContain("create table if not exists public.policies");
    expect(sql).toContain("create table if not exists public.policy_acknowledgments");
  });

  it("enables the scoped policies access rules", () => {
    expect(sql).toContain("alter table if exists public.policies enable row level security;");
    expect(sql).toContain("alter table if exists public.policy_acknowledgments enable row level security;");
    expect(sql).toContain("create policy policies_select_company on public.policies");
    expect(sql).toContain("create policy policy_acknowledgments_select_scoped on public.policy_acknowledgments");
  });
});
