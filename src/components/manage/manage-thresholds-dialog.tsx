import { useState } from "react"
import { AlertTriangle, RotateCcw, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ThresholdSettings {
  maxProjectsPerStaff: number
  maxStaffPerProject: number
}

export const DEFAULT_THRESHOLDS: ThresholdSettings = {
  maxProjectsPerStaff: 3,
  maxStaffPerProject: 4,
}

interface ManageThresholdsDialogProps {
  open: boolean
  onClose: () => void
  thresholds?: ThresholdSettings
  onSave?: (newThresholds: ThresholdSettings) => void
}

export function ManageThresholdsDialog({
  open,
  onClose,
  thresholds = DEFAULT_THRESHOLDS,
  onSave,
}: ManageThresholdsDialogProps) {
  const [maxProjects, setMaxProjects] = useState<number>(
    thresholds.maxProjectsPerStaff
  )
  const [maxStaff, setMaxStaff] = useState<number>(
    thresholds.maxStaffPerProject
  )

  const handleClose = () => {
    // Reset local state to prop values on close
    setMaxProjects(thresholds.maxProjectsPerStaff)
    setMaxStaff(thresholds.maxStaffPerProject)
    onClose()
  }

  const handleResetDefaults = () => {
    setMaxProjects(DEFAULT_THRESHOLDS.maxProjectsPerStaff)
    setMaxStaff(DEFAULT_THRESHOLDS.maxStaffPerProject)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onSave?.({
      maxProjectsPerStaff: maxProjects,
      maxStaffPerProject: maxStaff,
    })
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={(e) => e.key === "Escape" && handleClose()}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in-50 duration-200"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="thresholds-dialog-title"
        className={cn(
          "relative z-10 w-full max-w-md rounded-3xl border border-border/60",
          "bg-card text-card-foreground shadow-2xl",
          "overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 px-6 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shadow-xs">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="thresholds-dialog-title"
                className="text-base font-bold text-foreground tracking-tight"
              >
                Flagging Thresholds
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set count limits to trigger warning badges on matrices.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
            title="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Form Body */}
        <form onSubmit={handleSave} className="p-6 flex flex-col gap-5">
          {/* Max Projects per Staff */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="max-projects-input"
              className="text-xs font-bold text-foreground/90"
            >
              Max Projects per Staff (Default: {DEFAULT_THRESHOLDS.maxProjectsPerStaff})
            </label>
            <input
              id="max-projects-input"
              type="number"
              min={1}
              max={50}
              value={maxProjects}
              onChange={(e) => setMaxProjects(parseInt(e.target.value) || 1)}
              className="w-full h-10 px-4 rounded-2xl text-sm font-medium bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs"
            />
          </div>

          {/* Max Staff per Project */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="max-staff-input"
              className="text-xs font-bold text-foreground/90"
            >
              Max Staff per Project (Default: {DEFAULT_THRESHOLDS.maxStaffPerProject})
            </label>
            <input
              id="max-staff-input"
              type="number"
              min={1}
              max={50}
              value={maxStaff}
              onChange={(e) => setMaxStaff(parseInt(e.target.value) || 1)}
              className="w-full h-10 px-4 rounded-2xl text-sm font-medium bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs"
            />
          </div>

          <div className="h-px bg-border/50 my-1" />

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-2 px-1"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Defaults
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 h-9 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 h-9 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-sm transition-all cursor-pointer"
              >
                Save Limits
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}