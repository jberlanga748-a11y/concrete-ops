import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Job } from "@/lib/db/schema";

function getJobLabel(jobs: Pick<Job, "job_number" | "name">[] | Pick<Job, "job_number" | "name"> | null) {
  if (!jobs) return "—";
  if (Array.isArray(jobs)) {
    const job = jobs[0];
    return job ? `${job.job_number} · ${job.name}` : "—";
  }

  return `${jobs.job_number} · ${jobs.name}`;
}

export default async function EmployeeHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/employee");
  }

  const { data: appUser } = await supabase.from("users").select("id").eq("auth_user_id", user.id).maybeSingle();

  if (!appUser) {
    redirect("/login");
  }

  const { data: employee } = await supabase.from("employees").select("id").eq("user_id", appUser.id).maybeSingle();

  const [{ data: openEntry }, { data: uploads }] = await Promise.all([
    employee
      ? supabase
          .from("time_entries")
          .select("id, clock_in_at, status")
          .eq("employee_id", employee.id)
          .is("clock_out_at", null)
          .in("status", ["clocked_in", "on_break"])
          .order("clock_in_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("job_files")
      .select("id, file_name, tag, note, created_at, jobs(job_number, name)")
      .eq("uploaded_by_user_id", appUser.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const isClockedIn = Boolean(openEntry);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">Employee Home</h1>
        <p className="mt-3 text-zinc-600">Clock status and your recent uploads.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-zinc-500">Current Clock Status</p>
          <p className="mt-2 text-2xl font-semibold">{isClockedIn ? "Clocked In" : "Not Clocked In"}</p>
          <p className="mt-1 text-sm text-zinc-600">{openEntry ? `Since ${openEntry.clock_in_at}` : "No active shift."}</p>
          <Link href="/employee/time" className="mt-4 inline-block rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white">
            Go to Time Entry
          </Link>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <h2 className="text-lg font-semibold">Quick Links</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/employee/time" className="rounded-xl border px-4 py-2 text-sm">Time</Link>
            <Link href="/employee/uploads" className="rounded-xl border px-4 py-2 text-sm">Uploads</Link>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <h2 className="text-lg font-semibold">My Recent Uploads</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {(uploads ?? []).map((upload) => (
            <li key={upload.id} className="rounded-xl border p-3">
              <p className="font-medium">{upload.file_name}</p>
              <p className="text-zinc-600">{getJobLabel(upload.jobs as Pick<Job, "job_number" | "name">[] | Pick<Job, "job_number" | "name"> | null)}</p>
              <p className="text-zinc-600">Tag: {upload.tag}</p>
              <p className="text-zinc-600">{upload.note || "—"}</p>
              <p className="text-zinc-500">{upload.created_at}</p>
            </li>
          ))}
          {(uploads ?? []).length === 0 ? <li className="text-zinc-600">No uploads yet.</li> : null}
        </ul>
      </div>
    </div>
  );
}
