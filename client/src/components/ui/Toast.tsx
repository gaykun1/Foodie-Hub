"use client";
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastTone = "success" | "error" | "info";

interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<ToastTone, { icon: React.ReactNode; classes: string }> = {
  success: { icon: <CheckCircle2 size={18} />, classes: "bg-success100 text-success800" },
  error: { icon: <XCircle size={18} />, classes: "bg-danger100 text-danger" },
  info: { icon: <Info size={18} />, classes: "bg-info100 text-info800" },
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);
  const idRef = useRef(0);

  React.useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (tone: ToastTone, message: string) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, tone, message }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  const value: ToastContextValue = {
    success: (message) => push("success", message),
    error: (message) => push("error", message),
    info: (message) => push("info", message),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <div
            aria-live="polite"
            aria-atomic="true"
            className="fixed z-[300] bottom-4 right-4 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm"
          >
            <AnimatePresence>
              {toasts.map((t) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "flex items-start gap-2 rounded-lg border border-border shadow-elevation3 px-4 py-3 text-sm font-medium",
                    toneStyles[t.tone].classes
                  )}
                >
                  {toneStyles[t.tone].icon}
                  <span className="flex-1">{t.message}</span>
                  <button
                    onClick={() => dismiss(t.id)}
                    aria-label="Dismiss notification"
                    className="opacity-70 hover:opacity-100"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
};

// Falls back to a console-only no-op outside a ToastProvider (e.g. a
// component under test in isolation) rather than throwing, so consumers
// don't need every unit test wrapped in the full provider tree.
const noopToast: ToastContextValue = {
  success: (message) => console.info("[toast:success]", message),
  error: (message) => console.error("[toast:error]", message),
  info: (message) => console.info("[toast:info]", message),
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  return ctx ?? noopToast;
};
