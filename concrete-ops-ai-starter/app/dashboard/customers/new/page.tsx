import Link from "next/link";
import { CustomerForm } from "@/components/customers/CustomerForm";

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">New Customer</h1>
            <p className="mt-2 text-zinc-600">Create a simple customer profile with contact and billing details.</p>
          </div>
          <Link href="/dashboard/customers" className="rounded-xl border px-4 py-2 text-sm">
            Back to Customers
          </Link>
        </div>
      </div>

      <CustomerForm />
    </div>
  );
}
