import { useState, type Ref } from "react"
import { FolderKanban, Search, Plus, Edit2, Trash2, Ban } from "lucide-react"
import { toTitleCase } from "@/lib/string-utils"
import { cn } from "@/lib/utils"
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
              className="h-8 pl-8 pr-3 rounded-xl text-xs bg-background border border-input focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-48"
            />
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-bold border border-primary/20 shadow-2xs shrink-0">
            {projectList.length} Projects
          </span>
        </div>
      </div>

      {/* Add Project Quick Form Row */}
      <div className="p-3.5 bg-muted/20 border-b border-border/60 flex flex-wrap sm:flex-nowrap items-center gap-2.5">
        <input
          type="text"
          placeholder="New Project Name..."
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          className="flex-1 min-w-[140px] h-9 px-3.5 rounded-xl text-xs bg-background border border-input focus:outline-none focus:ring-1 focus:ring-primary font-medium"
        />
        <input
          type="text"
          placeholder="Start Month (e.g. 2026-08)"
          value={newProjectStart}
          onChange={(e) => setNewProjectStart(e.target.value)}
          className="w-40 h-9 px-3 rounded-xl text-xs bg-background border border-input focus:outline-none focus:ring-1 focus:ring-primary font-medium"
        />
        <input
          type="text"
          placeholder="End Month (e.g. 2027-07)"
          value={newProjectEnd}
          onChange={(e) => setNewProjectEnd(e.target.value)}
          className="w-40 h-9 px-3 rounded-xl text-xs bg-background border border-input focus:outline-none focus:ring-1 focus:ring-primary font-medium"
        />
        <button
          type="button"
          onClick={handleAddProject}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-xs cursor-pointer transition-all shrink-0"
        >
          <Plus className="h-3.5 w-3.5" /> Create Project
        </button>
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
            {filteredProjects.map((p) => {
              const projectAssignments = assignmentList.filter((a) => a.projectId === p.id)
              const isActive = p.isActive ?? true

              return (
                <tr key={p.id} className={cn("transition-colors hover:bg-muted/15", !isActive && "opacity-60 bg-muted/10")}>
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
                  <td className="py-2.5 px-2 w-24 sm:w-28 font-bold text-foreground text-xs leading-snug align-top whitespace-normal break-words">{toTitleCase(p.name)}</td>
                  <td className="py-2.5 px-2 w-30 sm:w-34 text-muted-foreground font-mono text-[11px] align-top">
                    {p.startMonth || "—"} → {p.endMonth || "—"}
                  </td>
                  <td className="py-2 px-2 align-top">
                    <div className="flex flex-col md:flex-row md:flex-wrap gap-1.5 items-start md:items-center">
                      {projectAssignments.length > 0 ? (
                        projectAssignments.map((a) => {
                          const staff = staffList.find((s) => s.id === a.staffId)
                          if (!staff) return null
                          return (
                            <span key={a.id} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-background border border-border/80 shadow-2xs whitespace-nowrap">
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
                  <td className="py-2.5 px-2 sm:px-3 w-20 text-right align-top">
                    <div className="flex items-center justify-end gap-0">
                      <button title="Edit Project" type="button" className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button title="Delete Project" type="button" className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <button title="Deactivate" type="button" className="p-1 rounded-md text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer">
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
