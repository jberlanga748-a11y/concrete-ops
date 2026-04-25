import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  tabs?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  tabs,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("mb-5 border-b border-blue-100 bg-white px-5 py-5 sm:px-6 lg:px-8", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-700">{eyebrow}</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
          {description ? <p className="mt-2 max-w-4xl text-sm font-medium leading-6 text-slate-600">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {tabs ? <div className="mt-5 flex gap-2 overflow-x-auto pb-1">{tabs}</div> : null}
    </header>
  );
}

export function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="text-base font-black text-slate-950">{title}</h2>
        {description ? <p className="mt-1 text-sm font-medium leading-5 text-slate-500">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export type FilterOption = {
  label: string;
  href?: string;
  active?: boolean;
};

export function FilterBar({
  options,
  actions,
  children,
  className,
}: {
  options?: FilterOption[];
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 border-b border-blue-100 bg-blue-50/60 p-3 md:flex-row md:items-center md:justify-between", className)}>
      {options?.length ? (
        <div className="flex gap-2 overflow-x-auto">
          {options.map((option) => {
            const classes = cn(
              "rounded-xl px-3 py-2 text-xs font-black transition",
              option.active ? "bg-blue-700 text-white" : "bg-white text-slate-600 ring-1 ring-blue-100 hover:bg-blue-50 hover:text-blue-700"
            );

            return option.href ? (
              <Link key={option.label} href={option.href} className={classes}>
                {option.label}
              </Link>
            ) : (
              <span key={option.label} className={classes}>
                {option.label}
              </span>
            );
          })}
        </div>
      ) : null}
      {children ? <div className="min-w-0 flex-1">{children}</div> : null}
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function KpiTile({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-950/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
          <p className="mt-1 text-sm font-bold text-slate-500">{helper}</p>
        </div>
        {icon ? <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">{icon}</div> : null}
      </div>
    </div>
  );
}

export function OperationalCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn("rounded-2xl border border-blue-100 bg-white shadow-sm shadow-blue-950/5", className)}>{children}</section>;
}

export function RecordPreview({
  eyebrow = "Record Preview",
  title,
  rows,
  actions,
  emptyLabel = "No record selected.",
}: {
  eyebrow?: string;
  title?: string;
  rows: Array<[string, ReactNode]>;
  actions?: ReactNode;
  emptyLabel?: string;
}) {
  return (
    <OperationalCard className="overflow-hidden">
      <div className="border-b border-blue-100 p-4">
        <p className="text-xs font-black uppercase tracking-widest text-blue-700">{eyebrow}</p>
        <h3 className="mt-1 text-lg font-black text-slate-950">{title ?? emptyLabel}</h3>
      </div>
      <div className="grid divide-y divide-blue-50">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[112px_1fr] gap-3 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
            <div className="text-sm font-bold leading-5 text-slate-700">{value}</div>
          </div>
        ))}
      </div>
      {actions ? <div className="border-t border-blue-100 bg-blue-50/60 p-3">{actions}</div> : null}
    </OperationalCard>
  );
}
