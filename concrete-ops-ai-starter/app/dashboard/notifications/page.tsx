import { requireOfficeUser } from "@/lib/auth/server";
import { EmptyState, ErrorPanel } from "@/components/ui/feedback";
import { NotificationsList } from "@/components/notifications/NotificationsList";
import { getNotifications } from "@/lib/db/queries";

export default async function NotificationsPage() {
  await requireOfficeUser("/dashboard/notifications");
  const { data: notifications, error } = await getNotifications();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">Notifications</h1>
        <p className="mt-2 text-zinc-600">Simple office-facing updates from daily reports, change orders, incidents, and PPE exceptions.</p>
      </div>

      {error ? (
        <ErrorPanel
          title="We couldn’t load notifications right now"
          description="The notification queue is temporarily unavailable. Try refreshing the page or come back in a moment."
          actionHref="/dashboard/notifications"
          actionLabel="Try again"
        />
      ) : (notifications ?? []).length === 0 ? (
        <EmptyState
          icon="alert"
          title="No notifications are waiting right now"
          description="Daily reports, change orders, incidents, and PPE exceptions will show up here when the office queue needs follow-up."
        />
      ) : (
        <NotificationsList notifications={notifications ?? []} />
      )}
    </div>
  );
}
