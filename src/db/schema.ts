// src/db/schema.ts
import Dexie, { type Table } from "dexie"
import seedData from "./seed.json"
import type { Staff, Project, Assignment, Allocation } from "@/types/sam"

export interface Designation {
  id?: number
  code: string
  name: string
}

export class SamDatabase extends Dexie {
  staff!: Table<Staff, number>
  projects!: Table<Project, number>
  assignments!: Table<Assignment, number>
  allocations!: Table<Allocation, number>
  designations!: Table<Designation, number>

  constructor() {
    super("SamDatabase")

    this.version(2).stores({
      staff: "id, name, designation, isActive",
      projects: "id, name, isActive",
      assignments: "id, staffId, projectId, role",
      allocations: "id, assignmentId, staffId, projectId, month",
      designations: "++id, &code, name",
    })
  }
}

export const db = new SamDatabase()

export async function initializeDatabase() {
  const staffCount = await db.staff.count()
  const designationCount = await db.designations.count()

  // Preserve existing installations while letting first-run onboarding own sample-data seeding.
  if (staffCount > 0 && designationCount === 0 && seedData.designations) {
    await db.designations.bulkAdd(seedData.designations)
  }
}
