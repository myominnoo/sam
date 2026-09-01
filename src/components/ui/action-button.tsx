import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  label: string
  color?: "primary" | "amber" | "emerald" | "sky" | "purple" | "rose"
  destructive?: boolean
}

export function ActionButton({
  icon: Icon,
  label,
  destructive,
  className,
  ...props
}: ActionButtonProps) {
  return (
    <button
      type="button"
      title={label}
      className={cn(
        "inline-flex items-center gap-2 px-3.5 h-9 rounded-2xl border border-border/70 text-xs font-semibold transition-all cursor-pointer shadow-2xs shrink-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        destructive
          ? "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20 text-rose-600 dark:text-rose-400"
          : "bg-background hover:bg-muted border-border text-foreground hover:text-foreground/90",
        className
      )}
      {...props}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
