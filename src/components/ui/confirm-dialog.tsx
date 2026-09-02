import { useEffect } from "react"
import { AlertTriangle, AlertCircle, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  isDestructive?: boolean
  isLoading?: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  variant?: "info" | "warning" | "error" | "success"
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
  variant = isDestructive ? "error" : "warning",
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onCancel()
      }
      if (event.key === "Enter" && event.target === document.body) {
        event.preventDefault()
        if (!isLoading) onConfirm()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, isLoading, onConfirm, onCancel])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [open])

  if (!open) return null

  const variantConfig = {
    info: {
      icon: AlertCircle,
      iconColor: "text-sky-500",
      badgeBg: "bg-sky-500/15 border-sky-500/30",
    },
    warning: {
      icon: AlertTriangle,
      iconColor: "text-amber-500",
      badgeBg: "bg-amber-500/15 border-amber-500/30",
    },
    error: {
      icon: AlertTriangle,
      iconColor: "text-rose-500",
      badgeBg: "bg-rose-500/15 border-rose-500/30",
    },
    success: {
      icon: CheckCircle,
      iconColor: "text-emerald-500",
      badgeBg: "bg-emerald-500/15 border-emerald-500/30",
    },
  }

  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with Blur */}
      <div
        className="sam-dialog-backdrop"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        className={cn(
          "sam-dialog relative z-10 w-full max-w-md p-6 flex flex-col gap-5"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title & Icon Header */}
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              "p-2.5 rounded-2xl border shrink-0 flex items-center justify-center",
              config.badgeBg
            )}
          >
            <Icon className={cn("h-5 w-5", config.iconColor)} aria-hidden="true" />
          </div>

          <div className="flex flex-col gap-1">
            <h2 id="dialog-title" className="text-base font-bold text-foreground">
              {title}
            </h2>
            <p
              id="dialog-description"
              className="text-xs text-muted-foreground leading-relaxed"
            >
              {description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/40">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 h-9 rounded-xl text-xs font-semibold bg-background hover:bg-muted text-foreground border border-border shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={() => onConfirm()}
            disabled={isLoading}
            className={cn(
              "px-4 h-9 rounded-xl text-xs font-bold text-white shadow-xs transition-all cursor-pointer disabled:opacity-75",
              isDestructive
                ? "bg-rose-600 hover:bg-rose-700 active:scale-98"
                : "bg-primary hover:opacity-90 active:scale-98"
            )}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full border-2 border-current border-r-transparent animate-spin" />
                Processing...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
