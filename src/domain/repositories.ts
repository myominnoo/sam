import type { Allocation, Assignment, Designation, EntityId, Project, Staff, WorkspaceId } from "@/types/sam"

export interface SamRepository {
  readonly workspaceId: WorkspaceId
  listStaff(): Promise<Staff[]>
  listProjects(): Promise<Project[]>
  listAssignments(): Promise<Assignment[]>
  listAllocations(): Promise<Allocation[]>
  listDesignations(): Promise<Designation[]>
  saveStaff(staff: Staff): Promise<void>
  saveProject(project: Project): Promise<void>
  saveAssignment(assignment: Assignment): Promise<void>
  saveAllocations(allocations: Allocation[]): Promise<void>
  removeAssignment(id: EntityId): Promise<void>
}
