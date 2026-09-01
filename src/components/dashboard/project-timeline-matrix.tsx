import { Fragment, useEffect, useMemo, useState, type Ref } from "react"
import { FolderKanban, Check, FolderPlus, ChevronRight, ChevronDown } from "lucide-react"
import { toTitleCase } from "@/lib/string-utils"
import { RoleBadge } from "@/components/ui/role-badge"
import { useMatrixTimeline } from "@/hooks/use-matrix-timeline"
import { MatrixTooltip } from "@/components/dashboard/matrix-tooltip"
import { MatrixColumnGroup, MatrixHeader } from "@/components/dashboard/matrix-header"
import { useMatrixExpansion } from "@/hooks/use-matrix-expansion"
import { useMatrixResponsiveLayout } from "@/hooks/use-matrix-responsive-layout"
import { CollapseAllButton } from "@/components/ui/collapse-all-button"
import type { Allocation, Assignment, Project, Staff } from "@/types/sam"

interface ProjectTimelineMatrixProps {
  staffList: Staff[]
  projectList: Project[]
  assignmentList: Assignment[]
  allocationList: Allocation[]
  startMonth?: string
  endMonth?: string
  scrollRef?: Ref<HTMLDivElement>
  onScroll?: () => void
}

const PROJECT_MATRIX_COLLAPSED_KEY = "sam_project_matrix_collapsed"
const PROJECT_MATRIX_EXPANDED_ROWS_KEY = "sam_project_matrix_expanded_rows"

