import Dexie from "dexie";
import type { Table } from "dexie";

export interface Staff {
  id?: number;
  name: string;
  designation: string;
  fte: number;
  note?: string;
  capacity?: number;
}

export interface Project {
  id?: number;
  name: string;
  activeMonths?: string[];
}

export interface Assignment {
  id?: number;
  staffId: number;
  projectId: number;
  role: "PL" | "M" | "A";
}

export class AllocationDatabase extends Dexie {
  staff!: Table<Staff>;
  projects!: Table<Project>;
  assignments!: Table<Assignment>;

  constructor() {
    super("StaffAllocationDB");
    this.version(1).stores({
      staff: "++id, name, designation",
      projects: "++id, name",
      assignments: "++id, staffId, projectId, role",
    });
  }
}

export const db = new AllocationDatabase();
