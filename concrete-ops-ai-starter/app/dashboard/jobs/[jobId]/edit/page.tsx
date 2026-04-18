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

  const customer = Array.isArray(job.customers) ? job.customers[0] : job.customers;
  const foreman = Array.isArray(job.foreman_employee) ? job.foreman_employee[0] : job.foreman_employee;

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-zinc-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(245,247,248,0.92))] p-6 shadow-[0_20px_48px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.35fr,0.95fr] xl:items-start">
          <div>
            <Link
              href={`/dashboard/jobs/${job.id}`}
              className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500 transition hover:text-zinc-900"
            >
              Back to Job Hub
            </Link>
            <p className="mt-4 font-app-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Update planning</p>
            <h1 className="mt-3 text-[clamp(2rem,3vw,3.4rem)] font-semibold tracking-[-0.06em] text-[#101828]">
              Refine the core setup for {job.job_number} without disturbing the workflow around it.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-600 sm:text-base">
              Use this pass to tighten ownership, schedule, and jobsite context while keeping the existing Job Hub activity intact.
            </p>
          </div>

          <div className="rounded-[28px] border border-[#18232d] bg-[#0f1820] p-5 text-zinc-100 shadow-[0_20px_48px_rgba(15,23,42,0.18)] sm:p-6">
            <p className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">Current record</p>
            <div className="mt-5 space-y-3">
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Customer</p>
                <p className="mt-2 text-sm font-semibold text-white">{customer?.name || "No customer linked"}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Foreman</p>
                <p className="mt-2 text-sm font-semibold text-white">{foreman?.full_name || "No foreman assigned"}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Status</p>
                <p className="mt-2 text-sm font-semibold text-white">{job.status.replaceAll("_", " ")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

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
