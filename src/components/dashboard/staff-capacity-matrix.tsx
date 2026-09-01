import { Fragment, useEffect, useMemo, useState, type Ref } from "react"
import { Users, ChevronRight, ChevronDown, UserPlus } from "lucide-react"
import { toTitleCase } from "@/lib/string-utils"
import { RoleBadge } from "@/components/ui/role-badge"
import { useMatrixTimeline } from "@/hooks/use-matrix-timeline"
import { MatrixTooltip } from "@/components/dashboard/matrix-tooltip"
import { MatrixColumnGroup, MatrixHeader } from "@/components/dashboard/matrix-header"
import { useMatrixExpansion } from "@/hooks/use-matrix-expansion"
import { useMatrixResponsiveLayout } from "@/hooks/use-matrix-responsive-layout"
import { CollapseAllButton } from "@/components/ui/collapse-all-button"
import type { Allocation, Assignment, Project, Staff } from "@/types/sam"

interface StaffCapacityMatrixProps {
  staffList: Staff[]
  projectList: Project[]
  assignmentList: Assignment[]
  allocationList: Allocation[]
  startMonth?: string
  endMonth?: string
  scrollRef?: Ref<HTMLDivElement>
  onScroll?: () => void
}

const STAFF_MATRIX_COLLAPSED_KEY = "sam_staff_matrix_collapsed"
const STAFF_MATRIX_EXPANDED_ROWS_KEY = "sam_staff_matrix_expanded_rows"

