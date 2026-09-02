import type { Allocation, Assignment, Project, Staff } from "@/types/sam"

type WorkspaceData = {
  staff: Staff[]
  projects: Project[]
  assignments: Assignment[]
  allocations: Allocation[]
}

const isYearMonth = (value: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(value)

/** Validates relationships and workload rules before a workspace is persisted. */
export function validateWorkspaceData({ staff, projects, assignments, allocations }: WorkspaceData) {
  const staffIds = new Set(staff.map((item) => item.id))
  const projectIds = new Set(projects.map((item) => item.id))
  const assignmentIds = new Set<number>()
  const assignmentPairs = new Set<string>()

  for (const item of staff) {
    if (!item.name?.trim() || !Number.isFinite(item.fte) || item.fte < 0 || item.fte > 1) {
      throw new Error("Each staff record needs a name and an FTE between 0 and 1.")
    }
  }
  for (const item of projects) {
    if (!item.name?.trim() || !isYearMonth(item.startMonth) || !isYearMonth(item.endMonth) || item.startMonth > item.endMonth) {
      throw new Error("Each project needs a name and a valid start and end month.")
    }
  }
  for (const item of assignments) {
    if (assignmentIds.has(item.id)) throw new Error("Assignments must have unique IDs.")
    assignmentIds.add(item.id)
    if (!staffIds.has(item.staffId) || !projectIds.has(item.projectId)) {
      throw new Error("Every assignment must reference an existing staff member and project.")
    }
    const key = `${item.staffId}:${item.projectId}`
    if (assignmentPairs.has(key)) throw new Error("A staff member can only be assigned to a project once.")
    assignmentPairs.add(key)
  }

  const assignmentsById = new Map(assignments.map((item) => [item.id, item]))
  const allocationKeys = new Set<string>()
  const staffMonthTotals = new Map<string, number>()
  for (const item of allocations) {
    const assignment = assignmentsById.get(item.assignmentId)
    if (!assignment) throw new Error("Every allocation must reference an existing assignment.")
    if (item.staffId !== assignment.staffId || item.projectId !== assignment.projectId) {
      throw new Error("Allocation staff and project details must match its assignment.")
    }
    if (!isYearMonth(item.month) || !Number.isFinite(item.percentage) || item.percentage < 0 || item.percentage > 1) {
      throw new Error("Allocations need a valid month and a percentage between 0 and 100%.")
    }
    const project = projects.find((candidate) => candidate.id === assignment.projectId)
    if (!project || item.month < project.startMonth || item.month > project.endMonth) {
      throw new Error("Allocations must fall within the assigned project's timeline.")
    }
    const key = `${item.assignmentId}:${item.month}`
    if (allocationKeys.has(key)) throw new Error("An assignment can only have one allocation per month.")
    allocationKeys.add(key)
    const staffMonthKey = `${item.staffId}:${item.month}`
    const total = (staffMonthTotals.get(staffMonthKey) ?? 0) + item.percentage
    if (total > 1.0001) throw new Error(`Staff workload cannot exceed 100% in ${item.month}.`)
    staffMonthTotals.set(staffMonthKey, total)
  }
}

export function getCapacityWarnings(allocations: Allocation[]) {
  const totals = new Map<string, number>()
  for (const item of allocations) {
    const key = `${item.staffId}:${item.month}`
    totals.set(key, (totals.get(key) ?? 0) + item.percentage)
  }
  return [...totals].filter(([, total]) => total > 1.0001)
}
