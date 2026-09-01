import { useState, useEffect } from "react"
import { SlidersHorizontal, X, Check, FolderKanban, AlertCircle, Loader2, Divide } from "lucide-react"
import { db } from "@/db/schema"
import { toTitleCase } from "@/lib/string-utils"
import { generateMonthRange, getCurrentYearMonth } from "@/lib/date-utils"
import type { Staff, Assignment, Project, Allocation } from "@/types/sam"

interface ConfigureCapacityDialogProps {
  open: boolean
  staff: Staff | null
  assignmentList: Assignment[]
  projectList: Project[]
  onClose: () => void
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const availableMonths = generateMonthRange("2025-01", 72)

  const staffAssignments = staff
    ? assignmentList.filter((a) => a.staffId === staff.id)
    : []

  const assignedProjects = projectList.filter((p) =>
    staffAssignments.some((a) => a.projectId === p.id)
  )

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
    setErrorMessage(null)
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
      setErrorMessage(null)
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

  const handleApply = async () => {
    setErrorMessage(null)
    const targetAssignments = staffAssignments.filter((a) =>
      selectedProjectIds.includes(a.projectId)
    )

    if (targetAssignments.length === 0) {
      setErrorMessage("Please select at least one project.")
      return
    }

    setIsSaving(true)
    try {
      let monthsToApply: string[] = []

      if (scope === "all") {
        monthsToApply = availableMonths.map((m) => m.key)
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

      const rawTargetPercentage =
        canDivideEqually && divideEqually
          ? 100 / targetAssignments.length
          : capacity
      const percentageValue = rawTargetPercentage / 100

      const currentAllocations = (await db.allocations.toArray()) as Allocation[]
      const allocationsByAssignmentAndMonth = new Map(
        currentAllocations.map((allocation) => [`${allocation.assignmentId}:${allocation.month}`, allocation])
      )
      const targetAssignmentIds = new Set(targetAssignments.map((assignment) => assignment.id))

      for (const monthKey of monthsToApply) {
        let predictedTotal = 0

        for (const assignment of staffAssignments) {
          const isTargeted = targetAssignmentIds.has(assignment.id)
          if (isTargeted) {
            predictedTotal += percentageValue
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
          setErrorMessage(
            `Total capacity for ${toTitleCase(staff.name)} in ${monthLabel} would exceed 100% (calculated: ${Math.round(
              predictedTotal * 100
            )}%).`
          )
          setIsSaving(false)
          return
        }
      }

      let maxAllocId = currentAllocations.reduce(
        (max, item) => Math.max(max, Number(item.id) || 0),
        0
      )

      const allocationsToSave: Allocation[] = []
      for (const assignment of targetAssignments) {
        for (const monthKey of monthsToApply) {
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

      handleClose()
    } catch (err) {
      console.error("Failed to apply capacity:", err)
      setErrorMessage(`Failed to save: ${(err as Error).message || "Unknown error"}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in-50 duration-200">
      <div className="w-[min(96vw,42rem)] max-w-none rounded-3xl border border-border/80 bg-card text-card-foreground shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="h-5 w-5 text-primary shrink-0" />
            <h2 className="text-base font-bold text-foreground">
              Bulk Set Capacity: {toTitleCase(staff.name)}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error Feedback Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-2xl animate-in fade-in-50">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

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
                max={200}
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
              <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto p-2 border border-border/60 rounded-2xl bg-muted/20">
                {assignedProjects.map((p) => {
                  const isChecked = selectedProjectIds.includes(p.id)
                  return (
                    <label
                      key={p.id}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors text-xs font-medium"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleProject(p.id)}
                        className="h-4 w-4 rounded accent-primary cursor-pointer"
                      />
                      <span className="text-foreground">{toTitleCase(p.name)}</span>
                    </label>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs italic text-muted-foreground p-2 border border-border/40 rounded-2xl bg-muted/10">
                No active projects assigned to this staff member.
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
                  <Divide className="h-3.5 w-3.5" /> Split capacity equally (
                  {Math.round(100 / assignedProjects.length)}% each)
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

            {/* Custom Date Range Selectors */}
            {scope === "custom" && (
              <div className="grid grid-cols-2 gap-3 mt-1 pl-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    From:
                  </label>
                  <select
                    value={fromMonth}
                    onChange={(e) => setFromMonth(e.target.value)}
                    className="h-10 px-3 rounded-xl bg-background border border-input text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {availableMonths.map((m) => (
                      <option key={`from-${m.key}`} value={m.key}>
                        {m.monthLabel} {m.year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    To:
                  </label>
                  <select
                    value={toMonth}
                    onChange={(e) => setToMonth(e.target.value)}
                    className="h-10 px-3 rounded-xl bg-background border border-input text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {availableMonths.map((m) => (
                      <option key={`to-${m.key}`} value={m.key}>
                        {m.monthLabel} {m.year}
                      </option>
                    ))}
                  </select>
                </div>
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
