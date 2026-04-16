import { NotificationsList } from "@/components/notifications/NotificationsList";
import { getNotifications } from "@/lib/db/queries";

export default async function NotificationsPage() {
  const { data: notifications } = await getNotifications();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">Notifications</h1>
        <p className="mt-2 text-zinc-600">Simple office-facing updates from daily reports, change orders, incidents, and PPE exceptions.</p>
      </div>

      <NotificationsList notifications={notifications ?? []} />
    </div>
  );
}
