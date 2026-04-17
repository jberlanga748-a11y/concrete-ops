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
    <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
      {toolbar ? <div className="border-b border-zinc-200 px-5 py-5 sm:px-6">{toolbar}</div> : null}
      <div className="overflow-x-auto">{children}</div>
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
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          {title ? <h2 className="text-lg font-semibold tracking-tight text-zinc-950">{title}</h2> : null}
          {description ? <p className="mt-1 text-sm leading-6 text-zinc-600">{description}</p> : null}
        </div>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          {countLabel ? (
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
              {countLabel}
            </span>
          ) : null}
          {actions}
        </div>
      </div>
      {children ? <div className="rounded-[24px] border border-zinc-200 bg-zinc-50/80 p-4">{children}</div> : null}
    </div>
  );
}

export function DataTable({ children }: { children: ReactNode }) {
  return <table className="min-w-full text-sm">{children}</table>;
}

export function TableHead({ children }: { children: ReactNode }) {
  return <thead className="bg-zinc-100/80">{children}</thead>;
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
      className={`px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 ${className}`.trim()}
    >
      {children}
    </th>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-zinc-200">{children}</tbody>;
}

export function TableRow({ children }: { children: ReactNode }) {
  return <tr className="transition hover:bg-zinc-50/80">{children}</tr>;
}

export function TableCell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={`px-5 py-4 align-top text-zinc-700 ${className}`.trim()}>{children}</td>;
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
      className="inline-flex items-center justify-center rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
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
