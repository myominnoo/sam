import { useState, type Ref } from "react"
import { FolderKanban, Search, Plus, Edit2, Trash2, Ban } from "lucide-react"
import { toTitleCase } from "@/lib/string-utils"
import { RoleBadge } from "@/components/ui/role-badge"
import { db } from "@/db/schema"
import type { Project, Staff, Assignment } from "@/types/sam"

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
  const [newProjectStart, setNewProjectStart] = useState("")
  const [newProjectEnd, setNewProjectEnd] = useState("")

  const handleAddProject = async () => {
    if (!newProjectName.trim()) return

    await db.projects.add({
      name: newProjectName.trim(),
      startMonth: newProjectStart || "",
      endMonth: newProjectEnd || "",
      isActive: true,
    } as any)

    setNewProjectName("")
    setNewProjectStart("")
    setNewProjectEnd("")
  }

  const filteredProjects = projectList.filter((p) =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase())
  )

  return (
    <section className="rounded-3xl border border-neutral-300 dark:border-neutral-700/80 bg-card/75 dark:bg-card/60 text-card-foreground shadow-xs overflow-hidden transition-all duration-300">
      {/* Section Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/60 bg-muted/40">
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
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter projects..."
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              className="h-8 pl-8 pr-3 rounded-xl text-xs bg-background border border-input focus:outline-none focus:ring-1 focus:ring-primary w-48"
            />
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-bold border border-primary/20 shadow-2xs">
            {projectList.length} Projects
          </span>
        </div>
      </div>

      {/* Add Project Quick Form Row */}
      <div className="p-3.5 bg-neutral-900/40 dark:bg-neutral-950/60 border-b border-border/60 flex items-center gap-3">
        <input
          type="text"
          placeholder="New Project Name..."
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          className="flex-1 h-9 px-3.5 rounded-xl text-xs bg-background border border-input focus:outline-none focus:ring-1 focus:ring-primary font-medium"
        />
        <input
          type="text"
          placeholder="Start Month (e.g. 2026-08)"
          value={newProjectStart}
          onChange={(e) => setNewProjectStart(e.target.value)}
          className="w-44 h-9 px-3 rounded-xl text-xs bg-background border border-input focus:outline-none focus:ring-1 focus:ring-primary font-medium"
        />
        <input
          type="text"
          placeholder="End Month (e.g. 2027-07)"
          value={newProjectEnd}
          onChange={(e) => setNewProjectEnd(e.target.value)}
          className="w-44 h-9 px-3 rounded-xl text-xs bg-background border border-input focus:outline-none focus:ring-1 focus:ring-primary font-medium"
        />
        <button
          type="button"
          onClick={handleAddProject}
          className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-xs cursor-pointer transition-all"
        >
          <Plus className="h-3.5 w-3.5" /> Create Project
        </button>
      </div>

      {/* Projects Table */}
      <div ref={scrollRef} onScroll={onScroll} className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30 font-bold text-[11px] text-muted-foreground uppercase">
              <th className="p-3 px-4 w-24">Status</th>
              <th className="p-3 w-56">Project Name</th>
              <th className="p-3 w-44">Duration Range</th>
              <th className="p-3 w-40">Project Lead</th>
              <th className="p-3">Team Assignments</th>
              <th className="p-3 px-4 w-28 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30 font-medium">
            {projectList.map((p) => {
              const projectAssignments = assignmentList.filter((a) => a.projectId === p.id)
              const leadAssignment = projectAssignments.find((a) => a.role === "PL")
              const leadStaff = staffList.find((s) => s.id === leadAssignment?.staffId)

              return (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                    </span>
                  </td>
                  <td className="p-3 font-bold text-foreground">{toTitleCase(p.name)}</td>
                  <td className="p-3 text-muted-foreground font-mono text-[11px]">
                    {p.startMonth || "—"} → {p.endMonth || "—"}
                  </td>
                  <td className="p-3">
                    {leadStaff ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-background border border-border shadow-2xs">
                        {toTitleCase(leadStaff.name)}
                        <RoleBadge role="PL" isSubRow />
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic text-[11px]">No Lead Assigned</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {projectAssignments.length > 0 ? (
                        projectAssignments.map((a) => {
                          const staff = staffList.find((s) => s.id === a.staffId)
                          if (!staff) return null
                          return (
                            <span key={a.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] bg-background border border-border shadow-2xs">
                              {toTitleCase(staff.name)}
                              <RoleBadge role={a.role} isSubRow />
                            </span>
                          )
                        })
                      ) : (
                        <span className="text-muted-foreground italic text-[11px]">No team members</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button title="Edit Project" type="button" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button title="Delete Project" type="button" className="p-1.5 rounded-lg hover:bg-muted text-rose-500 transition-colors cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <button title="Deactivate" type="button" className="p-1.5 rounded-lg hover:bg-muted text-amber-500 transition-colors cursor-pointer">
                        <Ban className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}