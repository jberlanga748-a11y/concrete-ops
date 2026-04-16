import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { JobForm } from "@/components/jobs/JobForm";
import { getCustomerOptions, getEmployeeOptions, getJobById } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: appUser } = user
    ? await supabase.from("users").select("role").eq("auth_user_id", user.id).maybeSingle()
    : { data: null };

  if (appUser?.role === "foreman") {
    redirect(`/dashboard/jobs/${jobId}`);
  }

  const [{ data: job }, customerOptions, employeeOptions] = await Promise.all([
    getJobById(jobId),
    getCustomerOptions(true),
    getEmployeeOptions(true),
  ]);

  if (!job) notFound();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Edit Job</h1>
            <p className="mt-2 text-zinc-600">Update core job planning details without changing the broader workflow structure.</p>
          </div>
          <Link href={`/dashboard/jobs/${job.id}`} className="rounded-xl border px-4 py-2 text-sm">
            Back to Job Hub
          </Link>
        </div>
      </div>

      <JobForm
        jobId={job.id}
        customerOptions={customerOptions}
        employeeOptions={employeeOptions}
        initialValues={{
          customerId: job.customer_id,
          jobNumber: job.job_number,
          name: job.name,
          foremanEmployeeId: job.foreman_employee_id,
          status: job.status,
          startDate: job.start_date,
          targetFinishDate: job.target_finish_date,
          address: job.address,
          description: job.description,
        }}
      />
    </div>
  );
}
