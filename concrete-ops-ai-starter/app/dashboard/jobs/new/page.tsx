import Link from "next/link";
import { redirect } from "next/navigation";
import { JobForm } from "@/components/jobs/JobForm";
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
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">New Job</h1>
            <p className="mt-2 text-zinc-600">Create a job and connect it to the right customer, foreman, and schedule details.</p>
          </div>
          <Link href="/dashboard/jobs" className="rounded-xl border px-4 py-2 text-sm">
            Back to Jobs
          </Link>
        </div>
      </div>

      <JobForm customerOptions={customerOptions} employeeOptions={employeeOptions} />
    </div>
  );
}
