export type RoleType = "PL" | "M" | "A"

export interface Staff {
  id: number
  name: string
  designation: string
  fte: number
  isActive: boolean
}

export interface Project {
  id: number
  name: string
  startMonth: string
  endMonth: string
  isActive: boolean
}

export interface Assignment {
  id: number
  staffId: number
  projectId: number
  role: RoleType
}

export interface Allocation {
  id: number
  assignmentId: number
  staffId: number
  projectId: number
  month: string
  percentage: number
}

export interface MonthHeader {
  key: string       // YYYY-MM
  year: number
  monthLabel: string // 'JAN', 'FEB', etc.
}

// src/types/sam.ts

export interface Designation {
  id?: number
  code: string
  name: string
}