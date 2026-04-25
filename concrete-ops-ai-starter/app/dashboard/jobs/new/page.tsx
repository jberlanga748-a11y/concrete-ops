import { redirect } from "next/navigation";
import Link from "next/link";
import { JobForm } from "@/components/jobs/JobForm";
import { PageHeader } from "@/components/ui/page-primitives";
import { getCustomerOptions, getEmployeeOptions } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";

export default async function NewJobPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: appUser } = user
    ? await supabase.from("users").select("role").eq("auth_user_id", user.id).maybeSingle()
    : { data: null };

  if (appUser?.role === "foreman") {
    redirect("/dashboard/jobs");
  }

  const [customerOptions, employeeOptions] = await Promise.all([
    getCustomerOptions(),
    getEmployeeOptions(),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Field Ops"
        title="New Job"
        description="Create the customer, project identity, owner, and schedule context the team needs before assignments, uploads, and reports begin."
        actions={
          <Link href="/dashboard/jobs" className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-blue-50">
            Back to Jobs
          </Link>
        }
      />

      <div className="px-5 sm:px-6 lg:px-8">
        <JobForm customerOptions={customerOptions} employeeOptions={employeeOptions} />
      </div>
    </div>
  );
}
