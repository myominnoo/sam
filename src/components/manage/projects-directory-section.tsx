import { Fragment, useEffect, useState, type Ref } from "react"
import { FolderKanban, Search, Plus, Edit2, Trash2, Ban, Check, CheckCircle2, X, ChevronDown } from "lucide-react"
import { toTitleCase } from "@/lib/string-utils"
import { cn } from "@/lib/utils"
import { RoleBadge } from "@/components/ui/role-badge"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { db } from "@/db/schema"
import { calculateEndMonth, generateMonthRange, getCurrentYearMonth } from "@/lib/date-utils"
import type { Project, Staff, Assignment, RoleType } from "@/types/sam"

const TIMELINE_MONTHS = generateMonthRange("2025-01", 72)
const PROJECT_DIRECTORY_COLLAPSED_KEY = "sam_project_directory_collapsed"
const DEFAULT_NEW_PROJECT_START = getCurrentYearMonth()
const PRESET_OPTIONS = [3, 6, 12, 24, 36, 48] as const
const DEFAULT_NEW_PROJECT_END = calculateEndMonth(DEFAULT_NEW_PROJECT_START, 12)
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const ROLE_OPTIONS: { value: RoleType; label: string }[] = [
  { value: "PL", label: "Project Lead" },
  { value: "M", label: "Member" },
  { value: "A", label: "Assisting" },
]
const ROLE_ORDER: Record<RoleType, number> = { PL: 0, M: 1, A: 2 }

interface ProjectEditDraft {
  name: string
  startMonth: string
  endMonth: string
}

function formatMonth(month: string) {
  const [year, monthNumber] = month.split("-")
  const monthName = MONTH_NAMES[Number(monthNumber) - 1]
  return monthName && year ? `${monthName} ${year}` : "—"
}

interface ProjectsDirectorySectionProps {
  projectList: Project[]
  staffList: Staff[]
  assignmentList: Assignment[]
  scrollRef?: Ref<HTMLDivElement>
  onScroll?: () => void
}

