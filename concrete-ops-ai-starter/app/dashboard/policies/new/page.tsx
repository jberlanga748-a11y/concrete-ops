import Link from "next/link";
import { PolicyForm } from "@/components/policies/PolicyForm";

export default function NewPolicyPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">New Policy</h1>
            <p className="mt-2 text-zinc-600">Create a policy record and seed acknowledgment tracking for current staff.</p>
          </div>
          <Link href="/dashboard/policies" className="rounded-xl border px-4 py-2 text-sm">
            Back to Policies
          </Link>
        </div>
      </div>

      <PolicyForm />
    </div>
  );
}
