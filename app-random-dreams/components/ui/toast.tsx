"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";

type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  toast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de <ToastProvider>");
  }
  return context;
}

const variantStyles: Record<ToastVariant, { icon: string; label: string }> = {
  success: { icon: "✓", label: "Éxito" },
  error: { icon: "✕", label: "Error" },
  info: { icon: "✦", label: "Aviso" }
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, message, variant }]);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-24 z-[200] flex w-80 flex-col gap-2"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  const { icon, label } = variantStyles[toast.variant];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="status"
      className="pointer-events-auto flex items-start justify-between gap-3 rounded-[4px] border border-night/20 bg-gold px-4 py-3 text-sm text-night shadow-lg shadow-black/40"
    >
      <div className="flex items-start gap-2">
        <span aria-hidden="true" className="mt-0.5 text-xs font-bold">
          {icon}
        </span>
        <span className="leading-snug">{toast.message}</span>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-night/70 transition-colors hover:text-night"
        aria-label={`Cerrar notificación (${label})`}
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
