import type { ReactNode } from "react"
import { toTitleCase } from "@/lib/string-utils"
import { RoleBadge } from "@/components/ui/role-badge"

interface AllocationBreakdownItem {
  id: number | string
  name: string
  role?: string
  percentage: number
  designation?: string
}

interface MatrixTooltipProps {
  title: string
  subtitle?: ReactNode
  totalLabel?: string
  items: AllocationBreakdownItem[]
  isNearRightEdge?: boolean
}

export function MatrixTooltip({
  title,
  subtitle,
  totalLabel,
  items,
  isNearRightEdge = false,
}: MatrixTooltipProps) {
  const popoverPositionClass = isNearRightEdge
    ? "right-0 translate-x-0"
    : "left-1/2 -translate-x-1/2"

  return (
    <div
      className={`absolute top-full mt-1.5 hidden group-hover/cell:flex flex-col gap-1 p-2.5 rounded-xl bg-popover/95 text-popover-foreground border border-border shadow-2xl z-50 min-w-[200px] text-[10px] pointer-events-none text-left backdrop-blur-md transition-all ${popoverPositionClass}`}
    >
      <div className="font-bold border-b border-border/60 pb-1 flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-foreground font-semibold">{title}</span>
          {totalLabel && <span className="text-emerald-600 dark:text-emerald-400 font-bold">{totalLabel}</span>}
        </div>
        {subtitle && (
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
            {subtitle}
          </div>
        )}
      </div>

      {items.map((item) => {
        const pctVal = item.percentage <= 1 ? item.percentage * 100 : item.percentage

        return (
          <div key={item.id} className="flex items-center justify-between gap-2 pt-0.5">
            <span className="truncate text-foreground/90 font-medium">
              {toTitleCase(item.name)}
              {item.designation && (
                <span className="ml-1 text-[9px] text-muted-foreground font-normal">
                  ({item.designation})
                </span>
              )}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {item.role && <RoleBadge role={item.role} isSubRow />}
              <span className="text-foreground font-bold">{Math.round(pctVal)}%</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}