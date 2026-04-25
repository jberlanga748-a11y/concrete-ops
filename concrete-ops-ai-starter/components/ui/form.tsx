import type { ReactNode } from "react";

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-blue-100 bg-blue-50/60 p-5">
      <div>
        <h3 className="text-base font-black tracking-tight text-slate-950">{title}</h3>
        {description ? <p className="mt-1 text-sm font-medium leading-6 text-slate-600">{description}</p> : null}
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function FormActions({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-blue-100 bg-white px-5 py-4 shadow-sm shadow-blue-950/5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">{children}</div>
        {hint ? <div className="text-sm font-medium leading-6 text-slate-500 lg:max-w-xl lg:text-right">{hint}</div> : null}
      </div>
    </div>
  );
}

export function FieldLabel({
  children,
  required = false,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <p className="mb-2 text-sm font-bold text-slate-700">
      {children}
      {required ? <span className="ml-1 text-blue-700">*</span> : null}
    </p>
  );
}
