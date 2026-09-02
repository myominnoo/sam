import { useMemo, useState, useEffect } from "react"
import { SlidersHorizontal, X, Check, FolderKanban, Loader2, Divide } from "lucide-react"
import { toast } from "sonner"
import { db } from "@/db/schema"
import { toTitleCase } from "@/lib/string-utils"
import { generateMonthRange, getCurrentYearMonth } from "@/lib/date-utils"
import { Slider } from "@/components/ui/slider"
import type { Staff, Assignment, Project, Allocation } from "@/types/sam"

interface ConfigureCapacityDialogProps {
  open: boolean
  staff: Staff | null
  assignmentList: Assignment[]
  projectList: Project[]
  onClose: () => void
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function formatProjectMonth(month: string) {
  const [year, monthNumber] = month.split("-")
  return `${MONTH_NAMES[Number(monthNumber) - 1] ?? month} ${year}`
}

interface ProjectSelectionGroupProps {
  projects: Project[]
  selectedProjectIds: (string | number)[]
  onToggle: (id: string | number) => void
}

function ProjectSelectionGroup({
  projects,
  selectedProjectIds,
  onToggle,
}: ProjectSelectionGroupProps) {
  if (projects.length === 0) return null

  const isActive = projects[0].isActive

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {isActive ? "Active projects" : "Inactive projects"} ({projects.length})
        </span>
      </div>
      {projects.map((project) => {
        const isChecked = selectedProjectIds.includes(project.id)

        return (
          <label
            key={project.id}
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-colors hover:bg-muted/50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => onToggle(project.id)}
              className="size-4 rounded accent-primary cursor-pointer"
            />
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-foreground">{toTitleCase(project.name)}</span>
              <span className="shrink-0 whitespace-nowrap text-[10px] font-medium text-muted-foreground">
                {formatProjectMonth(project.startMonth)} – {formatProjectMonth(project.endMonth)}
              </span>
              <span
                className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${
                  project.isActive
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-border bg-muted text-muted-foreground"
                }`}
              >
                {project.isActive ? "Active" : "Inactive"}
              </span>
            </span>
          </label>
        )
      })}
    </div>
  )
}

export function ConfigureCapacityDialog({
  open,
  staff,
  assignmentList,
  projectList,
  onClose,
}: ConfigureCapacityDialogProps) {
  const currentMonth = getCurrentYearMonth()

  const [capacity, setCapacity] = useState<number>(100)
  const [scope, setScope] = useState<"all" | "custom">("custom")
  const [fromMonth, setFromMonth] = useState<string>(currentMonth)
  const [toMonth, setToMonth] = useState<string>("2028-02")
  const [selectedProjectIds, setSelectedProjectIds] = useState<(string | number)[]>([])
  const [divideEqually, setDivideEqually] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState(false)

  // Keep the range broad enough for planning, while “all” below is constrained
  // to the selected projects' actual timelines.
  const availableMonths = generateMonthRange("2025-01", 72)
  const fromMonthIndex = Math.max(0, availableMonths.findIndex((month) => month.key === fromMonth))
  const toMonthIndex = Math.max(
    fromMonthIndex,
    availableMonths.findIndex((month) => month.key === toMonth)
  )

  const staffAssignments = staff
    ? assignmentList.filter((a) => a.staffId === staff.id)
    : []

  const assignedProjects = projectList.filter((p) =>
    staffAssignments.some((a) => a.projectId === p.id)
  )
  const projectById = useMemo(
    () => new Map(assignedProjects.map((project) => [project.id, project])),
    [assignedProjects]
  )
  const activeAssignedProjects = assignedProjects.filter((project) => project.isActive)
  const inactiveAssignedProjects = assignedProjects.filter((project) => !project.isActive)

  const isAllSelected =
    assignedProjects.length > 0 && selectedProjectIds.length === assignedProjects.length
  const canDivideEqually = capacity === 100 && isAllSelected

  const resetForm = () => {
    setCapacity(100)
    setScope("custom")
    setFromMonth(currentMonth)
    setToMonth("2028-02")
    setSelectedProjectIds([])
    setDivideEqually(false)
    setIsSaving(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  useEffect(() => {
    if (open && staffAssignments.length > 0) {
      setCapacity(100)
      setScope("custom")
      setFromMonth(currentMonth)
      setToMonth("2028-02")
      setSelectedProjectIds(assignedProjects.map((p) => p.id))
      setDivideEqually(false)
    }
  }, [open, staff])

  if (!open || !staff) return null

  const toggleProject = (id: string | number) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    )
  }

  const toggleAllProjects = () => {
    if (selectedProjectIds.length === assignedProjects.length) {
      setSelectedProjectIds([])
    } else {
      setSelectedProjectIds(assignedProjects.map((p) => p.id))
    }
  }

  const handleCustomRangeChange = ([newFromIndex, newToIndex]: readonly number[]) => {
    const newFromMonth = availableMonths[newFromIndex]?.key ?? fromMonth
    const newToMonth = availableMonths[newToIndex]?.key ?? toMonth

    setFromMonth(newFromMonth)
    setToMonth(newToMonth)
  }

  const handleApply = async () => {
    const targetAssignments = staffAssignments.filter((a) =>
      selectedProjectIds.includes(a.projectId)
    )

    if (targetAssignments.length === 0) {
      toast.error("Select at least one assigned project.")
      return
    }

    setIsSaving(true)
    try {
      let monthsToApply: string[] = []

      if (scope === "all") {
        const selectedProjects = targetAssignments
          .map((assignment) => projectById.get(assignment.projectId))
          .filter((project): project is Project => Boolean(project))
        const firstMonth = selectedProjects.reduce((earliest, project) =>
          project.startMonth < earliest ? project.startMonth : earliest, selectedProjects[0].startMonth)
        const lastMonth = selectedProjects.reduce((latest, project) =>
          project.endMonth > latest ? project.endMonth : latest, selectedProjects[0].endMonth)
        monthsToApply = availableMonths
          .filter((month) => month.key >= firstMonth && month.key <= lastMonth)
          .map((month) => month.key)
      } else {
        const startIndex = availableMonths.findIndex((m) => m.key === fromMonth)
        const endIndex = availableMonths.findIndex((m) => m.key === toMonth)

        if (startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex) {
          monthsToApply = availableMonths
            .slice(startIndex, endIndex + 1)
            .map((m) => m.key)
        } else {
          monthsToApply = [fromMonth]
        }
      }

      if (!Number.isFinite(capacity) || capacity < 0 || capacity > 100) {
        toast.error("Target capacity must be between 0% and 100%.")
        return
      }

      const currentAllocations = (await db.allocations.toArray()) as Allocation[]
      const allocationsByAssignmentAndMonth = new Map(
        currentAllocations.map((allocation) => [`${allocation.assignmentId}:${allocation.month}`, allocation])
      )

      const applicableAssignmentsByMonth = new Map<string, Assignment[]>()
      for (const monthKey of monthsToApply) {
        const applicable = targetAssignments.filter((assignment) => {
          const project = projectById.get(assignment.projectId)
          return project && monthKey >= project.startMonth && monthKey <= project.endMonth
        })
        if (applicable.length > 0) applicableAssignmentsByMonth.set(monthKey, applicable)
      }

      if (applicableAssignmentsByMonth.size === 0) {
        toast.error("The selected projects do not overlap the chosen date range.")
        return
      }

      for (const [monthKey, applicableAssignments] of applicableAssignmentsByMonth) {
        let predictedTotal = 0
        const applicableAssignmentIds = new Set(applicableAssignments.map((assignment) => assignment.id))
        const targetPercentage = divideEqually && canDivideEqually
          ? 1 / applicableAssignments.length
          : capacity / 100

        for (const assignment of staffAssignments) {
          if (applicableAssignmentIds.has(assignment.id)) {
            predictedTotal += targetPercentage
          } else {
            const existing = allocationsByAssignmentAndMonth.get(`${assignment.id}:${monthKey}`)
            if (existing) {
              predictedTotal += existing.percentage
            }
          }
        }

        if (predictedTotal > 1.0001) {
          const monthObj = availableMonths.find((m) => m.key === monthKey)
          const monthLabel = monthObj
            ? `${monthObj.monthLabel} ${monthObj.year}`
            : monthKey
          toast.error(`Capacity would exceed 100% in ${monthLabel}.`, {
            description: `${toTitleCase(staff.name)} would reach ${Math.round(predictedTotal * 100)}%.`,
          })
          setIsSaving(false)
          return
        }
      }

      let maxAllocId = currentAllocations.reduce(
        (max, item) => Math.max(max, Number(item.id) || 0),
        0
      )

      const allocationsToSave: Allocation[] = []
      for (const [monthKey, applicableAssignments] of applicableAssignmentsByMonth) {
        const percentageValue = divideEqually && canDivideEqually
          ? 1 / applicableAssignments.length
          : capacity / 100
        for (const assignment of applicableAssignments) {
          const existing = allocationsByAssignmentAndMonth.get(`${assignment.id}:${monthKey}`)
          maxAllocId += existing ? 0 : 1
          allocationsToSave.push({
            id: existing?.id ?? maxAllocId,
            assignmentId: assignment.id,
            staffId: staff.id,
            projectId: assignment.projectId,
            month: monthKey,
            percentage: percentageValue,
          })
        }
      }

      await db.transaction("rw", [db.allocations], async () => {
        await db.allocations.bulkPut(allocationsToSave)
      })

      toast.success("Capacity updated", {
        description: `Updated ${allocationsToSave.length} allocation${allocationsToSave.length === 1 ? "" : "s"} for ${toTitleCase(staff.name)}.`,
      })
      handleClose()
    } catch (err) {
      console.error("Failed to apply capacity:", err)
      toast.error("Could not update capacity", {
        description: (err as Error).message || "Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="sam-dialog-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="sam-dialog w-[min(96vw,42rem)] max-w-none overflow-hidden">
        {/* Header */}
        <div className="sam-dialog-header flex items-center justify-between p-5">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="h-5 w-5 text-primary shrink-0" />
            <h2 className="text-base font-bold text-foreground">
              Bulk Set Capacity: {toTitleCase(staff.name)}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="sam-dialog-close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">
          {/* Target Capacity Field */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground">
              Target Capacity (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={100}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value) || 0)}
                className="flex-1 h-11 px-4 rounded-2xl bg-background border border-input text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
              <button
                type="button"
                onClick={() => setCapacity(100)}
                className="h-11 px-4 rounded-2xl bg-muted/60 hover:bg-muted text-xs font-semibold text-foreground border border-border/60 transition-colors cursor-pointer shrink-0"
              >
                Reset (100%)
              </button>
            </div>
          </div>

          <hr className="border-border/40" />

          {/* Target Projects Checklist */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <FolderKanban className="h-3.5 w-3.5 text-primary" /> Target Assigned Projects
              </label>
              {assignedProjects.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAllProjects}
                  className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                >
                  {isAllSelected ? "Deselect All" : "Select All"}
                </button>
              )}
            </div>

            {assignedProjects.length > 0 ? (
              <div className="flex max-h-48 flex-col gap-3 overflow-y-auto rounded-2xl border border-border/60 bg-muted/20 p-2">
                <ProjectSelectionGroup
                  projects={activeAssignedProjects}
                  selectedProjectIds={selectedProjectIds}
                  onToggle={toggleProject}
                />
                <ProjectSelectionGroup
                  projects={inactiveAssignedProjects}
                  selectedProjectIds={selectedProjectIds}
                  onToggle={toggleProject}
                />
              </div>
            ) : (
              <p className="text-xs italic text-muted-foreground p-2 border border-border/40 rounded-2xl bg-muted/10">
                No projects assigned to this staff member.
              </p>
            )}

            {/* Equal Allocation Checkbox */}
            {canDivideEqually && (
              <label className="flex items-center gap-2 mt-1 px-1 text-xs font-medium text-foreground cursor-pointer animate-in fade-in-50">
                <input
                  type="checkbox"
                  checked={divideEqually}
                  onChange={(e) => setDivideEqually(e.target.checked)}
                  className="h-4 w-4 rounded accent-primary cursor-pointer"
                />
                <span className="flex items-center gap-1.5 text-primary font-semibold">
                  <Divide className="h-3.5 w-3.5" /> Split 100% equally across projects active in each month
                </span>
              </label>
            )}
          </div>

          <hr className="border-border/40" />

          {/* Apply Scope Section */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-semibold text-muted-foreground">
              Apply Scope
            </label>
            <div className="flex flex-col gap-2.5">
              <label className="flex items-center gap-2.5 text-xs font-medium text-foreground cursor-pointer">
                <input
                  type="radio"
                  name="applyScope"
                  checked={scope === "all"}
                  onChange={() => setScope("all")}
                  className="h-4 w-4 accent-primary cursor-pointer"
                />
                <span>Apply to all timeline months</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs font-medium text-foreground cursor-pointer">
                <input
                  type="radio"
                  name="applyScope"
                  checked={scope === "custom"}
                  onChange={() => setScope("custom")}
                  className="h-4 w-4 accent-primary cursor-pointer"
                />
                <span>Apply to custom date range</span>
              </label>
            </div>

            {/* Custom Date Range */}
            {scope === "custom" && (
              <div className="mt-1 ml-6 rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">From</span>
                    <span className="text-xs font-semibold text-foreground">
                      {formatProjectMonth(fromMonth)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">To</span>
                    <span className="text-xs font-semibold text-foreground">
                      {formatProjectMonth(toMonth)}
                    </span>
                  </div>
                </div>
                <Slider
                  min={0}
                  max={availableMonths.length - 1}
                  step={1}
                  value={[fromMonthIndex, toMonthIndex]}
                  thumbCollisionBehavior="none"
                  onValueChange={handleCustomRangeChange}
                />
              </div>
            )}
          </div>

          <hr className="border-border/40" />

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="px-5 h-10 rounded-2xl text-xs font-bold border border-border/80 hover:bg-muted/50 text-foreground transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isSaving || selectedProjectIds.length === 0}
              className="inline-flex items-center gap-1.5 px-6 h-10 rounded-2xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-xs cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Apply
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
