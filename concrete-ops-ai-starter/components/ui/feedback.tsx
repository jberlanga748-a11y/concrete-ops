import Link from "next/link";
import type { ReactNode } from "react";

type IconKind = "table" | "users" | "briefcase" | "file" | "clock" | "alert";
type StatusTone = "neutral" | "success" | "warning" | "error" | "info";

function FeedbackIcon({ kind }: { kind: IconKind }) {
  switch (kind) {
    case "users":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
          <path d="M16 3.1a4 4 0 0 1 0 7.8" />
        </svg>
      );
    case "briefcase":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v2" />
          <path d="M2 12h20" />
        </svg>
      );
    case "file":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h8" />
          <path d="M8 17h8" />
          <path d="M8 9h2" />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6l4 2" />
        </svg>
      );
    case "alert":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
      );
    case "table":
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 10h18" />
          <path d="M9 20V10" />
          <path d="M15 20V10" />
        </svg>
      );
  }
}

export function StatusChip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: StatusTone;
}) {
  const toneClasses: Record<StatusTone, string> = {
    neutral: "bg-slate-100 text-slate-700 ring-slate-200",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    warning: "bg-amber-50 text-amber-700 ring-amber-100",
    error: "bg-rose-50 text-rose-700 ring-rose-100",
    info: "bg-blue-50 text-blue-700 ring-blue-100",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black capitalize ring-1 ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({
  icon = "table",
  title,
  description,
  actionHref,
  actionLabel,
  action,
}: {
  icon?: IconKind;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-700 shadow-sm shadow-blue-950/5">
        <FeedbackIcon kind={icon} />
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-widest text-blue-700">Nothing to show yet</p>
      <h3 className="mt-2 text-base font-black text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
      {action ? (
        <div className="mt-4 flex justify-center">{action}</div>
      ) : actionHref && actionLabel ? (
        <div className="mt-4 flex justify-center">
          <Link
            href={actionHref}
            className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-blue-700/20 transition hover:bg-blue-800"
          >
            {actionLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function ErrorPanel({
  title = "Something went wrong",
  description,
  actionHref,
  actionLabel,
  action,
}: {
  title?: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-white text-rose-600 shadow-sm">
          <FeedbackIcon kind="alert" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-widest text-rose-700">Attention needed</p>
          <h2 className="mt-1 text-base font-black text-rose-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-rose-700">{description}</p>
          {action ? (
            <div className="mt-3">{action}</div>
          ) : actionHref && actionLabel ? (
            <div className="mt-3">
              <Link
                href={actionHref}
                className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-black text-rose-700 transition hover:bg-rose-100"
              >
                {actionLabel}
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
