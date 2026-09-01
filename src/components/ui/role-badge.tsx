import type { ReactNode } from "react"

export type RoleType = "PL" | "M" | "A" | string

export function getRoleBadgeClass(role: RoleType, isSubRow = false): string {
  const scale = isSubRow ? "scale-90 opacity-90" : ""
  switch (role) {
    case "PL":
      return `bg-amber-400 dark:bg-amber-500 text-amber-950 font-black ${scale}`
    case "M":
      return `bg-emerald-500 text-white font-extrabold ${scale}`
    case "A":
      return `bg-sky-500 dark:bg-sky-600 text-white font-extrabold ${scale}`
    default:
      return `bg-muted text-muted-foreground font-semibold ${scale}`
  }
}

export function RoleBadge({
  role,
  label,
  isSubRow = false,
  className = "",
}: {
  role: RoleType
  label?: ReactNode
  isSubRow?: boolean
  className?: string
}) {
  const getCleanLabel = (): ReactNode => {
    if (!label) {
      if (role === "PL") return "Project Lead"
      if (role === "M") return "Member"
      if (role === "A") return "Assisting"
      return null
    }

    // If label is string and starts with the role prefix (e.g. "PL Project Lead"), strip "PL "
    if (typeof label === "string") {
      const trimmed = label.trim()
      if (trimmed.startsWith(`${role} `)) {
        return trimmed.slice(role.length + 1)
      }
      if (trimmed === role) {
        return null
      }
    }

    return label
  }

  const cleanLabel = getCleanLabel()

  if (isSubRow) {
    return (
      <span
        className={`inline-block px-1.5 py-0.2 rounded text-[9px] shadow-2xs ${getRoleBadgeClass(
          role,
          true
        )} ${className}`}
      >
        {role}
      </span>
    )
  }

  return (
    <span
      className={`h-8 px-3 inline-flex items-center justify-center rounded-xl text-xs font-bold shadow-2xs ${getRoleBadgeClass(
        role,
        false
      )} ${className}`}
    >
      <span>{role}</span>
      {cleanLabel && (
        <span className="hidden sm:inline font-normal ml-1">{cleanLabel}</span>
      )}
    </span>
  )
}