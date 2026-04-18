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
    <div className="space-y-6 lg:space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-zinc-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(245,247,248,0.92))] p-6 shadow-[0_20px_48px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.35fr,0.95fr] xl:items-start">
          <div>
            <Link href="/dashboard/jobs" className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500 transition hover:text-zinc-900">
              Back to jobs
            </Link>
            <p className="mt-4 font-app-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Jobs workflow</p>
            <h1 className="mt-3 text-[clamp(2rem,3vw,3.4rem)] font-semibold tracking-[-0.06em] text-[#101828]">Create a job record that feels ready before the field touches it.</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-600 sm:text-base">
              Start with the customer, project identity, and schedule context the team needs. Once saved, the Job Hub becomes the shared source for assignments, uploads, and field follow-up.
            </p>
          </div>

          <div className="rounded-[28px] border border-[#18232d] bg-[#0f1820] p-5 text-zinc-100 shadow-[0_20px_48px_rgba(15,23,42,0.18)] sm:p-6">
            <p className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">Setup inputs</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Active customers</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">{customerOptions.length}</p>
                <p className="mt-1 text-sm text-zinc-300">Available customer records to link to this job.</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Foreman options</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">{employeeOptions.length}</p>
                <p className="mt-1 text-sm text-zinc-300">Active employees available for field ownership.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <JobForm customerOptions={customerOptions} employeeOptions={employeeOptions} />
    </div>
  );
}
