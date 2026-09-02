import { Fragment, useEffect, useState, type Ref } from "react"
import { Users, Search, Plus, SlidersHorizontal, Edit2, Trash2, Ban, Check, CheckCircle2, AlertCircle, X, ChevronDown } from "lucide-react"
import { toTitleCase } from "@/lib/string-utils"
import { RoleBadge } from "@/components/ui/role-badge"
import { db } from "@/db/schema"
import { useAddStaff } from "@/hooks/use-add-staff"
import { useStaffTableState } from "@/hooks/use-staff-table-state"
import { ConfigureCapacityDialog } from "./configure-capacity-dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { cn } from "@/lib/utils"
import type { Staff, Assignment, Project, Designation, RoleType } from "@/types/sam"

const topAlignedCellStyle = { verticalAlign: "top" } as const
const STAFF_DIRECTORY_COLLAPSED_KEY = "sam_staff_directory_collapsed"
const ROLE_OPTIONS: { value: RoleType; label: string }[] = [
  { value: "PL", label: "Project Lead" },
  { value: "M", label: "Member" },
  { value: "A", label: "Assisting" },
]
const ROLE_ORDER: Record<RoleType, number> = { PL: 0, M: 1, A: 2 }

interface StaffEditDraft {
  name: string
  designation: string
  fte: number
}

interface StaffDirectorySectionProps {
  staffList: Staff[]
  projectList: Project[]
  assignmentList: Assignment[]
  designationList?: Designation[]
  scrollRef?: Ref<HTMLDivElement>
  onScroll?: () => void
}

