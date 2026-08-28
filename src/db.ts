import Dexie, { type Table } from "dexie";

export interface Staff {
  id?: number;
  name: string;
  designation: string;
  fte: number;
  monthlyCapacity?: Record<string, number>;
}

export interface Project {
  id?: number;
  name: string;
  startMonth?: string;
  endMonth?: string;
}

export interface Assignment {
  id?: number;
  staffId: number;
  projectId: number;
  role: string;
}

export interface RoleCategory {
  id?: number;
  code: string;
  name: string;
}

export class AllocationDatabase extends Dexie {
  staff!: Table<Staff, number>;
  projects!: Table<Project, number>;
  assignments!: Table<Assignment, number>;
  roles!: Table<RoleCategory, number>;

  constructor() {
    super("StaffAllocationDB");
    this.version(2).stores({
      staff: "++id, name, designation",
      projects: "++id, name",
      assignments: "++id, staffId, projectId, role, [staffId+projectId]",
      roles: "++id, code, name",
    });
  }
}

export const db = new AllocationDatabase();
