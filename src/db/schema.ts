// src/db/schema.ts
import Dexie, { type Table } from "dexie"
import seedData from "./seed.json"
import type { Staff, Project, Assignment, Allocation, Designation, EntityId, WorkspaceId } from "@/types/sam"

export const LOCAL_WORKSPACE_ID: WorkspaceId = "local-default"

export interface ExportFolderSetting {
  id: "default"
  handle: FileSystemDirectoryHandle
  name: string
}

export class SamDatabase extends Dexie {
  staff!: Table<Staff, EntityId>
  projects!: Table<Project, EntityId>
  assignments!: Table<Assignment, EntityId>
  allocations!: Table<Allocation, EntityId>
  designations!: Table<Designation, EntityId>
  exportSettings!: Table<ExportFolderSetting, "default">

  constructor() {
    super("SamDatabase")

    this.version(2).stores({
      staff: "id, name, designation, isActive",
      projects: "id, name, isActive",
      assignments: "id, staffId, projectId, role",
      allocations: "id, assignmentId, staffId, projectId, month",
      designations: "++id, &code, name",
    })

    // Add tenant and audit metadata without invalidating existing offline data.
    this.version(3).stores({
      staff: "id, workspaceId, name, designation, designationId, isActive",
      projects: "id, workspaceId, name, isActive",
      assignments: "id, workspaceId, staffId, projectId, [workspaceId+staffId], [workspaceId+projectId]",
      allocations: "id, workspaceId, assignmentId, month, [workspaceId+assignmentId+month]",
      designations: "++id, workspaceId, [workspaceId+code], name",
    }).upgrade(async (tx) => {
      const now = new Date().toISOString()
      await Promise.all([
        tx.table("staff").toCollection().modify({ workspaceId: LOCAL_WORKSPACE_ID, createdAt: now, updatedAt: now }),
        tx.table("projects").toCollection().modify({ workspaceId: LOCAL_WORKSPACE_ID, createdAt: now, updatedAt: now }),
        tx.table("assignments").toCollection().modify({ workspaceId: LOCAL_WORKSPACE_ID, createdAt: now, updatedAt: now }),
        tx.table("allocations").toCollection().modify({ workspaceId: LOCAL_WORKSPACE_ID, createdAt: now, updatedAt: now }),
        tx.table("designations").toCollection().modify({ workspaceId: LOCAL_WORKSPACE_ID }),
      ])
    })

    this.version(4).stores({
      staff: "id, workspaceId, name, designation, designationId, isActive",
      projects: "id, workspaceId, name, isActive",
      assignments: "id, workspaceId, staffId, projectId, [workspaceId+staffId], [workspaceId+projectId]",
      allocations: "id, workspaceId, assignmentId, month, [workspaceId+assignmentId+month]",
      designations: "++id, workspaceId, [workspaceId+code], name",
      exportSettings: "id",
    })
  }
}

export const db = new SamDatabase()

export async function initializeDatabase() {
  const staffCount = await db.staff.count()
  const designationCount = await db.designations.count()

  // Preserve existing installations while letting first-run onboarding own sample-data seeding.
  if (staffCount > 0 && designationCount === 0 && seedData.designations) {
    await db.designations.bulkAdd(seedData.designations.map((item) => ({ ...item, workspaceId: LOCAL_WORKSPACE_ID })))
  }
}
