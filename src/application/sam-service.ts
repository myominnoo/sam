import type { SamRepository } from "@/domain/repositories"
import type { Allocation, Assignment, EntityId, YearMonth } from "@/types/sam"

/** Business rules shared by local and future Convex adapters. */
export class SamService {
  private readonly repository: SamRepository

  constructor(repository: SamRepository) {
    this.repository = repository
  }

  async assign(staffId: EntityId, projectId: EntityId, role: Assignment["role"] = "M") {
    const [staff, projects, assignments] = await Promise.all([
      this.repository.listStaff(), this.repository.listProjects(), this.repository.listAssignments(),
    ])
    if (!staff.some((item) => item.id === staffId) || !projects.some((item) => item.id === projectId)) {
      throw new Error("Staff member and project must exist in the current workspace.")
    }
    if (assignments.some((item) => item.staffId === staffId && item.projectId === projectId)) {
      throw new Error("This staff member is already assigned to the project.")
    }
    const id = Date.now()
    await this.repository.saveAssignment({ id, workspaceId: this.repository.workspaceId, staffId, projectId, role })
    return id
  }

  async setAllocation(assignmentId: EntityId, month: YearMonth, percentage: number) {
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 1) throw new Error("Allocation must be between 0 and 100%.")
    const [assignment, allocations] = await Promise.all([
      this.repository.listAssignments().then((items) => items.find((item) => item.id === assignmentId)),
      this.repository.listAllocations(),
    ])
    if (!assignment) throw new Error("Assignment not found in the current workspace.")
    const total = allocations.filter((item) => item.staffId === assignment.staffId && item.month === month && item.assignmentId !== assignmentId)
      .reduce((sum, item) => sum + item.percentage, 0) + percentage
    if (total > 1.0001) throw new Error("Staff capacity cannot exceed 100% for a month.")
    const current = allocations.find((item) => item.assignmentId === assignmentId && item.month === month)
    const allocation: Allocation = {
      id: current?.id ?? Date.now(), workspaceId: this.repository.workspaceId,
      assignmentId, staffId: assignment.staffId, projectId: assignment.projectId, month, percentage,
    }
    await this.repository.saveAllocations([allocation])
  }
}
