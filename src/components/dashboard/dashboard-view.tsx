import { useMemo, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/db/schema"
import { StaffCapacityMatrix } from "@/components/dashboard/staff-capacity-matrix"
import { ProjectTimelineMatrix } from "@/components/dashboard/project-timeline-matrix"
import { TimelineFilterBar } from "@/components/controls/timeline-filter-bar"
import { useSyncScroll } from "@/hooks/use-sync-scroll"
import { RoleBadge } from "@/components/ui/role-badge"
import { getCapacityWarnings } from "@/lib/workspace-validation"

export function DashboardView() {
  const staffList = useLiveQuery(() => db.staff.toArray(), []) ?? []
  const projectList = useLiveQuery(() => db.projects.toArray(), []) ?? []
  const assignmentList = useLiveQuery(() => db.assignments.toArray(), []) ?? []
  const allocationList = useLiveQuery(() => db.allocations.toArray(), []) ?? []
  const [timeline, setTimeline] = useState({
    preset: 12,
    startMonth: "2026-08",
    endMonth: "2027-07",
  })

  const { register, handleScroll } = useSyncScroll()
  const activeStaff = useMemo(() => staffList.filter((staff) => staff.isActive ?? true), [staffList])
  const activeProjects = useMemo(() => projectList.filter((project) => project.isActive ?? true), [projectList])
  const activeStaffIds = useMemo(() => new Set(activeStaff.map((staff) => staff.id)), [activeStaff])
  const activeProjectIds = useMemo(() => new Set(activeProjects.map((project) => project.id)), [activeProjects])
  const activeAssignments = useMemo(
    () => assignmentList.filter((assignment) => activeStaffIds.has(assignment.staffId) && activeProjectIds.has(assignment.projectId)),
    [assignmentList, activeStaffIds, activeProjectIds]
  )
  const activeAssignmentIds = useMemo(() => new Set(activeAssignments.map((assignment) => assignment.id)), [activeAssignments])
  const activeAllocations = useMemo(() => allocationList.filter((allocation) => activeAssignmentIds.has(allocation.assignmentId)), [allocationList, activeAssignmentIds])
  const capacityWarnings = useMemo(() => getCapacityWarnings(activeAllocations), [activeAllocations])

  return (
    <div className="flex flex-col gap-4 w-full animate-in fade-in-50 duration-300">
      {/* Role Legend & Timeline Filter on the same row with smaller font size for legend */}
      <div className="flex items-center justify-between px-1 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <RoleBadge role="PL" label="PL Project Lead" className="text-[10px] h-7 px-2.5" />
          <RoleBadge role="M" label="M Member" className="text-[10px] h-7 px-2.5" />
          <RoleBadge role="A" label="A Assisting" className="text-[10px] h-7 px-2.5" />
        </div>

        <TimelineFilterBar
          preset={timeline.preset}
          startMonth={timeline.startMonth}
          endMonth={timeline.endMonth}
          onTimelineChange={setTimeline}
        />
      </div>

      {capacityWarnings.length > 0 && (
        <div className="mx-1 flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-foreground">
          <AlertTriangle className="size-4 shrink-0 text-amber-600" />
          <span><strong>{capacityWarnings.length} workload warning{capacityWarnings.length === 1 ? "" : "s"}:</strong> allocations exceed 100% for a staff member in a month. Adjust capacity in Manage Data.</span>
        </div>
      )}

      {/* Synchronized Matrices */}
      <StaffCapacityMatrix
        staffList={activeStaff}
        projectList={activeProjects}
        assignmentList={activeAssignments}
        allocationList={activeAllocations}
        startMonth={timeline.startMonth}
        endMonth={timeline.endMonth}
        scrollRef={register(0)}
        onScroll={() => handleScroll(0)}
      />

      <ProjectTimelineMatrix
        staffList={activeStaff}
        projectList={activeProjects}
        assignmentList={activeAssignments}
        allocationList={activeAllocations}
        startMonth={timeline.startMonth}
        endMonth={timeline.endMonth}
        scrollRef={register(1)}
        onScroll={() => handleScroll(1)}
      />
    </div>
  )
}
