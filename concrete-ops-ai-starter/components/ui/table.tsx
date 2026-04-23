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
    <section className="overflow-hidden rounded-[34px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,248,249,0.92))] shadow-[0_26px_58px_rgba(15,23,42,0.08)] backdrop-blur">
      {toolbar ? <div className="px-5 py-5 sm:px-7 sm:py-6">{toolbar}</div> : null}
      <div className="overflow-x-auto border-t border-white/90 bg-white/92">{children}</div>
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
          {title ? <h2 className="text-[1.45rem] font-semibold tracking-[-0.045em] text-zinc-950">{title}</h2> : null}
          {description ? <p className="mt-2 max-w-3xl text-sm leading-7 text-zinc-600">{description}</p> : null}
        </div>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          {countLabel ? (
            <span className="rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600 shadow-[0_10px_22px_rgba(15,23,42,0.05)]">
              {countLabel}
            </span>
          ) : null}
          {actions}
        </div>
      </div>
      {children ? (
        <div className="rounded-[28px] border border-white bg-[linear-gradient(180deg,rgba(247,248,250,0.92),rgba(241,244,246,0.82))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
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
  return <thead className="bg-[linear-gradient(180deg,rgba(244,246,248,0.98),rgba(239,242,245,0.88))]">{children}</thead>;
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
  return <tr className="transition-colors hover:bg-[#fffaf6]">{children}</tr>;
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
      className="inline-flex items-center justify-center rounded-[18px] border border-zinc-300 bg-white px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-700 shadow-[0_10px_22px_rgba(15,23,42,0.04)] transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
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