export function StaffDirectorySection({
  staffList,
  projectList,
  assignmentList,
  designationList = [],
  scrollRef,
  onScroll,
}: StaffDirectorySectionProps) {
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<StaffEditDraft | null>(null)
  const [showInactiveStaff, setShowInactiveStaff] = useState(false)
  const [staffPendingDeletion, setStaffPendingDeletion] = useState<Staff | null>(null)
  const [isDeletingStaff, setIsDeletingStaff] = useState(false)
  const [isDirectoryCollapsed, setIsDirectoryCollapsed] = useState(
    () => localStorage.getItem(STAFF_DIRECTORY_COLLAPSED_KEY) === "true"
  )
  const {
    name,
    designation,
    fte,
    error,
    isFormValid,
    isSubmitting,
    setName,
    setDesignation,
    setFte,
    addStaff,
  } = useAddStaff(staffList)

  const {
    staffSearch,
    setStaffSearch,
    filteredStaff,
    selectedCapacityStaff,
    setSelectedCapacityStaff,
    handleToggleActive,
  } = useStaffTableState(staffList, designationList, setDesignation)

  const displayedStaff = filteredStaff.toSorted(
    (a, b) => Number(b.isActive ?? true) - Number(a.isActive ?? true)
  )
  const inactiveStaff = displayedStaff.filter((staff) => !(staff.isActive ?? true))
  const visibleStaff = showInactiveStaff
    ? displayedStaff
    : displayedStaff.filter((staff) => staff.isActive ?? true)

  useEffect(() => {
    localStorage.setItem(STAFF_DIRECTORY_COLLAPSED_KEY, String(isDirectoryCollapsed))
  }, [isDirectoryCollapsed])

  useEffect(() => {
    const expandForTour = (event: Event) => {
      if ((event as CustomEvent<string>).detail === "#sam-add-staff") setIsDirectoryCollapsed(false)
    }
    window.addEventListener("sam:tour-target", expandForTour)
    return () => window.removeEventListener("sam:tour-target", expandForTour)
  }, [])

  const startEditing = (staff: Staff) => {
    setEditingStaffId(staff.id)
    setEditDraft({
      name: staff.name,
      designation: staff.designation,
      fte: staff.fte ?? 1,
    })
  }

  const cancelEditing = () => {
    setEditingStaffId(null)
    setEditDraft(null)
  }

  const saveStaff = async (staffId: number) => {
    if (!editDraft || !editDraft.name.trim() || editDraft.fte < 0 || editDraft.fte > 1) return

    await db.staff.update(staffId, {
      name: editDraft.name.trim(),
      designation: editDraft.designation,
      fte: editDraft.fte,
    })
    cancelEditing()
  }

  const assignProject = async (staffId: number, projectId: number) => {
    if (!projectId || assignmentList.some((assignment) => assignment.staffId === staffId && assignment.projectId === projectId)) {
      return
    }

    const nextAssignmentId = assignmentList.reduce(
      (maxId, assignment) => Math.max(maxId, Number(assignment.id) || 0),
      0
    ) + 1
    await db.assignments.add({ id: nextAssignmentId, staffId, projectId, role: "M" })
  }

  const updateAssignmentRole = async (assignmentId: number, role: RoleType) => {
    await db.assignments.update(assignmentId, { role })
  }

  const removeAssignment = async (assignment: Assignment) => {
    await db.transaction("rw", [db.assignments, db.allocations], async () => {
      await db.allocations.where("assignmentId").equals(assignment.id).delete()
      await db.assignments.delete(assignment.id)
    })
  }

  const deleteInactiveStaff = async (staff: Staff) => {
    if (staff.isActive ?? true) return

    const staffAssignments = assignmentList.filter((assignment) => assignment.staffId === staff.id)
    const assignmentIds = staffAssignments.map((assignment) => assignment.id)

    await db.transaction("rw", [db.staff, db.assignments, db.allocations], async () => {
      if (assignmentIds.length > 0) {
        await db.allocations.where("assignmentId").anyOf(assignmentIds).delete()
      }
      await db.assignments.where("staffId").equals(staff.id).delete()
      await db.staff.delete(staff.id)
    })
  }

  const confirmDeleteStaff = async () => {
    if (!staffPendingDeletion) return
    setIsDeletingStaff(true)
    try {
      await deleteInactiveStaff(staffPendingDeletion)
      setStaffPendingDeletion(null)
    } finally {
      setIsDeletingStaff(false)
    }
  }

  return (
    <>
      <section className="rounded-3xl border border-neutral-300 dark:border-neutral-700/80 bg-card/75 dark:bg-card/60 text-card-foreground shadow-xs overflow-hidden transition-all duration-300">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-3 border-b border-border/60 bg-muted/40">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary shrink-0" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Staff Members Directory
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Manage personnel details, staff position designations, and active state
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter staff..."
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                className="h-8 pl-8 pr-3 rounded-xl text-xs text-foreground placeholder:text-foreground/55 bg-background border border-input focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-48"
              />
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-bold border border-primary/20 shadow-2xs shrink-0">
              {staffList.length} Members
            </span>
            <button
              type="button"
              onClick={() => setIsDirectoryCollapsed((collapsed) => !collapsed)}
              aria-expanded={!isDirectoryCollapsed}
              aria-label={isDirectoryCollapsed ? "Expand staff directory" : "Collapse staff directory"}
              title={isDirectoryCollapsed ? "Expand directory" : "Collapse directory"}
              className="inline-flex size-7 items-center justify-center rounded-xl border border-border/60 bg-muted text-muted-foreground shadow-2xs transition-all hover:bg-muted/80 hover:text-foreground cursor-pointer shrink-0"
            >
              <ChevronDown className={`size-4 text-primary transition-transform ${isDirectoryCollapsed ? "-rotate-90" : ""}`} />
            </button>
          </div>
        </div>

        {!isDirectoryCollapsed && (
          <>
        {/* Add Staff Quick Form Row */}
        <div className="p-3.5 bg-muted/20 border-b border-border/60 flex flex-col gap-2">
          <form
            id="sam-add-staff"
            onSubmit={addStaff}
            className="flex flex-wrap sm:flex-nowrap items-center gap-2.5"
          >
            <input
              type="text"
              placeholder="New Staff Name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cn(
                "flex-1 min-w-[140px] h-9 px-3.5 rounded-xl text-xs text-foreground placeholder:text-foreground/55 bg-background border font-medium transition-colors focus:outline-none focus:ring-1",
                error
                  ? "border-rose-500/60 focus:ring-rose-500"
                  : "border-input focus:ring-primary"
              )}
            />

            {/* Dynamic Designations Select */}
            <select
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="h-9 px-3 rounded-xl text-xs text-foreground bg-background border border-input focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            >
              {designationList.map((d) => (
                <option key={d.id || d.code} value={d.code}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>

            {/* FTE is reference metadata; allocation percentages remain a person's own 100% workload. */}
            <div className="flex items-center gap-1.5 mr-2">
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={fte}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  setFte(isNaN(val) ? 0 : val)
                }}
                className="w-16 h-9 px-2 text-center rounded-xl text-xs text-foreground bg-background border border-input focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              />
              <span title="Reference only — 100% allocation is this person's full workload." className="text-xs font-semibold text-muted-foreground select-none cursor-help">
                FTE
              </span>
            </div>

            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-xs cursor-pointer transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-3.5 w-3.5" /> Add Staff
            </button>
          </form>

          {/* Error Feedback Banner */}
          {error && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl animate-in fade-in-50 duration-150">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}
        </div>

        {/* Responsive Compact Staff Table */}
        <div ref={scrollRef} onScroll={onScroll} className="overflow-x-auto w-full">
          <table className="staff-directory-table w-full text-left border-collapse text-xs min-w-[580px] sm:min-w-full">
            <thead>
              <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground font-semibold text-[11px]">
                <th className="py-2.5 px-3 sm:px-4 w-20 align-top">Status</th>
                <th className="py-2.5 px-2 w-24 sm:w-28 align-top">Name</th>
                <th className="py-2.5 px-2 w-20 sm:w-24 text-center align-top">Designation</th>
                <th className="py-2.5 px-2 w-10 text-center align-top">FTE</th>
                <th className="py-2.5 px-2 w-auto min-w-[240px] align-top">Assigned Projects</th>
                <th className="py-2.5 px-3 sm:px-4 w-20 text-right align-top">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium [&>tr>td]:!align-top">
              {visibleStaff.map((s) => {
                const assignments = assignmentList.filter((a) => a.staffId === s.id)
                const orderedAssignments = assignments.toSorted(
                  (a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role]
                )
                const isActive = s.isActive ?? true
                const isEditing = isActive && editingStaffId === s.id
                const isFirstInactiveStaff = !isActive && s.id === inactiveStaff[0]?.id
                const unassignedProjects = projectList.filter(
                  (project) => !assignments.some((assignment) => assignment.projectId === project.id)
                )

                return (
                  <Fragment key={s.id}>
                    {isFirstInactiveStaff && (
                      <tr key="inactive-staff-toggle" className="bg-muted/30">
                        <td colSpan={6} className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => setShowInactiveStaff(false)}
                            className="flex w-full items-center gap-2 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                            aria-expanded="true"
                          >
                            <ChevronDown className="size-3 transition-transform" />
                            Inactive staff ({inactiveStaff.length})
                          </button>
                        </td>
                      </tr>
                    )}
                  <tr
                    key={s.id}
                    className={cn(
                      "transition-colors hover:[&>td]:bg-muted/40",
                      !isActive && "opacity-60 bg-muted/10"
                    )}
                  >
                    {/* Status Badge */}
                    <td className="py-2.5 px-3 sm:px-4 w-20 align-top" style={topAlignedCellStyle}>
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Inactive
                        </span>
                      )}
                    </td>

                    {/* Name */}
                    <td className={cn("py-2.5 px-2 w-24 sm:w-28 text-xs leading-snug align-top whitespace-normal break-words", !isActive && "pointer-events-none")} style={topAlignedCellStyle}>
                      {isEditing ? (
                        <input
                          value={editDraft?.name ?? ""}
                          onChange={(event) => setEditDraft((draft) => draft ? { ...draft, name: event.target.value } : draft)}
                          className="h-7 w-full rounded-lg border border-input bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      ) : (
                        <span className="font-bold text-foreground">{toTitleCase(s.name)}</span>
                      )}
                    </td>

                    {/* Designation Code Badge */}
                    <td className={cn("py-2.5 px-2 w-20 sm:w-24 text-center align-top", !isActive && "pointer-events-none")} style={topAlignedCellStyle}>
                      {isEditing ? (
                        <select
                          value={editDraft?.designation ?? ""}
                          onChange={(event) => setEditDraft((draft) => draft ? { ...draft, designation: event.target.value } : draft)}
                          className="h-7 w-full rounded-lg border border-input bg-background px-1 text-[10px] font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          {designationList.map((item) => (
                            <option key={item.id ?? item.code} value={item.code}>{item.code}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono bg-muted/60 text-muted-foreground border border-border/50">
                          {s.designation}
                        </span>
                      )}
                    </td>

                    {/* FTE */}
                    <td className={cn("py-2.5 px-2 w-10 text-center text-foreground align-top", !isActive && "pointer-events-none")} style={topAlignedCellStyle}>
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          max={1}
                          step={0.05}
                          value={editDraft?.fte ?? 1}
                          onChange={(event) => setEditDraft((draft) => draft ? { ...draft, fte: Number(event.target.value) || 0 } : draft)}
                          className="h-7 w-12 rounded-lg border border-input bg-background px-1 text-center text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      ) : (
                        <span className="font-medium">{s.fte ?? 1}</span>
                      )}
                    </td>

                    {/* Assigned Projects */}
                    <td className={cn("py-2 px-2 align-top", !isActive && "pointer-events-none")} style={topAlignedCellStyle}>
                      <div className="flex flex-col md:flex-row md:flex-wrap gap-1.5 items-start">
                        {assignments.length > 0 ? (
                          orderedAssignments.map((a) => {
                            const proj = projectList.find((p) => p.id === a.projectId)
                            if (!proj) return null
                            return isEditing ? (
                              <div
                                key={a.id}
                                className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-background px-2 py-0.5 text-[11px] font-medium shadow-2xs whitespace-nowrap"
                              >
                                {toTitleCase(proj.name)}
                                <select
                                  value={a.role}
                                  onChange={(event) => void updateAssignmentRole(a.id, event.target.value as RoleType)}
                                  className="h-5 rounded border border-input bg-background px-1 text-[9px] font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                  aria-label={`Role on ${toTitleCase(proj.name)}`}
                                >
                                  {ROLE_OPTIONS.map((roleOption) => (
                                    <option key={roleOption.value} value={roleOption.value}>{roleOption.value}</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => void removeAssignment(a)}
                                  className="rounded text-muted-foreground transition-colors hover:text-rose-500 cursor-pointer"
                                  aria-label={`Remove ${toTitleCase(proj.name)} assignment`}
                                >
                                  <X className="size-3" />
                                </button>
                              </div>
                            ) : (
                              <span
                                key={a.id}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-background border border-border/80 shadow-2xs whitespace-nowrap"
                              >
                                {toTitleCase(proj.name)}
                                <RoleBadge role={a.role} isSubRow />
                              </span>
                            )
                          })
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">
                            No projects assigned
                          </span>
                        )}
                        {isEditing && unassignedProjects.length > 0 && (
                          <select
                            value=""
                            onChange={(event) => void assignProject(s.id, Number(event.target.value))}
                            className="h-6 rounded-md border border-dashed border-input bg-background px-2 text-[10px] font-semibold text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="">Assign project…</option>
                            {unassignedProjects.map((project) => (
                              <option key={project.id} value={project.id}>{toTitleCase(project.name)}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-2.5 px-2 sm:px-3 w-20 text-right align-top" style={topAlignedCellStyle}>
                      <div className="flex items-center justify-end gap-0">
                        {/* Configure Capacity Button */}
                        <div className="relative group">
                          <button
                            type="button"
                            title="Configure Capacity"
                            aria-label="Configure Capacity"
                            onClick={() => setSelectedCapacityStaff(s)}
                            disabled={!isActive || isEditing}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-35"
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                          </button>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-30 pointer-events-none whitespace-nowrap rounded-md bg-neutral-900 dark:bg-neutral-100 px-2 py-1 text-[10px] font-semibold text-neutral-100 dark:text-neutral-900 shadow-md">
                            Configure Capacity
                          </div>
                        </div>

                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              title="Save changes"
                              aria-label="Save changes"
                              onClick={() => void saveStaff(s.id)}
                              className="p-1 rounded-md text-emerald-600 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Cancel editing"
                              aria-label="Cancel editing"
                              onClick={cancelEditing}
                              className="p-1 rounded-md text-muted-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <div className="relative group">
                            <button
                              type="button"
                              title="Edit Staff Member"
                              aria-label="Edit Staff Member"
                              onClick={() => startEditing(s)}
                              disabled={!isActive}
                              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-35"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-30 pointer-events-none whitespace-nowrap rounded-md bg-neutral-900 dark:bg-neutral-100 px-2 py-1 text-[10px] font-semibold text-neutral-100 dark:text-neutral-900 shadow-md">
                              Edit Staff
                            </div>
                          </div>
                        )}

                        {/* Delete Staff Button */}
                        <div className="relative group">
                          <button
                            type="button"
                            title="Delete Staff Member"
                            aria-label="Delete Staff Member"
                            onClick={() => setStaffPendingDeletion(s)}
                            disabled={isActive}
                            className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-35"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-30 pointer-events-none whitespace-nowrap rounded-md bg-neutral-900 dark:bg-neutral-100 px-2 py-1 text-[10px] font-semibold text-neutral-100 dark:text-neutral-900 shadow-md">
                            Delete Staff
                          </div>
                        </div>

                        {/* Deactivate / Reactivate Button */}
                        <div className="relative group">
                          <button
                            type="button"
                            title={isActive ? "Archive Staff Member" : "Restore Staff Member"}
                            aria-label={isActive ? "Archive Staff Member" : "Restore Staff Member"}
                            onClick={() => {
                              if (isEditing) cancelEditing()
                              void handleToggleActive(s)
                            }}
                            className={cn(
                              "p-1 rounded-md transition-colors cursor-pointer",
                              isActive
                                ? "text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                                : "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                            )}
                          >
                            {isActive ? (
                              <Ban className="h-3.5 w-3.5" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-30 pointer-events-none whitespace-nowrap rounded-md bg-neutral-900 dark:bg-neutral-100 px-2 py-1 text-[10px] font-semibold text-neutral-100 dark:text-neutral-900 shadow-md">
                            {isActive ? "Archive Staff" : "Restore Staff"}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                  </Fragment>
                )
              })}
              {visibleStaff.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="mx-auto flex max-w-xs flex-col items-center gap-2.5 text-muted-foreground">
                      <div className="flex size-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                        <Users className="size-4" />
                      </div>
                      <p className="text-xs font-bold text-foreground">
                        {staffList.length === 0 ? "No staff members yet" : "No staff members found"}
                      </p>
                      <p className="text-[11px] leading-relaxed">
                        {staffList.length === 0
                          ? "Add your first team member using the form above."
                          : "Try a different search, or show inactive staff."}
                      </p>
                      {staffList.length > 0 && inactiveStaff.length > 0 && !showInactiveStaff && (
                        <button
                          type="button"
                          onClick={() => setShowInactiveStaff(true)}
                          className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                        >
                          Show inactive staff
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
              {inactiveStaff.length > 0 && !showInactiveStaff && visibleStaff.length > 0 && (
                <tr className="bg-muted/30">
                  <td colSpan={6} className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setShowInactiveStaff(true)}
                      className="flex w-full items-center gap-2 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                      aria-expanded="false"
                    >
                      <ChevronDown className="size-3 -rotate-90 transition-transform" />
                      Inactive staff ({inactiveStaff.length})
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
          </>
        )}
      </section>

      {/* Configure Capacity Modal */}
      <ConfigureCapacityDialog
        open={!!selectedCapacityStaff}
        staff={selectedCapacityStaff}
        assignmentList={assignmentList}
        projectList={projectList}
        onClose={() => setSelectedCapacityStaff(null)}
      />
      <ConfirmDialog
        open={!!staffPendingDeletion}
        title="Delete staff member?"
        description={`This permanently deletes ${staffPendingDeletion ? toTitleCase(staffPendingDeletion.name) : "this staff member"}, along with their assignments and capacity allocations. This cannot be undone.`}
        confirmLabel="Delete Staff"
        isDestructive
        isLoading={isDeletingStaff}
        onConfirm={() => void confirmDeleteStaff()}
        onCancel={() => setStaffPendingDeletion(null)}
      />
    </>
  )
}
