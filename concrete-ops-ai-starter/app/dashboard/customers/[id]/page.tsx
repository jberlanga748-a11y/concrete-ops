import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { getCustomerById } from "@/lib/db/queries";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: customer } = await getCustomerById(id);

  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">{customer.name}</h1>
            <p className="mt-2 text-zinc-600">Update customer contacts and notes used across jobs.</p>
          </div>
          <Link href="/dashboard/customers" className="rounded-xl border px-4 py-2 text-sm">
            Back to Customers
          </Link>
        </div>
      </div>

      <CustomerForm
        customerId={customer.id}
        initialValues={{
          name: customer.name,
          contactName: customer.contact_name,
          email: customer.email,
          phone: customer.phone,
          billingAddress: customer.billing_address,
          notes: customer.notes,
          status: customer.status,
        }}
      />
    </div>
  );
}
