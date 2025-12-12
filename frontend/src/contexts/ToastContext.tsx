import type { ReactNode } from "react"
import { createContext, useCallback, useContext, useState } from "react"
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react"

import { cn } from "@/lib/utils"

type ToastVariant = "success" | "error" | "info"

type ToastOptions = {
  title?: string
  description: string
  variant?: ToastVariant
  duration?: number
}

type Toast = ToastOptions & {
  id: string
  variant: ToastVariant
}

type ToastContextValue = {
  showToast: (options: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = createId()
      const toast: Toast = {
        id,
        variant: options.variant ?? "info",
        title: options.title,
        description: options.description,
        duration: options.duration,
      }
      setToasts((prev) => [...prev, toast])
      const duration = options.duration ?? 4200
      window.setTimeout(() => removeToast(id), duration)
    },
    [removeToast],
  )

  const iconFor = useCallback((variant: ToastVariant) => {
    if (variant === "success") return <CheckCircle2 className="h-4 w-4" />
    if (variant === "error") return <AlertCircle className="h-4 w-4" />
    return <Info className="h-4 w-4" />
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed top-5 right-5 z-[120] flex max-w-sm flex-col gap-3 text-sm items-end">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex w-full items-start gap-3 rounded-2xl border px-4 py-3 shadow-glass backdrop-blur",
              "bg-white/90",
              toast.variant === "success" && "border-emerald-200/70 bg-emerald-50/90 text-emerald-900",
              toast.variant === "error" && "border-destructive/40 bg-destructive/10 text-destructive",
              toast.variant === "info" && "border-slate-200/80 bg-white/95 text-slate-900",
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 text-white shadow-sm",
                toast.variant === "success" && "bg-emerald-600",
                toast.variant === "error" && "bg-destructive",
              )}
            >
              {iconFor(toast.variant)}
            </div>
            <div className="flex-1 space-y-1">
              {toast.title && <p className="text-sm font-semibold leading-tight">{toast.title}</p>}
              <p className="text-xs text-muted-foreground">{toast.description}</p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="rounded-md p-1 text-xs text-muted-foreground transition hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
