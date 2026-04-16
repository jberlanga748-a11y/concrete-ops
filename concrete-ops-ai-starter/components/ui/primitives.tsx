import Link from "next/link";
import { cn } from "@/components/ui/cn";

export const surfaceClassName = "rounded-3xl border border-zinc-200 bg-white shadow-sm";
export const mutedSurfaceClassName = "rounded-2xl border border-zinc-200 bg-zinc-50";
export const inputClassName =
  "w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200";
export const selectClassName = inputClassName;
export const textareaClassName = `${inputClassName} min-h-24`;
export const primaryButtonClassName =
  "inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryButtonClassName =
  "inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50";
export const subtleButtonClassName =
  "inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50";
export const tableShellClassName = "overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm";
export const tableHeaderClassName = "bg-zinc-100/80 text-xs uppercase tracking-[0.12em] text-zinc-500";
export const tableCellClassName = "px-4 py-4 align-top";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={cn(surfaceClassName, "p-5 sm:p-6")}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{eyebrow}</p>
          ) : null}
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900 sm:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-3 text-sm leading-6 text-zinc-600 sm:text-base">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </section>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(surfaceClassName, "p-4 sm:p-5", className)}>
      {title || description || action ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {title ? <h2 className="text-lg font-semibold text-zinc-900">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-zinc-600">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className={cn(title || description || action ? "mt-4" : "")}>{children}</div>
    </section>
  );
}

export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className={cn(surfaceClassName, "rounded-2xl p-4")}>
      <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-zinc-900">{value}</p>
      {hint ? <p className="mt-2 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn(surfaceClassName, "flex flex-col items-start gap-4 p-6 text-left")}>
      <div>
        <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function InlineNotice({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "error" | "success";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        tone === "error" && "border-red-200 bg-red-50 text-red-700",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        tone === "neutral" && "border-zinc-200 bg-zinc-50 text-zinc-700",
      )}
    >
      {children}
    </div>
  );
}

export function PageActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={primaryButtonClassName}>
      {children}
    </Link>
  );
}
