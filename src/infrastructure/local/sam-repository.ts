import { db, LOCAL_WORKSPACE_ID } from "@/db/schema"
import type { SamRepository } from "@/domain/repositories"
import type { Allocation, Assignment, EntityId, Project, Staff } from "@/types/sam"

const scope = <T extends { workspaceId?: string }>(items: T[]) =>
  items.filter((item) => !item.workspaceId || item.workspaceId === LOCAL_WORKSPACE_ID)

/** Local-first adapter. Dexie is now a persistence implementation, not a UI API. */
export class LocalSamRepository implements SamRepository {
  readonly workspaceId = LOCAL_WORKSPACE_ID
  listStaff = async () => scope(await db.staff.toArray())
  listProjects = async () => scope(await db.projects.toArray())
  listAssignments = async () => scope(await db.assignments.toArray())
  listAllocations = async () => scope(await db.allocations.toArray())
  listDesignations = async () => scope(await db.designations.toArray())
  saveStaff = async (staff: Staff) => { await db.staff.put(this.withMeta(staff)) }
  saveProject = async (project: Project) => { await db.projects.put(this.withMeta(project)) }
  saveAssignment = async (assignment: Assignment) => { await db.assignments.put(this.withMeta(assignment)) }
  saveAllocations = async (allocations: Allocation[]) => { await db.allocations.bulkPut(allocations.map((item) => this.withMeta(item))) }
  async removeAssignment(id: EntityId) {
    await db.transaction("rw", [db.assignments, db.allocations], async () => {
      await db.allocations.where("assignmentId").equals(id).delete()
      await db.assignments.delete(id)
    })
  }
  private withMeta<T extends { workspaceId?: string; createdAt?: string; updatedAt?: string }>(entity: T): T {
    const now = new Date().toISOString()
    return { ...entity, workspaceId: entity.workspaceId ?? this.workspaceId, createdAt: entity.createdAt ?? now, updatedAt: now }
  }
}

export const localSamRepository = new LocalSamRepository()
