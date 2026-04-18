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
    neutral: "bg-zinc-100 text-zinc-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    error: "bg-rose-100 text-rose-700",
    info: "bg-sky-100 text-sky-700",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${toneClasses[tone]}`}>
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
    <div className="rounded-[30px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,247,248,0.92))] p-6 text-center shadow-[0_24px_50px_rgba(15,23,42,0.06)] sm:p-7">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[22px] border border-white bg-[linear-gradient(180deg,#ffffff_0%,#f5f6f7_100%)] text-[#b95f26] shadow-[0_16px_34px_rgba(15,23,42,0.08)]">
        <FeedbackIcon kind={icon} />
      </div>
      <p className="mt-4 font-app-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">Nothing waiting here</p>
      <h3 className="mt-3 text-[1.15rem] font-semibold tracking-[-0.03em] text-zinc-950">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-zinc-600">{description}</p>
      {action ? (
        <div className="mt-6 flex justify-center">{action}</div>
      ) : actionHref && actionLabel ? (
        <div className="mt-6 flex justify-center">
          <Link
            href={actionHref}
            className="inline-flex items-center justify-center rounded-[20px] bg-[#101828] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(15,23,42,0.16)] transition hover:bg-[#1b2432]"
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
    <div className="rounded-[30px] border border-rose-200/80 bg-[linear-gradient(180deg,rgba(255,248,248,0.98),rgba(255,240,242,0.92))] p-5 shadow-[0_18px_40px_rgba(190,24,93,0.08)] sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] border border-white bg-white text-rose-600 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
          <FeedbackIcon kind="alert" />
        </div>
        <div className="min-w-0">
          <p className="font-app-mono text-[11px] uppercase tracking-[0.22em] text-rose-500">Needs attention</p>
          <h2 className="mt-3 text-[1.2rem] font-semibold tracking-[-0.03em] text-zinc-950">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-700">{description}</p>
          {action ? (
            <div className="mt-5">{action}</div>
          ) : actionHref && actionLabel ? (
            <div className="mt-5">
              <Link
                href={actionHref}
                className="inline-flex items-center justify-center rounded-[20px] border border-rose-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-[0_12px_24px_rgba(255,255,255,0.4)] transition hover:bg-rose-100"
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
