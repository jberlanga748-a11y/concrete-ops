"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/db/mutations";
import { EmptyState, primaryButtonClassName, secondaryButtonClassName, SectionCard } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/ToastProvider";
import type { NotificationRow } from "@/lib/db/queries";

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function getPriorityClasses(priority: NotificationRow["priority"]) {
  if (priority === "high") return "bg-red-100 text-red-800";
  if (priority === "low") return "bg-zinc-100 text-zinc-600";
  return "bg-amber-100 text-amber-800";
}

function getRelatedHref(notification: NotificationRow) {
  if (!notification.related_table || !notification.related_id) return null;
  if (notification.related_table === "daily_reports") return `/dashboard/daily-reports/${notification.related_id}`;
  if (notification.related_table === "change_orders") return `/dashboard/change-orders/${notification.related_id}`;
  if (notification.related_table === "incidents") return `/dashboard/incidents/${notification.related_id}`;
  if (notification.related_table === "ppe_items") return `/dashboard/ppe/${notification.related_id}`;
  return null;
}

export function NotificationsList({
  notifications,
}: {
  notifications: NotificationRow[];
}) {
  const router = useRouter();
  const { pushToast } = useToast();

  async function handleMarkRead(notificationId: string) {
    const result = await markNotificationRead(notificationId);
    pushToast({
      tone: result.error ? "error" : "success",
      title: result.error ? "Could not mark notification as read." : "Notification marked as read.",
    });
    router.refresh();
  }

  async function handleMarkAllRead() {
    const result = await markAllNotificationsRead();
    pushToast({
      tone: result.error ? "error" : "success",
      title: result.error ? "Could not mark notifications as read." : "All notifications marked as read.",
    });
    router.refresh();
  }

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  return (
    <div className="space-y-4">
      <SectionCard
        title={`${unreadCount} unread`}
        description="Notifications are generated from current office-facing workflows."
        action={
          <button onClick={handleMarkAllRead} disabled={unreadCount === 0} className={secondaryButtonClassName}>
            Mark All Read
          </button>
        }
      >
        <div />
      </SectionCard>

      <ul className="space-y-3">
        {notifications.map((notification) => {
          const relatedHref = getRelatedHref(notification);
          return (
            <li
              key={notification.id}
              className={`rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${notification.is_read ? "opacity-80" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-zinc-900">{notification.title}</p>
                    <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${getPriorityClasses(notification.priority)}`}>
                      {notification.priority}
                    </span>
                    {!notification.is_read ? (
                      <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs uppercase tracking-wide text-white">
                        Unread
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-zinc-700">{notification.body}</p>
                  <p className="mt-2 text-xs text-zinc-500">{formatDateTime(notification.created_at)}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {relatedHref ? (
                    <Link href={relatedHref} className="rounded-xl border px-3 py-2 text-xs font-medium hover:bg-zinc-50">
                      Open Related
                    </Link>
                  ) : null}
                  {!notification.is_read ? (
                    <button
                      onClick={() => handleMarkRead(notification.id)}
                      className={secondaryButtonClassName}
                    >
                      Mark Read
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}

        {notifications.length === 0 ? (
          <li>
            <EmptyState
              title="No notifications yet"
              description="Office-facing alerts will appear here as reports, incidents, and approvals come in."
            />
          </li>
        ) : null}
      </ul>
    </div>
  );
}
