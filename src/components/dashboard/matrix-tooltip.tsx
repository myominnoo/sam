import type { ReactNode } from "react"
import { Tooltip } from "@base-ui/react/tooltip"
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
}

export function MatrixTooltip({
  title,
  subtitle,
  totalLabel,
  items,
}: MatrixTooltipProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        render={<span />}
        aria-label={`${title}${totalLabel ? `: ${totalLabel}` : ""}`}
        role="button"
        tabIndex={0}
        delay={150}
        className="absolute inset-0"
      />
      <Tooltip.Portal>
        <Tooltip.Positioner side="bottom" sideOffset={8} align="center" collisionPadding={8}>
          <Tooltip.Popup className="flex min-w-[200px] flex-col gap-1 rounded-xl border border-border bg-popover/95 p-2.5 text-left text-[10px] text-popover-foreground shadow-2xl backdrop-blur-md transition-[opacity,transform] duration-150 data-ending-style:opacity-0 data-ending-style:[transform:scale(0.98)] data-starting-style:opacity-0 data-starting-style:[transform:scale(0.98)]">
            <div className="flex flex-col gap-0.5 border-b border-border/60 pb-1 font-bold">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground">{title}</span>
                {totalLabel && <span className="font-bold text-emerald-600 dark:text-emerald-400">{totalLabel}</span>}
              </div>
              {subtitle && (
                <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
                  {subtitle}
                </div>
              )}
            </div>

            {items.map((item) => {
              const pctVal = item.percentage <= 1 ? item.percentage * 100 : item.percentage

              return (
                <div key={item.id} className="flex items-center justify-between gap-2 pt-0.5">
                  <span className="truncate font-medium text-foreground/90">
                    {toTitleCase(item.name)}
                    {item.designation && (
                      <span className="ml-1 text-[9px] font-normal text-muted-foreground">
                        ({item.designation})
                      </span>
                    )}
                  </span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {item.role && <RoleBadge role={item.role} isSubRow />}
                    <span className="font-bold text-foreground">{Math.round(pctVal)}%</span>
                  </div>
                </div>
              )
            })}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
