import { useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
  id?: string;
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

const variantStyles: Record<
  ToastType,
  { bg: string; border: string; icon: ReactNode; progress: string }
> = {
  success: {
    bg: "bg-slate-900 text-white",
    border: "border-slate-800",
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    progress: "bg-emerald-400",
  },
  error: {
    bg: "bg-slate-900 text-white",
    border: "border-slate-800",
    icon: <XCircle className="w-4 h-4 text-rose-400 shrink-0" />,
    progress: "bg-rose-400",
  },
  warning: {
    bg: "bg-slate-900 text-white",
    border: "border-slate-800",
    icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
    progress: "bg-amber-400",
  },
  info: {
    bg: "bg-slate-900 text-white",
    border: "border-slate-800",
    icon: <Info className="w-4 h-4 text-sky-400 shrink-0" />,
    progress: "bg-sky-400",
  },
};

export function Toast({
  message,
  type = "success",
  onClose,
  duration = 4000,
}: ToastProps) {
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || duration <= 0) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration, isPaused]);

  const style = variantStyles[type] || variantStyles.info;

  return (
    <div
      role="alert"
      aria-live="assertive"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`fixed bottom-5 right-5 z-[100] flex flex-col overflow-hidden rounded-xl shadow-xl border ${style.bg} ${style.border} min-w-[280px] max-w-md animate-in fade-in slide-in-from-bottom-4 duration-200`}
    >
      <div className="flex items-center gap-3 px-4 py-3 text-xs font-medium">
        {style.icon}
        <span className="flex-1 leading-snug">{message}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="ml-2 text-slate-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 rounded p-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {duration > 0 && (
        <div className="h-0.5 w-full bg-slate-800">
          <div
            className={`h-full ${style.progress} transition-all ease-linear`}
            style={{
              animationDuration: `${duration}ms`,
              animationPlayState: isPaused ? "paused" : "running",
            }}
          />
        </div>
      )}
    </div>
  );
}
