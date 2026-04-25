import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { JobForm } from "@/components/jobs/JobForm";
import { PageHeader } from "@/components/ui/page-primitives";
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
    <div>
      <PageHeader
        eyebrow="Field Ops"
        title={`Edit ${job.job_number}`}
        description="Refine ownership, schedule, and jobsite context while preserving the existing job activity record."
        actions={
          <Link href={`/dashboard/jobs/${job.id}`} className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-blue-50">
            Back to Job
          </Link>
        }
      />

      <div className="px-5 sm:px-6 lg:px-8">
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
    </div>
  );
}
