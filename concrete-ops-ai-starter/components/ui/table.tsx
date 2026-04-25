import Link from "next/link";
import type { ReactNode } from "react";

export function TableShell({
  toolbar,
  children,
}: {
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-sm shadow-blue-950/5 backdrop-blur">
      {toolbar ? <div className="px-5 py-5 sm:px-7 sm:py-6">{toolbar}</div> : null}
      <div className="overflow-x-auto border-t border-blue-100 bg-white">{children}</div>
    </section>
  );
}

export function TableToolbar({
  title,
  description,
  countLabel,
  actions,
  children,
}: {
  title?: string;
  description?: string;
  countLabel?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          {title ? <h2 className="text-[1.45rem] font-black tracking-[-0.035em] text-slate-950">{title}</h2> : null}
          {description ? <p className="mt-2 max-w-3xl text-sm font-medium leading-7 text-slate-600">{description}</p> : null}
        </div>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          {countLabel ? (
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">
              {countLabel}
            </span>
          ) : null}
          {actions}
        </div>
      </div>
      {children ? (
        <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-5">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function DataTable({ children }: { children: ReactNode }) {
  return <table className="min-w-full text-sm">{children}</table>;
}

export function TableHead({ children }: { children: ReactNode }) {
  return <thead className="bg-blue-50">{children}</thead>;
}

export function TableHeadCell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-5 py-4 text-left text-xs font-black uppercase tracking-[0.2em] text-slate-500 ${className}`.trim()}
    >
      {children}
    </th>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-blue-50">{children}</tbody>;
}

export function TableRow({ children }: { children: ReactNode }) {
  return <tr className="transition-colors hover:bg-blue-50/50">{children}</tr>;
}

export function TableCell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={`px-5 py-4 align-top font-medium text-slate-700 ${className}`.trim()}>{children}</td>;
}

export function TableActionLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full bg-blue-700 px-3.5 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-white shadow-sm shadow-blue-700/20 transition hover:bg-blue-800"
    >
      {label}
    </Link>
  );
}

export function TableEmptyRow({
  colSpan,
  children,
}: {
  colSpan: number;
  children: ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-8">
        {children}
      </td>
    </tr>
  );
}
