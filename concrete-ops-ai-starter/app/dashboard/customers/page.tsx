import Link from "next/link";
import { CustomerTable } from "@/components/customers/CustomerTable";
import { ErrorPanel } from "@/components/ui/feedback";
import { FilterBar, PageHeader, RecordPreview } from "@/components/ui/page-primitives";
import { TableToolbar } from "@/components/ui/table";
import { getCustomers } from "@/lib/db/queries";
import type { CustomerStatus } from "@/lib/db/schema";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams?: { status?: CustomerStatus | "all" };
} = {}) {
  const selectedStatus = searchParams?.status ?? "all";
  const { data, error } = await getCustomers(selectedStatus === "all" ? undefined : { status: selectedStatus });
  const customers = data ?? [];
  const latestCustomer = customers[0] ?? null;
  const filterOptions = [
    { label: "All", href: "/dashboard/customers", active: selectedStatus === "all" },
    { label: "Active", href: "/dashboard/customers?status=active", active: selectedStatus === "active" },
    { label: "Inactive", href: "/dashboard/customers?status=inactive", active: selectedStatus === "inactive" },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Office"
        title="Customers"
        description="Customer records are the account layer for jobs, estimates, proposals, and change orders. Keep contact details, status, and the next record action easy to scan."
        actions={
          <Link href="/dashboard/customers/new" className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800">
            New Customer
          </Link>
        }
      />

      <div className="grid gap-4 px-5 sm:px-6 lg:px-8 xl:grid-cols-[1fr_360px]">
        {error ? (
          <div className="xl:col-span-2">
            <ErrorPanel
              title="We couldn’t load customers right now"
              description="The customer list is temporarily unavailable. Try refreshing the page or come back in a moment."
              actionHref="/dashboard/customers"
              actionLabel="Try again"
            />
          </div>
        ) : (
          <>
            <div className="min-w-0">
              <FilterBar options={filterOptions} />
              <CustomerTable
                customers={customers}
                toolbar={
                  <TableToolbar
                    title="Customer list"
                    description="Review customer contact details, account status, and quick edit actions from one place."
                    countLabel={`${customers.length} customer${customers.length === 1 ? "" : "s"}`}
                  />
                }
              />
            </div>
            <RecordPreview
              title={latestCustomer?.name}
              rows={[
                ["Contact", latestCustomer?.contact_name || "—"],
                ["Email", latestCustomer?.email || "—"],
                ["Phone", latestCustomer?.phone || "—"],
                ["Status", latestCustomer?.status ?? "—"],
              ]}
              actions={
                latestCustomer ? (
                  <Link href={`/dashboard/customers/${latestCustomer.id}`} className="inline-flex rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">
                    Open Customer
                  </Link>
                ) : null
              }
            />
          </>
        )}
      </div>
    </div>
  );
}
