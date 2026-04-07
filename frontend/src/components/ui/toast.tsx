import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---

type ToastVariant = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

// --- Context ---

const ToastContext = React.createContext<ToastContextValue | null>(null);

function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}

// --- Icons & styling per variant ---

const variantConfig: Record<
  ToastVariant,
  { icon: React.ElementType; containerClass: string }
> = {
  success: {
    icon: CheckCircle,
    containerClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  error: {
    icon: XCircle,
    containerClass: "border-red-200 bg-red-50 text-red-800",
  },
  warning: {
    icon: AlertTriangle,
    containerClass: "border-amber-200 bg-amber-50 text-amber-800",
  },
  info: {
    icon: Info,
    containerClass: "border-primary/20 bg-accent text-primary",
  },
};

// --- Provider ---

const DEFAULT_DURATION = 5000;

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((opts: Omit<Toast, "id">) => {
    const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...opts, id }]);
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ctxValue = React.useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={ctxValue}>
      {children}
      <div
        className="pointer-events-none fixed bottom-0 end-0 z-[100] flex flex-col-reverse gap-2 p-4"
        aria-live="polite"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// --- Toast Item ---

function ToastItem({
  toast: t,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  React.useEffect(() => {
    const timer = setTimeout(
      () => onDismiss(t.id),
      t.duration ?? DEFAULT_DURATION
    );
    return () => clearTimeout(timer);
  }, [t.id, t.duration, onDismiss]);

  const { icon: Icon, containerClass } = variantConfig[t.variant];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "pointer-events-auto flex w-80 items-start gap-3 rounded-xl border p-4 shadow-lg",
        containerClass
      )}
      role="alert"
    >
      <Icon size={20} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{t.title}</p>
        {t.description && (
          <p className="mt-0.5 text-sm opacity-80">{t.description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(t.id)}
        className="shrink-0 rounded-md p-0.5 opacity-60 transition-opacity hover:opacity-100"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}

export { ToastProvider, useToast };
export type { Toast, ToastVariant };
