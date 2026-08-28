import Dexie, { type Table } from "dexie";

export interface DesignationCategory {
  id?: number;
  code: string;
  name: string;
}

export interface Staff {
  id?: number;
  name: string;
  designation: string;
  fte: number;
  isActive?: boolean;
  monthlyCapacity?: Record<string, number>;
}

export interface Project {
  id?: number;
  name: string;
  startMonth?: string;
  endMonth?: string;
  isActive?: boolean;
}

export interface Assignment {
  id?: number;
  staffId: number;
  projectId: number;
  role: "PL" | "M" | "A";
}

export class StaffAllocationDatabase extends Dexie {
  staff!: Table<Staff, number>;
  projects!: Table<Project, number>;
  assignments!: Table<Assignment, number>;
  designations!: Table<DesignationCategory, number>;

  constructor() {
    super("StaffAllocationDB");

    this.version(4).stores({
      staff: "++id, name, designation, isActive",
      projects: "++id, name, isActive",
      assignments: "++id, staffId, projectId, role",
      designations: "++id, &code, name",
    });
  }
}

export const db = new StaffAllocationDatabase();
