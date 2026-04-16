"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { cn } from "@/components/ui/cn";
import { AppIcon } from "@/components/ui/icons";

type ToastTone = "success" | "error" | "info";
type ToastItem = { id: number; title: string; description?: string; tone: ToastTone };

const ToastContext = createContext<{
  pushToast: (toast: Omit<ToastItem, "id">) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3500);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto overflow-hidden rounded-[24px] border bg-white/95 px-4 py-3 shadow-[0_18px_40px_rgba(24,24,27,0.12)] backdrop-blur",
              toast.tone === "success" && "border-emerald-200 bg-[linear-gradient(180deg,#ffffff_0%,#f3fdf8_100%)]",
              toast.tone === "error" && "border-red-200 bg-[linear-gradient(180deg,#ffffff_0%,#fff5f5_100%)]",
              toast.tone === "info" && "border-orange-200 bg-[linear-gradient(180deg,#ffffff_0%,#fff7ed_100%)]",
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl",
                  toast.tone === "success" && "bg-emerald-100 text-emerald-700",
                  toast.tone === "error" && "bg-red-100 text-red-700",
                  toast.tone === "info" && "bg-orange-100 text-orange-600",
                )}
              >
                <AppIcon icon={toast.tone === "success" ? "check" : toast.tone === "error" ? "alert" : "truck"} className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900">{toast.title}</p>
                {toast.description ? <p className="mt-1 text-sm text-zinc-600">{toast.description}</p> : null}
              </div>
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
