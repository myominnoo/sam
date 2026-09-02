export type WorkspaceRole = "owner" | "admin" | "planner" | "viewer"

export const permissions = {
  read: ["owner", "admin", "planner", "viewer"],
  manageDirectory: ["owner", "admin"],
  planCapacity: ["owner", "admin", "planner"],
} as const satisfies Record<string, readonly WorkspaceRole[]>

export function can(role: WorkspaceRole, permission: keyof typeof permissions) {
  return (permissions[permission] as readonly WorkspaceRole[]).includes(role)
}
