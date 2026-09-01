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
  
  if (staffCount === 0) {
    await db.transaction("rw", [db.staff, db.projects, db.assignments, db.allocations, db.designations], async () => {
      await db.staff.bulkAdd(seedData.staff as Staff[])
      await db.projects.bulkAdd(seedData.projects as Project[])
      await db.assignments.bulkAdd(seedData.assignments as Assignment[])
      await db.allocations.bulkAdd(seedData.allocations as Allocation[])
      await db.designations.bulkAdd(seedData.designations)
    })
  } else {
    // If staff exists, check if designations specifically was missed during version migration
    const designationCount = await db.designations.count()
    if (designationCount === 0 && seedData.designations) {
      await db.designations.bulkAdd(seedData.designations)
    }
  }
}