import { Tooltip } from "@base-ui/react/tooltip"
import { AlertTriangle, CheckCircle2 } from "lucide-react"

interface CountLimitBadgeProps {
  count: number
  limit: number
  noun: string
}

/** A compact, accessible count status used by both planning matrices. */
export function CountLimitBadge({ count, limit, noun }: CountLimitBadgeProps) {
  const exceedsLimit = count > limit
  const status = exceedsLimit ? "Above limit" : "Within limit"
  const Icon = exceedsLimit ? AlertTriangle : CheckCircle2

  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        render={<span />}
        className={`inline-flex items-center justify-center gap-0.5 h-4.5 sm:h-5 min-w-4.5 sm:min-w-5 px-1 sm:px-1.5 rounded-full text-[9px] sm:text-[10px] font-bold border cursor-default ${exceedsLimit ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/35" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"}`}
        aria-label={`${count} ${noun}; limit ${limit}; ${status.toLowerCase()}`}
      >
        <Icon className="size-3" aria-hidden="true" />
        {count}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner side="bottom" sideOffset={8} align="center" collisionPadding={8} className="z-[60]">
          <Tooltip.Popup className="flex flex-col gap-0.5 rounded-xl border border-border bg-popover/95 px-3 py-2 text-left text-[10px] text-popover-foreground shadow-xl backdrop-blur-md transition-[opacity,transform] duration-150 data-ending-style:opacity-0 data-ending-style:[transform:scale(0.98)] data-starting-style:opacity-0 data-starting-style:[transform:scale(0.98)]">
            <span className="font-bold text-foreground">{status}</span>
            <span className="text-muted-foreground">{count} {noun} assigned · limit {limit}</span>
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
