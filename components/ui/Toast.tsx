"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "info" | "warn" | "error";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<ToastItem, "id">) => void;
  success: (title: string, message?: string, action?: ToastItem["action"]) => void;
  error: (title: string, message?: string) => void;
  warn: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ type, title, message, action, duration }: Omit<ToastItem, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const autoDismissDuration =
        duration !== undefined ? duration : type === "error" ? 0 : 4000;

      setToasts((prev) => {
        // Enforce max 3 toasts stacked
        const next = [...prev, { id, type, title, message, action }];
        return next.slice(-3);
      });

      if (autoDismissDuration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, autoDismissDuration);
      }
    },
    [dismiss]
  );

  const success = useCallback(
    (title: string, message?: string, action?: ToastItem["action"]) => {
      toast({ type: "success", title, message, action });
    },
    [toast]
  );

  const error = useCallback(
    (title: string, message?: string) => {
      toast({ type: "error", title, message, duration: 0 }); // errors stay until dismissed
    },
    [toast]
  );

  const warn = useCallback(
    (title: string, message?: string) => {
      toast({ type: "warn", title, message });
    },
    [toast]
  );

  const info = useCallback(
    (title: string, message?: string) => {
      toast({ type: "info", title, message });
    },
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, warn, info, dismiss }}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((t) => {
        const icons = {
          success: <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />,
          info: <Info className="h-4 w-4 text-blue-600 shrink-0" />,
          warn: <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />,
          error: <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />,
        };

        const bgBorders = {
          success: "bg-white border-emerald-200 text-slate-800 shadow-md",
          info: "bg-white border-blue-200 text-slate-800 shadow-md",
          warn: "bg-white border-amber-200 text-slate-800 shadow-md",
          error: "bg-white border-rose-300 text-slate-800 shadow-lg",
        };

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 transition-all duration-150 animate-in slide-in-from-bottom-2 ${bgBorders[t.type]}`}
            role="alert"
          >
            <div className="mt-0.5">{icons[t.type]}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold leading-tight text-slate-900">
                {t.title}
              </div>
              {t.message && (
                <div className="mt-1 text-[11px] text-slate-600 leading-snug">
                  {t.message}
                </div>
              )}
              {t.action && (
                <button
                  onClick={() => {
                    t.action?.onClick();
                    onDismiss(t.id);
                  }}
                  className="mt-2 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                >
                  {t.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded"
              aria-label="Dismiss toast"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