export function StaffCapacityMatrix({
  staffList,
  projectList,
  assignmentList,
  allocationList,
  startMonth = "2026-08",
  endMonth = "2028-01",
  scrollRef,
  onScroll,
}: StaffCapacityMatrixProps) {
  const [isMatrixCollapsed, setIsMatrixCollapsed] = useState(
    () => localStorage.getItem(STAFF_MATRIX_COLLAPSED_KEY) === "true"
  )
  const { projectsById, assignmentsByStaffId, allocationsByStaffAndMonth, allocationsByAssignmentAndMonth } = useMemo(() => {
    const projectsById = new Map(projectList.map((project) => [project.id, project]))
    const assignmentsByStaffId = new Map<number, Assignment[]>()
    const allocationsByStaffAndMonth = new Map<string, Allocation[]>()
    const allocationsByAssignmentAndMonth = new Map<string, Allocation>()

    for (const assignment of assignmentList) {
      const assignments = assignmentsByStaffId.get(assignment.staffId) ?? []
      assignments.push(assignment)
      assignmentsByStaffId.set(assignment.staffId, assignments)
    }
    for (const allocation of allocationList) {
      const key = `${allocation.staffId}:${allocation.month}`
      const allocations = allocationsByStaffAndMonth.get(key) ?? []
      allocations.push(allocation)
      allocationsByStaffAndMonth.set(key, allocations)
      allocationsByAssignmentAndMonth.set(`${allocation.assignmentId}:${allocation.month}`, allocation)
    }
    return { projectsById, assignmentsByStaffId, allocationsByStaffAndMonth, allocationsByAssignmentAndMonth }
  }, [projectList, assignmentList, allocationList])

  const staffIds = staffList.map((s) => s.id)
  const { toggleExpand, isExpanded, toggleAll, isAllExpanded } = useMatrixExpansion(
    staffIds,
    STAFF_MATRIX_EXPANDED_ROWS_KEY
  )
  const { months, yearGroups } = useMatrixTimeline(startMonth, endMonth)

  useEffect(() => {
    localStorage.setItem(STAFF_MATRIX_COLLAPSED_KEY, String(isMatrixCollapsed))
  }, [isMatrixCollapsed])

  const { containerRef, containerMaxWidthClass, tableWidthClass, tableStyle } = useMatrixResponsiveLayout({
    monthCount: months.length,
  })

  const getAllocationColorClass = (sumPct: number) => {
    if (sumPct === 0) return "bg-transparent text-transparent"
    if (sumPct >= 100) return "bg-red-600 text-white font-bold"
    if (sumPct >= 90) return "bg-red-500/85 text-white font-bold"
    if (sumPct >= 70) return "bg-orange-400/90 text-orange-950 font-bold"
    if (sumPct >= 50) return "bg-amber-300/90 text-amber-950 font-bold"
    if (sumPct >= 25) return "bg-emerald-400/75 text-emerald-950 font-semibold"
    return "bg-emerald-200 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-semibold"
  }

  return (
    <section
      ref={containerRef}
      className={`${containerMaxWidthClass} rounded-3xl border border-neutral-300 dark:border-neutral-700/80 bg-card/75 dark:bg-card/60 text-card-foreground shadow-xs overflow-hidden transition-all duration-300`}
    >
      <div className="flex items-center justify-between p-3.5 px-4 border-b border-border/60 bg-muted/40">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary shrink-0" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Staff Allocation & Capacity
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {!isMatrixCollapsed && <CollapseAllButton isAllExpanded={isAllExpanded} onToggle={toggleAll} />}
          <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-bold border border-primary/20 shadow-2xs">
            {staffList.length} Staff Members
          </span>
          <button
            type="button"
            onClick={() => setIsMatrixCollapsed((collapsed) => !collapsed)}
            aria-expanded={!isMatrixCollapsed}
            aria-label={isMatrixCollapsed ? "Expand staff capacity matrix" : "Collapse staff capacity matrix"}
            title={isMatrixCollapsed ? "Expand matrix" : "Collapse matrix"}
            className="inline-flex size-7 items-center justify-center rounded-xl border border-border/60 bg-muted text-muted-foreground shadow-2xs transition-all hover:bg-muted/80 hover:text-foreground cursor-pointer"
          >
            <ChevronDown className={`size-4 text-primary transition-transform ${isMatrixCollapsed ? "-rotate-90" : ""}`} />
          </button>
        </div>
      </div>

      {!isMatrixCollapsed && (
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700"
        >
        <table className={`staff-capacity-table ${tableWidthClass} text-center border-collapse text-xs select-none [&_td]:!align-middle [&_th]:!align-middle`} style={tableStyle}>
          <MatrixColumnGroup monthCount={months.length} />
          <MatrixHeader
            metadataTitle="Staff Metadata"
            countLabel="# Proj"
            months={months}
            yearGroups={yearGroups}
          />

          <tbody className="divide-y divide-border/30 font-medium">
            {staffList.length > 0 ? (
              staffList.map((s) => {
                const staffAssignments = assignmentsByStaffId.get(s.id) ?? []
                const assignedProjectIds = new Set(staffAssignments.map((a) => a.projectId))
                const expanded = isExpanded(s.id)

                return (
                  <Fragment key={s.id}>
                    <tr className="group bg-neutral-200/50 dark:bg-neutral-900/80 hover:bg-neutral-200/80 dark:hover:bg-neutral-800/80 hover:[&>td]:brightness-[.97] dark:hover:[&>td]:brightness-110 transition-[color,background-color,filter] border-t-2 border-border/60">
                      <td
                        onClick={() => toggleExpand(s.id)}
                        className="p-2 sm:p-2.5 px-2 sm:px-3 text-left font-bold text-foreground whitespace-nowrap select-none cursor-pointer sticky left-0 z-10 bg-neutral-200/90 dark:bg-neutral-900/90 backdrop-blur-md border-r border-border/40 w-[120px] sm:w-[176px]"
                      >
                        <div className="flex items-center justify-start gap-1 sm:gap-1.5 truncate">
                          <button
                            type="button"
                            className="p-0.5 rounded-xs hover:bg-neutral-300 dark:hover:bg-neutral-800 text-primary transition-transform duration-150 shrink-0"
                          >
                            {expanded ? (
                              <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            ) : (
                              <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            )}
                          </button>
                          <span className="truncate text-[11px] sm:text-xs">
                            {toTitleCase(s.name)}
                            {s.designation && (
                              <span className="ml-0.5 sm:ml-1 text-[9px] sm:text-[10px] font-mono text-muted-foreground font-normal">
                                ({s.designation})
                              </span>
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="p-1 sm:p-2 text-center w-12 sm:w-16 sticky left-[120px] sm:left-[176px] z-10 bg-neutral-200/95 dark:bg-neutral-900/95 backdrop-blur-md border-r-0">
                        <span className="inline-flex items-center justify-center h-4.5 sm:h-5 min-w-4.5 sm:min-w-5 px-1 sm:px-1.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          {assignedProjectIds.size}
                        </span>
                      </td>

                      {months.map((m, idx) => {
                        const monthAllocations = (allocationsByStaffAndMonth.get(`${s.id}:${m.key}`) ?? [])
                          .filter((allocation) => allocation.percentage > 0)

                        const rawSumPct = monthAllocations.reduce((sum, item) => {
                          const val = item.percentage ?? 0
                          return sum + (val <= 1 ? val * 100 : val)
                        }, 0)

                        return (
                          <td
                            key={m.key}
                            className={`relative group/cell p-1 text-center w-14 min-w-[56px] border-r border-border/20 text-[10px] transition-colors ${
                              idx === 0 ? "border-l-2 border-l-primary/50" : ""
                            } ${getAllocationColorClass(rawSumPct)}`}
                          >
                            {rawSumPct > 0 ? `${Math.round(rawSumPct)}%` : ""}

                            {monthAllocations.length > 0 && (
                              <MatrixTooltip
                                title={`${m.monthLabel} Breakdown`}
                                subtitle={
                                  <div className="flex w-full items-center justify-between gap-3">
                                    <span>Designation: {s.designation || "—"}</span>
                                    <span>FTE: {s.fte ?? "—"}</span>
                                  </div>
                                }
                                totalLabel={`${Math.round(rawSumPct)}%`}
                                items={monthAllocations.map((al) => {
                                  const proj = projectsById.get(al.projectId)
                                  const assign = staffAssignments.find((a) => a.projectId === al.projectId)
                                  return {
                                    id: al.id,
                                    name: proj?.name ?? "",
                                    role: assign?.role,
                                    percentage: al.percentage,
                                  }
                                })}
                              />
                            )}
                          </td>
                        )
                      })}
                    </tr>

                    {expanded &&
                      staffAssignments.map((assignment) => {
                        const proj = projectsById.get(assignment.projectId)
                        if (!proj) return null

                        return (
                          <tr
                            key={`sub-${s.id}-${proj.id}`}
                            className="bg-black/5 dark:bg-black/30 hover:bg-black/10 dark:hover:bg-black/40 hover:[&>td]:brightness-[.97] dark:hover:[&>td]:brightness-110 border-b border-border/20 text-[11px] transition-[color,background-color,filter]"
                          >
                            <td className="p-2 pl-4 sm:pl-7 text-left font-normal text-muted-foreground italic border-r border-border/40 sticky left-0 z-10 bg-neutral-100/95 dark:bg-neutral-950/95 border-l-2 border-l-primary/60 w-[120px] sm:w-[176px]">
                              <span className="truncate text-[10px] sm:text-[11px]">↳ {toTitleCase(proj.name)}</span>
                            </td>

                            <td className="p-1 sm:p-2 text-center w-12 sm:w-16 sticky left-[120px] sm:left-[176px] z-10 bg-neutral-100/95 dark:bg-neutral-950/95 border-r-0">
                              <RoleBadge role={assignment.role} isSubRow />
                            </td>

                            {months.map((m, idx) => {
                              const alloc = allocationsByAssignmentAndMonth.get(`${assignment.id}:${m.key}`)

                              const pctVal = alloc
                                ? alloc.percentage <= 1
                                  ? alloc.percentage * 100
                                  : alloc.percentage
                                : 0

                              return (
                                <td
                                  key={m.key}
                                  className={`p-1 text-center w-14 min-w-[56px] border-r border-border/20 text-[10px] text-muted-foreground/80 ${
                                    idx === 0 ? "border-l-2 border-l-primary/50" : ""
                                  }`}
                                >
                                  {pctVal > 0 ? `${Math.round(pctVal)}%` : ""}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                  </Fragment>
                )
              })
            ) : (
              <tr>
                <td colSpan={2 + months.length} className="p-8 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <UserPlus className="h-5 w-5 text-primary" />
                    <p className="text-xs font-bold text-foreground">No Staff Members Configured</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      )}
    </section>
  )
}
