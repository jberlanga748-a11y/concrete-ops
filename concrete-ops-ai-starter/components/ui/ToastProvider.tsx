"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

type ToastTone = "success" | "error" | "info";

type ToastPayload = {
  title: string;
  description?: string;
  tone?: ToastTone;
};

type ToastRecord = ToastPayload & {
  id: number;
};

type ToastContextValue = {
  pushToast: (payload: ToastPayload) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function toneClasses(tone: ToastTone) {
  switch (tone) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "info":
    default:
      return "border-sky-200 bg-sky-50 text-sky-700";
  }
}

function ToastIcon({ tone }: { tone: ToastTone }) {
  if (tone === "success") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }

  if (tone === "error") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01" />
      <path d="M11 12h1v4h1" />
    </svg>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const nextId = useRef(1);

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    ({ title, description, tone = "info" }: ToastPayload) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, title, description, tone }]);
      window.setTimeout(() => removeToast(id), 4200);
    },
    [removeToast],
  );

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-[24px] border p-4 shadow-[0_20px_50px_rgba(15,23,42,0.18)] ${toneClasses(toast.tone ?? "info")}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-2xl bg-white/80 p-2">
                <ToastIcon tone={toast.tone ?? "info"} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-950">{toast.title}</p>
                {toast.description ? <p className="mt-1 text-sm leading-6 text-zinc-700">{toast.description}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="rounded-xl px-2 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 transition hover:bg-white/70 hover:text-zinc-800"
              >
                Close
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider.");
  }

  return context;
}
