import Link from "next/link";
import { CustomerTable } from "@/components/customers/CustomerTable";
import { InlineNotice, PageActionLink, PageHeader } from "@/components/ui/primitives";
import { getCustomers } from "@/lib/db/queries";

export default async function CustomersPage() {
  const { data, error } = await getCustomers();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Keep customer contacts and billing notes organized for the jobs you manage."
        action={<PageActionLink href="/dashboard/customers/new">New Customer</PageActionLink>}
      />

      {error ? (
        <InlineNotice tone="error">We couldn’t load customers right now. Please refresh and try again.</InlineNotice>
      ) : (
        <CustomerTable customers={data ?? []} />
      )}
    </div>
  );
}
