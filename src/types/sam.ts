/**
 * Domain contracts deliberately contain no Dexie or Convex types. `EntityId`
 * remains numeric while the installed local database is migrated; a remote
 * adapter maps Convex's opaque IDs through `RemoteEntityId` at its boundary.
 */
export type EntityId = number
export type RemoteEntityId = string
export type WorkspaceId = string
export type YearMonth = string
export type RoleType = "PL" | "M" | "A"
export type EntityStatus = "active" | "inactive"

export interface EntityMeta {
  id: EntityId
  workspaceId?: WorkspaceId
  createdAt?: string
  updatedAt?: string
}

export interface Staff extends EntityMeta {
  name: string
  designation: string
  fte: number
  isActive: boolean
  /** Future normalized relation. `designation` remains for imported legacy data. */
  designationId?: EntityId
}

export interface Project extends EntityMeta {
  name: string
  startMonth: string
  endMonth: string
  isActive: boolean
}

export interface Assignment extends EntityMeta {
  staffId: EntityId
  projectId: EntityId
  role: RoleType
}

export interface Allocation extends EntityMeta {
  assignmentId: EntityId
  /** Denormalized legacy query fields. New writes must derive these from assignment. */
  staffId: EntityId
  projectId: EntityId
  month: YearMonth
  percentage: number
}

export interface MonthHeader {
  key: string       // YYYY-MM
  year: number
  monthLabel: string // 'JAN', 'FEB', etc.
}

// src/types/sam.ts

export interface Designation {
  id?: EntityId
  workspaceId?: WorkspaceId
  code: string
  name: string
}
