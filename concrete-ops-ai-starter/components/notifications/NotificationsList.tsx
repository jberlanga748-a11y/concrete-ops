"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ViewerDateTime } from "@/components/time/ViewerDateTime";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/db/mutations";
import type { NotificationRow } from "@/lib/db/queries";

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

  async function handleMarkRead(notificationId: string) {
    await markNotificationRead(notificationId);
    router.refresh();
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    router.refresh();
  }

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl border bg-white p-4 shadow-sm">
        <div>
          <p className="text-sm font-medium text-zinc-900">{unreadCount} unread</p>
          <p className="mt-1 text-sm text-zinc-600">Notifications are generated from current office-facing workflows.</p>
        </div>
        <button
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
          className="rounded-xl border px-4 py-2 text-sm disabled:opacity-50"
        >
          Mark All Read
        </button>
      </div>

      <ul className="space-y-3">
        {notifications.map((notification) => {
          const relatedHref = getRelatedHref(notification);
          return (
            <li
              key={notification.id}
              className={`rounded-2xl border bg-white p-4 shadow-sm ${notification.is_read ? "opacity-80" : ""}`}
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
                  <ViewerDateTime
                    value={notification.created_at}
                    className="mt-2 text-xs text-zinc-500"
                    includeYear
                    includeTimeZoneName={false}
                  />
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
                      className="rounded-xl border px-3 py-2 text-xs font-medium hover:bg-zinc-50"
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
          <li className="rounded-2xl border bg-white p-6 text-zinc-600 shadow-sm">
            No notifications yet.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
