import Dexie from "dexie";
import type { Table } from "dexie";

export interface Staff {
  id?: number;
  name: string;
  designation: string;
  fte: number;
  capacity?: number;
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
  role: "PL" | "M" | "A";
}

export interface RoleCategory {
  id?: number;
  name: string;
}

export class AllocationDatabase extends Dexie {
  staff!: Table<Staff>;
  projects!: Table<Project>;
  assignments!: Table<Assignment>;
  roles!: Table<RoleCategory>;

  constructor() {
    super("StaffAllocationDB");
    this.version(2).stores({
      staff: "++id, name, designation",
      projects: "++id, name",
      assignments: "++id, staffId, projectId, role",
      roles: "++id, &name",
    });

    this.on("populate", () => {
      this.roles.bulkAdd([
        { name: "RA" },
        { name: "SRA" },
        { name: "ADE" },
        { name: "DOR" },
      ]);
    });
  }
}

export const db = new AllocationDatabase();
