import type { Ref } from "react"
import { Users, Search, Plus, SlidersHorizontal, Edit2, Trash2, Ban, CheckCircle2, AlertCircle } from "lucide-react"
import { toTitleCase } from "@/lib/string-utils"
import { RoleBadge } from "@/components/ui/role-badge"
import { useAddStaff } from "@/hooks/use-add-staff"
import { useStaffTableState } from "@/hooks/use-staff-table-state"
import { ConfigureCapacityDialog } from "./configure-capacity-dialog"
import { cn } from "@/lib/utils"
import type { Staff, Assignment, Project, Designation } from "@/types/sam"

const topAlignedCellStyle = { verticalAlign: "top" } as const

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
                className="h-8 pl-8 pr-3 rounded-xl text-xs bg-background border border-input focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-48"
              />
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-bold border border-primary/20 shadow-2xs shrink-0">
              {staffList.length} Members
            </span>
          </div>
        </div>

        {/* Add Staff Quick Form Row */}
        <div className="p-3.5 bg-muted/20 border-b border-border/60 flex flex-col gap-2">
          <form
            onSubmit={addStaff}
            className="flex flex-wrap sm:flex-nowrap items-center gap-2.5"
          >
            <input
              type="text"
              placeholder="New Staff Name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cn(
                "flex-1 min-w-[140px] h-9 px-3.5 rounded-xl text-xs bg-background border font-medium transition-colors focus:outline-none focus:ring-1",
                error
                  ? "border-rose-500/60 focus:ring-rose-500"
                  : "border-input focus:ring-primary"
              )}
            />

            {/* Dynamic Designations Select */}
            <select
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="h-9 px-3 rounded-xl text-xs bg-background border border-input focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            >
              {designationList.map((d) => (
                <option key={d.id || d.code} value={d.code}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>

            {/* FTE Input with inline label */}
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
                className="w-16 h-9 px-2 text-center rounded-xl text-xs bg-background border border-input focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              />
              <span className="text-xs font-semibold text-muted-foreground select-none">
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
              {filteredStaff.map((s) => {
                const assignments = assignmentList.filter((a) => a.staffId === s.id)
                const isActive = s.isActive ?? true

                return (
                  <tr
                    key={s.id}
                    className={cn(
                      "transition-colors hover:bg-muted/15",
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
                    <td className="py-2.5 px-2 w-24 sm:w-28 font-bold text-foreground text-xs leading-snug align-top whitespace-normal break-words" style={topAlignedCellStyle}>
                      {toTitleCase(s.name)}
                    </td>

                    {/* Designation Code Badge */}
                    <td className="py-2.5 px-2 w-20 sm:w-24 text-center align-top" style={topAlignedCellStyle}>
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono bg-muted/60 text-muted-foreground border border-border/50">
                        {s.designation}
                      </span>
                    </td>

                    {/* FTE */}
                    <td className="py-2.5 px-2 w-10 text-center font-bold text-foreground align-top" style={topAlignedCellStyle}>
                      {s.fte ?? 1}
                    </td>

                    {/* Assigned Projects */}
                    <td className="py-2 px-2 align-top" style={topAlignedCellStyle}>
                      <div className="flex flex-col md:flex-row md:flex-wrap gap-1.5 items-start">
                        {assignments.length > 0 ? (
                          assignments.map((a) => {
                            const proj = projectList.find((p) => p.id === a.projectId)
                            if (!proj) return null
                            return (
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
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                          </button>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-30 pointer-events-none whitespace-nowrap rounded-md bg-neutral-900 dark:bg-neutral-100 px-2 py-1 text-[10px] font-semibold text-neutral-100 dark:text-neutral-900 shadow-md">
                            Configure Capacity
                          </div>
                        </div>

                        {/* Edit Staff Button */}
                        <div className="relative group">
                          <button
                            type="button"
                            title="Edit Staff Member"
                            aria-label="Edit Staff Member"
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-30 pointer-events-none whitespace-nowrap rounded-md bg-neutral-900 dark:bg-neutral-100 px-2 py-1 text-[10px] font-semibold text-neutral-100 dark:text-neutral-900 shadow-md">
                            Edit Staff
                          </div>
                        </div>

                        {/* Delete Staff Button */}
                        <div className="relative group">
                          <button
                            type="button"
                            title="Delete Staff Member"
                            aria-label="Delete Staff Member"
                            className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
                            title={isActive ? "Deactivate Staff Member" : "Reactivate Staff Member"}
                            aria-label={isActive ? "Deactivate Staff Member" : "Reactivate Staff Member"}
                            onClick={() => handleToggleActive(s)}
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
                            {isActive ? "Deactivate Staff" : "Reactivate Staff"}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Configure Capacity Modal */}
      <ConfigureCapacityDialog
        open={!!selectedCapacityStaff}
        staff={selectedCapacityStaff}
        assignmentList={assignmentList}
        projectList={projectList}
        onClose={() => setSelectedCapacityStaff(null)}
      />
    </>
  )
}
