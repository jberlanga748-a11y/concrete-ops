import Link from "next/link";
import { cn } from "@/components/ui/cn";
import { AppIcon, ConcreteTruckIcon } from "@/components/ui/icons";

export const appBackgroundClassName =
  "bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.12),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(71,85,105,0.12),_transparent_26%),linear-gradient(180deg,#f5f5f4_0%,#fafaf9_100%)]";
export const brandPanelClassName =
  "bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,250,249,0.92)),radial-gradient(circle_at_top_left,rgba(249,115,22,0.08),transparent_34%)]";
export const surfaceClassName =
  "rounded-[28px] border border-zinc-200/80 bg-white/95 shadow-[0_18px_40px_rgba(24,24,27,0.08)] backdrop-blur";
export const mutedSurfaceClassName =
  "rounded-[24px] border border-zinc-200 bg-zinc-50/90";
export const inputClassName =
  "w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100";
export const selectClassName = inputClassName;
export const textareaClassName = `${inputClassName} min-h-24`;
export const primaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-100 focus:outline-none focus:ring-4 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-50";
export const subtleButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-50";
export const destructiveButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-50";
export const tableShellClassName =
  "overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white/95 shadow-[0_16px_36px_rgba(24,24,27,0.06)]";
export const tableHeaderClassName =
  "bg-zinc-100/90 text-xs uppercase tracking-[0.12em] text-zinc-500";
export const tableCellClassName = "px-4 py-4 align-top";
export const linkClassName =
  "text-orange-600 underline-offset-4 transition hover:text-orange-700 hover:underline";

function HeaderTexture() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-[0.14]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(39,39,42,0.16) 1px, transparent 0), linear-gradient(135deg, rgba(249,115,22,0.12), transparent 32%)",
        backgroundSize: "18px 18px, 100% 100%",
      }}
    />
  );
}

export function StatusPill({
  tone = "info",
  children,
}: {
  tone?: "success" | "warning" | "error" | "info" | "neutral";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]",
        tone === "success" && "bg-emerald-100 text-emerald-800",
        tone === "warning" && "bg-amber-100 text-amber-800",
        tone === "error" && "bg-red-100 text-red-800",
        tone === "info" && "bg-slate-100 text-slate-700",
        tone === "neutral" && "bg-zinc-100 text-zinc-700",
      )}
    >
      {children}
    </span>
  );
}

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
    <section
      className={cn(
        surfaceClassName,
        "relative overflow-hidden p-5 sm:p-6",
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,247,237,0.9)),radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_38%)]",
      )}
    >
      <HeaderTexture />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          {eyebrow ? (
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
              <ConcreteTruckIcon className="h-4 w-4 text-orange-500" />
              <span>{eyebrow}</span>
            </div>
          ) : null}
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">{title}</h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">{description}</p>
          ) : null}
        </div>
        {action ? <div className="relative shrink-0">{action}</div> : null}
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
            {title ? <h2 className="text-lg font-semibold tracking-tight text-zinc-950">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm leading-6 text-zinc-600">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className={cn(title || description || action ? "mt-4" : "")}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon = "sparkles",
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: Parameters<typeof AppIcon>[0]["icon"];
  tone?: "neutral" | "success" | "warning" | "info";
}) {
  return (
    <div
      className={cn(
        surfaceClassName,
        "relative overflow-hidden rounded-[30px] p-5",
        tone === "neutral" &&
          "bg-[radial-gradient(circle_at_top_right,_rgba(39,39,42,0.06),_transparent_42%),linear-gradient(180deg,#ffffff_0%,#fafafa_100%)]",
        tone === "success" &&
          "bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_42%),linear-gradient(180deg,#ffffff_0%,#f3fdf8_100%)]",
        tone === "warning" &&
          "bg-[radial-gradient(circle_at_top_right,_rgba(249,115,22,0.2),_transparent_42%),linear-gradient(180deg,#ffffff_0%,#fff7ed_100%)]",
        tone === "info" &&
          "bg-[radial-gradient(circle_at_top_right,_rgba(71,85,105,0.18),_transparent_42%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{label}</p>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">{value}</p>
          {hint ? <p className="mt-3 text-sm text-zinc-600">{hint}</p> : null}
        </div>
        <div className="rounded-2xl border border-zinc-200/80 bg-white/85 p-3 text-orange-500 shadow-sm">
          <AppIcon icon={icon} className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export const MetricCard = StatCard;

export function Section({
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
    <SectionCard title={title} description={description} action={action} className={className}>
      {children}
    </SectionCard>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon = "truck",
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: Parameters<typeof AppIcon>[0]["icon"];
}) {
  return (
    <div className={cn(surfaceClassName, "relative overflow-hidden flex flex-col items-start gap-4 p-6 text-left")}>
      <div className="absolute bottom-4 right-4 text-zinc-100">
        <AppIcon icon={icon} className="h-16 w-16" />
      </div>
      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
        <AppIcon icon={icon} className="h-6 w-6" />
      </div>
      <div className="relative">
        <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600">{description}</p>
      </div>
      {action ? <div className="relative">{action}</div> : null}
    </div>
  );
}

export function InlineNotice({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "error" | "success" | "warning" | "info";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        tone === "error" && "border-red-200 bg-red-50 text-red-700",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        tone === "warning" && "border-orange-200 bg-orange-50 text-orange-700",
        tone === "info" && "border-slate-200 bg-slate-50 text-slate-700",
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

export function DataTable({
  title,
  description,
  headers,
  mobileCards,
  children,
  emptyState,
}: {
  title?: string;
  description?: string;
  headers: string[];
  mobileCards: React.ReactNode;
  children: React.ReactNode;
  emptyState?: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      {title || description ? (
        <div>
          {title ? <h2 className="text-lg font-semibold tracking-tight text-zinc-950">{title}</h2> : null}
          {description ? <p className="mt-1 text-sm text-zinc-600">{description}</p> : null}
        </div>
      ) : null}

      <div className="md:hidden">{mobileCards || emptyState}</div>

      <div className="hidden md:block">
        <div className={tableShellClassName}>
          <table className="w-full text-sm">
            <thead className={tableHeaderClassName}>
              <tr>
                {headers.map((header) => (
                  <th key={header} className="px-4 py-3 text-left">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{children}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export const ResponsiveTable = DataTable;
