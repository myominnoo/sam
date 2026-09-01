import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/db/schema"
import { StaffCapacityMatrix } from "@/components/dashboard/staff-capacity-matrix"
import { ProjectTimelineMatrix } from "@/components/dashboard/project-timeline-matrix"
import { TimelineFilterBar } from "@/components/controls/timeline-filter-bar"
import { useSyncScroll } from "@/hooks/use-sync-scroll"
import { RoleBadge } from "@/components/ui/role-badge"

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

      {/* Synchronized Matrices */}
      <StaffCapacityMatrix
        staffList={staffList}
        projectList={projectList}
        assignmentList={assignmentList}
        allocationList={allocationList}
        startMonth={timeline.startMonth}
        endMonth={timeline.endMonth}
        scrollRef={register(0)}
        onScroll={() => handleScroll(0)}
      />

      <ProjectTimelineMatrix
        staffList={staffList}
        projectList={projectList}
        assignmentList={assignmentList}
        allocationList={allocationList}
        startMonth={timeline.startMonth}
        endMonth={timeline.endMonth}
        scrollRef={register(1)}
        onScroll={() => handleScroll(1)}
      />
    </div>
  )
}