export function ProjectsDirectorySection({
  projectList,
  staffList,
  assignmentList,
  scrollRef,
  onScroll,
}: ProjectsDirectorySectionProps) {
  const [projectSearch, setProjectSearch] = useState("")
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectStart, setNewProjectStart] = useState(DEFAULT_NEW_PROJECT_START)
  const [newProjectEnd, setNewProjectEnd] = useState(DEFAULT_NEW_PROJECT_END)
  const [newProjectPreset, setNewProjectPreset] = useState<number>(12)
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<ProjectEditDraft | null>(null)
  const [showInactiveProjects, setShowInactiveProjects] = useState(false)
  const [projectPendingDeletion, setProjectPendingDeletion] = useState<Project | null>(null)
  const [isDeletingProject, setIsDeletingProject] = useState(false)
  const [isDirectoryCollapsed, setIsDirectoryCollapsed] = useState(
    () => localStorage.getItem(PROJECT_DIRECTORY_COLLAPSED_KEY) === "true"
  )

  const normalizedNewProjectName = newProjectName.trim().toLocaleLowerCase()
  const isDuplicateProjectName = projectList.some(
    (project) => project.name.trim().toLocaleLowerCase() === normalizedNewProjectName
  )
  const canCreateProject = Boolean(
    normalizedNewProjectName && newProjectStart && newProjectEnd && !isDuplicateProjectName
  )

  const handleAddProject = async () => {
    if (!canCreateProject) return

    const nextProjectId = projectList.reduce(
      (maxId, project) => Math.max(maxId, Number(project.id) || 0),
      0
    ) + 1

    await db.projects.add({
      id: nextProjectId,
      name: newProjectName.trim(),
      startMonth: newProjectStart,
      endMonth: newProjectEnd,
      isActive: true,
    })

    setNewProjectName("")
    setNewProjectStart(DEFAULT_NEW_PROJECT_START)
    setNewProjectEnd(DEFAULT_NEW_PROJECT_END)
    setNewProjectPreset(12)
  }

  const filteredProjects = projectList.filter((p) =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase())
  )
  const displayedProjects = filteredProjects.toSorted(
    (a, b) => Number(b.isActive ?? true) - Number(a.isActive ?? true)
  )
  const inactiveProjects = displayedProjects.filter((project) => !(project.isActive ?? true))
  const visibleProjects = showInactiveProjects
    ? displayedProjects
    : displayedProjects.filter((project) => project.isActive ?? true)

  useEffect(() => {
    localStorage.setItem(PROJECT_DIRECTORY_COLLAPSED_KEY, String(isDirectoryCollapsed))
  }, [isDirectoryCollapsed])

  const handleNewProjectTimelineChange = ([startIndex, endIndex]: readonly number[]) => {
    setNewProjectStart(TIMELINE_MONTHS[startIndex]?.key ?? "")
    setNewProjectEnd(TIMELINE_MONTHS[endIndex]?.key ?? "")
    const selectedDuration = endIndex - startIndex + 1
    setNewProjectPreset(
      PRESET_OPTIONS.includes(selectedDuration as (typeof PRESET_OPTIONS)[number])
        ? selectedDuration
        : 0
    )
  }

  const handleNewProjectPresetChange = ([presetValue]: string[]) => {
    const selectedDuration = Number(presetValue)
    if (!selectedDuration) return

    const startIndex = Math.max(
      0,
      TIMELINE_MONTHS.findIndex((month) => month.key === newProjectStart)
    )
    const endIndex = Math.min(startIndex + selectedDuration - 1, TIMELINE_MONTHS.length - 1)
    handleNewProjectTimelineChange([startIndex, endIndex])
  }

  const startEditing = (project: Project) => {
    const defaultStartMonth = TIMELINE_MONTHS[0].key
    const defaultEndMonth = TIMELINE_MONTHS.at(-1)?.key ?? defaultStartMonth
    setEditingProjectId(project.id)
    setEditDraft({
      name: project.name,
      startMonth: TIMELINE_MONTHS.some((month) => month.key === project.startMonth)
        ? project.startMonth
        : defaultStartMonth,
      endMonth: TIMELINE_MONTHS.some((month) => month.key === project.endMonth)
        ? project.endMonth
        : defaultEndMonth,
    })
  }

  const cancelEditing = () => {
    setEditingProjectId(null)
    setEditDraft(null)
  }

  const saveProject = async (projectId: number) => {
    if (!editDraft || !editDraft.name.trim()) return

    await db.projects.update(projectId, {
      name: editDraft.name.trim(),
      startMonth: editDraft.startMonth,
      endMonth: editDraft.endMonth,
    })
    cancelEditing()
  }

  const handleTimelineChange = ([startIndex, endIndex]: readonly number[]) => {
    setEditDraft((draft) => draft ? {
      ...draft,
      startMonth: TIMELINE_MONTHS[startIndex]?.key ?? draft.startMonth,
      endMonth: TIMELINE_MONTHS[endIndex]?.key ?? draft.endMonth,
    } : draft)
  }

  const assignStaff = async (projectId: number, staffId: number) => {
    if (!staffId || assignmentList.some((assignment) => assignment.projectId === projectId && assignment.staffId === staffId)) {
      return
    }

    const nextAssignmentId = assignmentList.reduce(
      (maxId, assignment) => Math.max(maxId, Number(assignment.id) || 0),
      0
    ) + 1
    await db.assignments.add({ id: nextAssignmentId, projectId, staffId, role: "M" })
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

  const deleteInactiveProject = async (project: Project) => {
    if (project.isActive ?? true) return

    const projectAssignments = assignmentList.filter((assignment) => assignment.projectId === project.id)
    const assignmentIds = projectAssignments.map((assignment) => assignment.id)

    await db.transaction("rw", [db.projects, db.assignments, db.allocations], async () => {
      if (assignmentIds.length > 0) {
        await db.allocations.where("assignmentId").anyOf(assignmentIds).delete()
      }
      await db.assignments.where("projectId").equals(project.id).delete()
      await db.projects.delete(project.id)
    })
  }

  const confirmDeleteProject = async () => {
    if (!projectPendingDeletion) return
    setIsDeletingProject(true)
    try {
      await deleteInactiveProject(projectPendingDeletion)
      setProjectPendingDeletion(null)
    } finally {
      setIsDeletingProject(false)
    }
  }

  const toggleProjectActive = async (project: Project) => {
    await db.projects.update(project.id, { isActive: !(project.isActive ?? true) })
  }

  return (
    <>
    <section id="sam-project-directory" className="rounded-3xl border border-neutral-300 dark:border-neutral-700/80 bg-card/75 dark:bg-card/60 text-card-foreground shadow-xs overflow-hidden transition-all duration-300">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-3 border-b border-border/60 bg-muted/40">
        <div className="flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-primary shrink-0" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Projects Directory
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Manage project metadata, assigned roles, and active states
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter projects..."
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              className="h-8 pl-8 pr-3 rounded-xl text-xs text-foreground placeholder:text-foreground/55 bg-background border border-input focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-48"
            />
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-bold border border-primary/20 shadow-2xs shrink-0">
            {projectList.length} Projects
          </span>
          <button
            type="button"
            onClick={() => setIsDirectoryCollapsed((collapsed) => !collapsed)}
            aria-expanded={!isDirectoryCollapsed}
            aria-label={isDirectoryCollapsed ? "Expand projects directory" : "Collapse projects directory"}
            title={isDirectoryCollapsed ? "Expand directory" : "Collapse directory"}
            className="inline-flex size-7 items-center justify-center rounded-xl border border-border/60 bg-muted text-muted-foreground shadow-2xs transition-all hover:bg-muted/80 hover:text-foreground cursor-pointer shrink-0"
          >
            <ChevronDown className={`size-4 text-primary transition-transform ${isDirectoryCollapsed ? "-rotate-90" : ""}`} />
          </button>
        </div>
      </div>

      {!isDirectoryCollapsed && (
        <>
      {/* Add Project Quick Form Row */}
      <div id="sam-add-project" className="p-3.5 bg-muted/20 border-b border-border/60 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="text"
          placeholder="New Project Name..."
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          className={cn(
            "min-w-[140px] flex-1 h-9 px-3.5 rounded-xl text-xs text-foreground placeholder:text-foreground/55 bg-background border focus:outline-none focus:ring-1 font-medium",
            isDuplicateProjectName ? "border-rose-500/60 focus:ring-rose-500" : "border-input focus:ring-primary"
          )}
        />
        <div className="w-full min-w-[220px] sm:mx-3 sm:w-72">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold text-muted-foreground">Timeline</span>
            <ToggleGroup
              aria-label="New project duration preset"
              value={newProjectPreset ? [String(newProjectPreset)] : []}
              onValueChange={handleNewProjectPresetChange}
            >
              {PRESET_OPTIONS.map((months) => (
                <ToggleGroupItem
                  key={months}
                  value={String(months)}
                  aria-label={`${months} months`}
                  className="data-pressed:bg-primary data-pressed:text-primary-foreground data-pressed:shadow-md data-pressed:ring-1 data-pressed:ring-primary/30"
                >
                  {months}M
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-muted-foreground">
            <span>{formatMonth(newProjectStart)}</span>
            <span>{formatMonth(newProjectEnd)}</span>
          </div>
          <Slider
            min={0}
            max={TIMELINE_MONTHS.length - 1}
            step={1}
            value={[
              Math.max(0, TIMELINE_MONTHS.findIndex((month) => month.key === newProjectStart)),
              Math.max(0, TIMELINE_MONTHS.findIndex((month) => month.key === newProjectEnd)),
            ]}
            onValueChange={handleNewProjectTimelineChange}
            aria-label="New project timeline"
          />
        </div>
        <button
          type="button"
          onClick={handleAddProject}
          disabled={!canCreateProject}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-xs cursor-pointer transition-all shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" /> Create Project
        </button>
        {isDuplicateProjectName && (
          <span className="w-full text-[10px] font-medium text-rose-600 dark:text-rose-400">
            A project with this name already exists.
          </span>
        )}
      </div>

      {/* Projects Table */}
      <div ref={scrollRef} onScroll={onScroll} className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse text-xs min-w-[580px] sm:min-w-full">
          <thead>
            <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground font-semibold text-[11px]">
              <th className="py-2.5 px-3 sm:px-4 w-20 align-top">Status</th>
              <th className="py-2.5 px-2 w-24 sm:w-28 align-top">Project Name</th>
              <th className="py-2.5 px-2 w-30 sm:w-34 align-top">Timeline</th>
              <th className="py-2.5 px-2 w-auto min-w-[240px] align-top">Assigned Team</th>
              <th className="py-2.5 px-3 sm:px-4 w-20 text-right align-top">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30 font-medium">
            {visibleProjects.map((p) => {
              const projectAssignments = assignmentList.filter((a) => a.projectId === p.id)
              const orderedProjectAssignments = projectAssignments.toSorted(
                (a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role]
              )
              const isActive = p.isActive ?? true
              const isEditing = isActive && editingProjectId === p.id
              const isFirstInactiveProject = !isActive && p.id === inactiveProjects[0]?.id
              const assignedStaffIds = new Set(projectAssignments.map((assignment) => assignment.staffId))
              const unassignedStaff = staffList.filter((staff) =>
                (staff.isActive ?? true) && !assignedStaffIds.has(staff.id)
              )

              return (
                <Fragment key={p.id}>
                  {isFirstInactiveProject && (
                    <tr key="inactive-project-toggle" className="bg-muted/30">
                      <td colSpan={5} className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => setShowInactiveProjects(false)}
                          className="flex w-full items-center gap-2 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                          aria-expanded="true"
                        >
                          <ChevronDown className="size-3 transition-transform" />
                          Inactive projects ({inactiveProjects.length})
                        </button>
                      </td>
                    </tr>
                  )}
                <tr key={p.id} className={cn("transition-colors hover:[&>td]:bg-muted/40", !isActive && "opacity-60 bg-muted/10")}>
                  <td className="py-2.5 px-3 sm:px-4 w-20 align-top">
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
                  <td className={cn("py-2.5 px-2 w-24 sm:w-28 text-foreground text-xs leading-snug align-top whitespace-normal break-words", !isActive && "pointer-events-none")}>
                    {isEditing ? (
                      <input
                        value={editDraft?.name ?? ""}
                        onChange={(event) => setEditDraft((draft) => draft ? { ...draft, name: event.target.value } : draft)}
                        className="h-7 w-full rounded-lg border border-input bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        aria-label="Project name"
                      />
                    ) : (
                      <span className="font-bold">{toTitleCase(p.name)}</span>
                    )}
                  </td>
                  <td className={cn("py-2.5 px-2 w-30 sm:w-34 text-muted-foreground text-[11px] align-top", !isActive && "pointer-events-none")}>
                    {isEditing ? (() => {
                      const startIndex = Math.max(0, TIMELINE_MONTHS.findIndex((month) => month.key === editDraft?.startMonth))
                      const endIndex = Math.max(startIndex, TIMELINE_MONTHS.findIndex((month) => month.key === editDraft?.endMonth))
                      return (
                        <div className="min-w-[180px] space-y-1.5">
                          <div className="flex justify-between gap-2 text-[10px] font-semibold text-foreground">
                            <span>{formatMonth(editDraft?.startMonth ?? "")}</span>
                            <span>{formatMonth(editDraft?.endMonth ?? "")}</span>
                          </div>
                          <Slider
                            min={0}
                            max={TIMELINE_MONTHS.length - 1}
                            step={1}
                            value={[startIndex, endIndex]}
                            onValueChange={handleTimelineChange}
                            aria-label="Project timeline"
                          />
                        </div>
                      )
                    })() : (
                      <span className="font-medium whitespace-nowrap">
                        {formatMonth(p.startMonth)} → {formatMonth(p.endMonth)}
                      </span>
                    )}
                  </td>
                  <td className={cn("py-2 px-2 align-top", !isActive && "pointer-events-none")}>
                    <div className="flex flex-col md:flex-row md:flex-wrap gap-1.5 items-start md:items-center">
                      {projectAssignments.length > 0 ? (
                        orderedProjectAssignments.map((a) => {
                          const staff = staffList.find((s) => s.id === a.staffId)
                          if (!staff) return null
                          return isEditing ? (
                            <div key={a.id} className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-background px-2 py-0.5 text-[11px] font-medium shadow-2xs whitespace-nowrap">
                              {toTitleCase(staff.name)}
                              <select
                                value={a.role}
                                onChange={(event) => void updateAssignmentRole(a.id, event.target.value as RoleType)}
                                className="h-5 rounded border border-input bg-background px-1 text-[9px] font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                aria-label={`Role for ${toTitleCase(staff.name)}`}
                              >
                                {ROLE_OPTIONS.map((roleOption) => (
                                  <option key={roleOption.value} value={roleOption.value}>{roleOption.value}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => void removeAssignment(a)}
                                className="rounded text-muted-foreground transition-colors hover:text-rose-500 cursor-pointer"
                                aria-label={`Remove ${toTitleCase(staff.name)} from project`}
                              >
                                <X className="size-3" />
                              </button>
                            </div>
                          ) : (
                            <span key={a.id} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-background border border-border/80 shadow-2xs whitespace-nowrap">
                              {toTitleCase(staff.name)}
                              <RoleBadge role={a.role} isSubRow />
                            </span>
                          )
                        })
                      ) : (
                        <span className="text-muted-foreground italic text-[11px]">No team members</span>
                      )}
                      {isEditing && unassignedStaff.length > 0 && (
                        <select
                          value=""
                          onChange={(event) => void assignStaff(p.id, Number(event.target.value))}
                          className="h-6 rounded-md border border-dashed border-input bg-background px-2 text-[10px] font-semibold text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="">Assign staff…</option>
                          {unassignedStaff.map((staff) => (
                            <option key={staff.id} value={staff.id}>{toTitleCase(staff.name)}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-2 sm:px-3 w-20 text-right align-top">
                    <div className="flex items-center justify-end gap-0">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            title="Save changes"
                            aria-label="Save project changes"
                            onClick={() => void saveProject(p.id)}
                            className="p-1 rounded-md text-emerald-600 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Cancel editing"
                            aria-label="Cancel project editing"
                            onClick={cancelEditing}
                            className="p-1 rounded-md text-muted-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          title="Edit Project"
                          aria-label="Edit project"
                          type="button"
                          onClick={() => startEditing(p)}
                          disabled={!isActive}
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-35"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        title="Delete Project"
                        aria-label="Delete project"
                        type="button"
                        onClick={() => setProjectPendingDeletion(p)}
                        disabled={isActive}
                        className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-35"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title={isActive ? "Deactivate Project" : "Reactivate Project"}
                        aria-label={isActive ? "Deactivate project" : "Reactivate project"}
                        type="button"
                        onClick={() => {
                          if (isEditing) cancelEditing()
                          void toggleProjectActive(p)
                        }}
                        className={cn(
                          "p-1 rounded-md transition-colors cursor-pointer",
                          isActive
                            ? "text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                            : "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                        )}
                      >
                        {isActive ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
                </Fragment>
              )
            })}
            {visibleProjects.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="mx-auto flex max-w-xs flex-col items-center gap-2.5 text-muted-foreground">
                    <div className="flex size-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                      <FolderKanban className="size-4" />
                    </div>
                    <p className="text-xs font-bold text-foreground">
                      {projectList.length === 0 ? "No projects yet" : "No projects found"}
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      {projectList.length === 0
                        ? "Create your first project using the form above."
                        : "Try a different search, or show inactive projects."}
                    </p>
                    {projectList.length > 0 && inactiveProjects.length > 0 && !showInactiveProjects && (
                      <button
                        type="button"
                        onClick={() => setShowInactiveProjects(true)}
                        className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                      >
                        Show inactive projects
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
            {inactiveProjects.length > 0 && !showInactiveProjects && visibleProjects.length > 0 && (
              <tr className="bg-muted/30">
                <td colSpan={5} className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setShowInactiveProjects(true)}
                    className="flex w-full items-center gap-2 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                    aria-expanded="false"
                  >
                    <ChevronDown className="size-3 -rotate-90 transition-transform" />
                    Inactive projects ({inactiveProjects.length})
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
    <ConfirmDialog
      open={!!projectPendingDeletion}
      title="Delete project?"
      description={`This permanently deletes ${projectPendingDeletion ? toTitleCase(projectPendingDeletion.name) : "this project"}, along with its assignments and capacity allocations. This cannot be undone.`}
      confirmLabel="Delete Project"
      isDestructive
      isLoading={isDeletingProject}
      onConfirm={() => void confirmDeleteProject()}
      onCancel={() => setProjectPendingDeletion(null)}
    />
    </>
  )
}