export function ProjectTimelineMatrix({
  staffList,
  projectList,
  assignmentList,
  allocationList,
  startMonth = "2026-08",
  endMonth = "2028-01",
  scrollRef,
  onScroll,
}: ProjectTimelineMatrixProps) {
  const [isMatrixCollapsed, setIsMatrixCollapsed] = useState(
    () => localStorage.getItem(PROJECT_MATRIX_COLLAPSED_KEY) === "true"
  )
  const { staffById, assignmentsByProjectId, allocationsByProjectAndMonth, allocationsByAssignmentAndMonth } = useMemo(() => {
    const staffById = new Map(staffList.map((staff) => [staff.id, staff]))
    const assignmentsByProjectId = new Map<number, Assignment[]>()
    const allocationsByProjectAndMonth = new Map<string, Allocation[]>()
    const allocationsByAssignmentAndMonth = new Map<string, Allocation>()
    for (const assignment of assignmentList) {
      const assignments = assignmentsByProjectId.get(assignment.projectId) ?? []
      assignments.push(assignment)
      assignmentsByProjectId.set(assignment.projectId, assignments)
    }
    for (const allocation of allocationList) {
      const key = `${allocation.projectId}:${allocation.month}`
      const allocations = allocationsByProjectAndMonth.get(key) ?? []
      allocations.push(allocation)
      allocationsByProjectAndMonth.set(key, allocations)
      allocationsByAssignmentAndMonth.set(`${allocation.assignmentId}:${allocation.month}`, allocation)
    }
    return { staffById, assignmentsByProjectId, allocationsByProjectAndMonth, allocationsByAssignmentAndMonth }
  }, [staffList, assignmentList, allocationList])

  const projectIds = projectList.map((p) => p.id)
  const { toggleExpand, isExpanded, toggleAll, isAllExpanded } = useMatrixExpansion(
    projectIds,
    PROJECT_MATRIX_EXPANDED_ROWS_KEY
  )
  const { months, yearGroups } = useMatrixTimeline(startMonth, endMonth)

  useEffect(() => {
    localStorage.setItem(PROJECT_MATRIX_COLLAPSED_KEY, String(isMatrixCollapsed))
  }, [isMatrixCollapsed])

  const { containerRef, containerMaxWidthClass, tableWidthClass, tableStyle } = useMatrixResponsiveLayout({
    monthCount: months.length,
  })

  return (
    <section
      ref={containerRef}
      className={`${containerMaxWidthClass} rounded-3xl border border-neutral-300 dark:border-neutral-700/80 bg-card/75 dark:bg-card/60 text-card-foreground shadow-xs overflow-hidden transition-all duration-300`}
    >
      <div className="flex items-center justify-between p-3.5 px-4 border-b border-border/60 bg-muted/40">
        <div className="flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-primary shrink-0" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Project Timeline & Staffing
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {!isMatrixCollapsed && <CollapseAllButton isAllExpanded={isAllExpanded} onToggle={toggleAll} />}
          <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-bold border border-primary/20 shadow-2xs">
            {projectList.length} Projects
          </span>
          <button
            type="button"
            onClick={() => setIsMatrixCollapsed((collapsed) => !collapsed)}
            aria-expanded={!isMatrixCollapsed}
            aria-label={isMatrixCollapsed ? "Expand project timeline matrix" : "Collapse project timeline matrix"}
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
        <table className={`project-timeline-table ${tableWidthClass} text-left border-collapse text-xs select-none`} style={tableStyle}>
          <MatrixColumnGroup monthCount={months.length} />
          <MatrixHeader
            metadataTitle="Project Metadata"
            countLabel="# Staff"
            months={months}
            yearGroups={yearGroups}
          />

          <tbody className="divide-y divide-border/30 font-medium [&>tr>td]:!align-top">
            {projectList.length > 0 ? (
              projectList.map((p) => {
                const projectAssignments = assignmentsByProjectId.get(p.id) ?? []
                const assignedStaffIds = new Set(projectAssignments.map((a) => a.staffId))
                const expanded = isExpanded(p.id)

                return (
                  <Fragment key={p.id}>
                    <tr className="group bg-neutral-200/50 dark:bg-neutral-900/80 hover:bg-neutral-200/80 dark:hover:bg-neutral-800/80 transition-colors border-t-2 border-border/60">
                      <td
                        onClick={() => toggleExpand(p.id)}
                        className="p-2 sm:p-2.5 px-2 sm:px-3 align-top font-bold text-foreground whitespace-nowrap select-none cursor-pointer sticky left-0 z-10 bg-neutral-200/90 dark:bg-neutral-900/90 backdrop-blur-md border-r border-border/40 w-[120px] sm:w-[176px]"
                      >
                        <div className="flex items-center gap-1 sm:gap-1.5 truncate">
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
                            {toTitleCase(p.name)}
                          </span>
                        </div>
                      </td>

                      <td className="p-1 sm:p-2 align-top text-center w-12 sm:w-16 sticky left-[120px] sm:left-[176px] z-10 bg-neutral-200/95 dark:bg-neutral-900/95 backdrop-blur-md border-r-0">
                        <span className="inline-flex items-center justify-center h-4.5 sm:h-5 min-w-4.5 sm:min-w-5 px-1 sm:px-1.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          {assignedStaffIds.size}
                        </span>
                      </td>

                      {months.map((m, idx) => {
                        const isWithinProjectSchedule =
                          (!p.startMonth || m.key >= p.startMonth) &&
                          (!p.endMonth || m.key <= p.endMonth)

                        const monthAllocations = (allocationsByProjectAndMonth.get(`${p.id}:${m.key}`) ?? [])
                          .filter((allocation) => allocation.percentage > 0)

                        const isProjectActiveInMonth =
                          isWithinProjectSchedule && monthAllocations.length > 0

                        return (
                          <td
                            key={m.key}
                            className={`relative group/cell p-1 align-top text-center w-14 min-w-[56px] border-r border-border/20 transition-colors ${
                              idx === 0 ? "border-l-2 border-l-primary/50" : ""
                            } ${
                              isProjectActiveInMonth
                                ? "bg-emerald-500/15 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold"
                                : "bg-transparent text-transparent"
                            }`}
                          >
                            {isProjectActiveInMonth ? (
                              <div className="flex items-center justify-center">
                                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                              </div>
                            ) : null}

                            {monthAllocations.length > 0 && (
                              <MatrixTooltip
                                title={`${m.monthLabel} Staffing`}
                                subtitle={
                                  <div className="flex w-full items-center justify-between gap-3">
                                    <span>Start: {p.startMonth || "—"}</span>
                                    <span>End: {p.endMonth || "—"}</span>
                                  </div>
                                }
                                totalLabel={`${monthAllocations.length} Active`}
                                items={monthAllocations.map((al) => {
                                  const staff = staffById.get(al.staffId)
                                  const assign = projectAssignments.find((a) => a.staffId === al.staffId)
                                  return {
                                    id: al.id,
                                    name: staff?.name ?? "",
                                    designation: staff?.designation,
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
                      projectAssignments.map((assignment) => {
                        const staff = staffById.get(assignment.staffId)
                        if (!staff) return null

                        return (
                          <tr
                            key={`sub-${p.id}-${staff.id}`}
                            className="bg-black/5 dark:bg-black/30 hover:bg-black/10 dark:hover:bg-black/40 border-b border-border/20 text-[11px] transition-colors"
                          >
                            <td className="p-2 pl-4 sm:pl-7 align-top font-normal text-muted-foreground italic border-r border-border/40 sticky left-0 z-10 bg-neutral-100/95 dark:bg-neutral-950/95 border-l-2 border-l-primary/60 w-[120px] sm:w-[176px]">
                              <span className="truncate text-[10px] sm:text-[11px]">
                                ↳ {toTitleCase(staff.name)}
                                {staff.designation && (
                                  <span className="ml-0.5 sm:ml-1 text-[9px] sm:text-[10px] font-mono text-muted-foreground font-normal not-italic">
                                    ({staff.designation})
                                  </span>
                                )}
                              </span>
                            </td>

                            <td className="p-1 sm:p-2 align-top text-center w-12 sm:w-16 sticky left-[120px] sm:left-[176px] z-10 bg-neutral-100/95 dark:bg-neutral-950/95 border-r-0">
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
                                  className={`p-1 align-top text-center w-14 min-w-[56px] border-r border-border/20 text-[10px] text-muted-foreground/80 ${
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
                    <FolderPlus className="h-5 w-5 text-primary" />
                    <p className="text-xs font-bold text-foreground">No Projects Configured</p>
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
