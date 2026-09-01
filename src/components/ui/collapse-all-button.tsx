import { ChevronsUpDown, ChevronsDownUp } from "lucide-react"

interface CollapseAllButtonProps {
  isAllExpanded: boolean
  onToggle: () => void
  label?: string
}

export function CollapseAllButton({
  isAllExpanded,
  onToggle,
  label,
}: CollapseAllButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center justify-center h-7 w-7 rounded-xl text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 border border-border/60 transition-all shadow-2xs cursor-pointer select-none"
      title={isAllExpanded ? "Collapse All Sub-rows" : "Expand All Sub-rows"}
    >
      {isAllExpanded ? (
        <ChevronsDownUp className="h-4 w-4 text-primary shrink-0" />
      ) : (
        <ChevronsUpDown className="h-4 w-4 text-primary shrink-0" />
      )}
      {label && <span className="ml-1.5 text-xs font-semibold">{label}</span>}
    </button>
  )
}