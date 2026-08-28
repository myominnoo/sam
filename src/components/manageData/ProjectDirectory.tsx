import { useState, useMemo, type FormEvent } from "react";
import {
  FolderKanban,
  Search,
  Plus,
  Calendar,
  Edit3,
  Trash2,
  Check,
  X,
} from "lucide-react";
import type { Project, Staff, Assignment } from "../../db";
import { MASTER_MONTH_OPTIONS } from "../../constants";
import { RoleBadge } from "../common/RoleBadge";
import { FormInput, FormSelect } from "../common/FormControls";
import type { ToastType } from "../common/Toast";

interface ProjectDirectoryProps {
  projects: Project[];
  staffMembers: Staff[];
  assignments: Assignment[];
  onAddProject: (
    name: string,
    startMonth?: string,
    endMonth?: string,
  ) => Promise<void>;
  onUpdateProject: (
    id: number,
    name: string,
    plStaffId: number | null,
    teamAssignments: { staffId: number; role: "M" | "A" }[],
    startMonth?: string,
    endMonth?: string,
  ) => Promise<void>;
  onRequestDelete: (project: Project) => void;
  showToast: (message: string, type?: ToastType) => void;
}

export const ProjectDirectory = ({
  projects,
  staffMembers,
  assignments,
  onAddProject,
  onUpdateProject,
  onRequestDelete,
  showToast,
}: ProjectDirectoryProps) => {
  const [search, setSearch] = useState("");

  // New Project Form State
  const [name, setName] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");

  // Edit Project State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editPlStaffId, setEditPlStaffId] = useState<number | null>(null);
  const [editTeamMembers, setEditTeamMembers] = useState<
    { staffId: number; role: "M" | "A" }[]
  >([]);

  const filteredProjects = useMemo(
    () =>
      projects.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [projects, search],
  );

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Please enter a project name.", "warning");
      return;
    }
    await onAddProject(name, startMonth || undefined, endMonth || undefined);
    showToast(`Added project "${name}".`, "success");
    setName("");
    setStartMonth("");
    setEndMonth("");
  };

  const startEdit = (proj: Project) => {
    setEditingId(proj.id!);
    setEditName(proj.name);
    setEditStart(proj.startMonth || "");
    setEditEnd(proj.endMonth || "");

    const projAssignments = assignments.filter((a) => a.projectId === proj.id);
    const pl = projAssignments.find((a) => a.role === "PL");
    setEditPlStaffId(pl ? pl.staffId : null);
    setEditTeamMembers(
      projAssignments
        .filter((a) => a.role !== "PL")
        .map((a) => ({
          staffId: a.staffId,
          role: (a.role as "M" | "A") || "M",
        })),
    );
  };

  const handleSaveEdit = async (id: number) => {
    await onUpdateProject(
      id,
      editName,
      editPlStaffId,
      editTeamMembers,
      editStart || undefined,
      editEnd || undefined,
    );
    setEditingId(null);
    showToast("Project details updated.", "success");
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <FolderKanban className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">
              Projects Directory
            </h3>
            <p className="text-[11px] text-slate-500">
              Manage active projects, schedules, project leaders, and assigned
              team members
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-36 sm:w-48"
            />
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
            {projects.length} Total
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <form
          onSubmit={handleAdd}
          className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 flex flex-wrap lg:flex-nowrap items-center gap-2.5"
        >
          <div className="flex-1 min-w-[180px]">
            <FormInput
              placeholder="New Project Name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="w-full sm:w-auto min-w-[130px]">
            <FormSelect
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
              options={[
                { label: "Start Month...", value: "" },
                ...MASTER_MONTH_OPTIONS.map((m) => ({
                  label: `${m.month} ${m.year}`,
                  value: m.key,
                })),
              ]}
              className="bg-white"
            />
          </div>
          <div className="w-full sm:w-auto min-w-[130px]">
            <FormSelect
              value={endMonth}
              onChange={(e) => setEndMonth(e.target.value)}
              options={[
                { label: "End Month...", value: "" },
                ...MASTER_MONTH_OPTIONS.map((m) => ({
                  label: `${m.month} ${m.year}`,
                  value: m.key,
                })),
              ]}
              className="bg-white"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer shrink-0 w-full sm:w-auto shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Project</span>
          </button>
        </form>

        <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                <th className="p-3">Project Name</th>
                <th className="p-3">Timeline Duration</th>
                <th className="p-3">Assigned PL</th>
                <th className="p-3">Assigned Team</th>
                <th className="p-3 text-right whitespace-nowrap w-[1%]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-4 text-center text-slate-400 italic"
                  >
                    No projects found matching search filter.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((proj) => {
                  const isEditing = editingId === proj.id;
                  const projAssignments = assignments.filter(
                    (a) => a.projectId === proj.id,
                  );
                  const plAssignment = projAssignments.find(
                    (a) => a.role === "PL",
                  );
                  const plStaff = plAssignment
                    ? staffMembers.find((s) => s.id === plAssignment.staffId)
                    : null;
                  const teamAssignments = projAssignments.filter(
                    (a) => a.role !== "PL",
                  );

                  return (
                    <tr
                      key={proj.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {isEditing ? (
                        <>
                          <td className="p-2">
                            <FormInput
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          </td>
                          <td className="p-2 space-y-1">
                            <FormSelect
                              value={editStart}
                              onChange={(e) => setEditStart(e.target.value)}
                              options={[
                                { label: "(Start Month)", value: "" },
                                ...MASTER_MONTH_OPTIONS.map((m) => ({
                                  label: `${m.month} ${m.year}`,
                                  value: m.key,
                                })),
                              ]}
                            />
                            <FormSelect
                              value={editEnd}
                              onChange={(e) => setEditEnd(e.target.value)}
                              options={[
                                { label: "(End Month)", value: "" },
                                ...MASTER_MONTH_OPTIONS.map((m) => ({
                                  label: `${m.month} ${m.year}`,
                                  value: m.key,
                                })),
                              ]}
                            />
                          </td>
                          <td className="p-2">
                            <FormSelect
                              value={editPlStaffId || ""}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setEditPlStaffId(val || null);
                                if (val)
                                  setEditTeamMembers((prev) =>
                                    prev.filter((t) => t.staffId !== val),
                                  );
                              }}
                              options={[
                                { label: "(No PL Assigned)", value: "" },
                                ...staffMembers.map((s) => ({
                                  label: s.name,
                                  value: s.id!,
                                })),
                              ]}
                            />
                          </td>
                          <td className="p-2">
                            <div className="space-y-1.5">
                              <FormSelect
                                value=""
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (!val) return;
                                  const [staffIdStr, role] = val.split("-");
                                  const staffId = Number(staffIdStr);
                                  if (
                                    staffId &&
                                    (role === "M" || role === "A")
                                  ) {
                                    setEditTeamMembers((prev) => [
                                      ...prev.filter(
                                        (t) => t.staffId !== staffId,
                                      ),
                                      { staffId, role: role as "M" | "A" },
                                    ]);
                                  }
                                  e.target.value = "";
                                }}
                                options={[
                                  { label: "+ Add Team Member...", value: "" },
                                  ...staffMembers
                                    .filter((s) => s.id !== editPlStaffId)
                                    .flatMap((s) => {
                                      const isAssigned = editTeamMembers.some(
                                        (t) => t.staffId === s.id,
                                      );
                                      return [
                                        {
                                          label: `+ ${s.name} (Member - M)`,
                                          value: `${s.id}-M`,
                                          disabled: isAssigned,
                                        },
                                        {
                                          label: `+ ${s.name} (Assisting - A)`,
                                          value: `${s.id}-A`,
                                          disabled: isAssigned,
                                        },
                                      ];
                                    }),
                                ]}
                              />
                              <div className="flex flex-wrap gap-1">
                                {editTeamMembers.map((item) => {
                                  const s = staffMembers.find(
                                    (staff) => staff.id === item.staffId,
                                  );
                                  return s ? (
                                    <span
                                      key={item.staffId}
                                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-medium"
                                    >
                                      <span>{s.name}</span>
                                      <RoleBadge
                                        role={item.role}
                                        onClick={() =>
                                          setEditTeamMembers((prev) =>
                                            prev.map((t) =>
                                              t.staffId === item.staffId
                                                ? {
                                                    ...t,
                                                    role:
                                                      t.role === "M"
                                                        ? "A"
                                                        : "M",
                                                  }
                                                : t,
                                            ),
                                          )
                                        }
                                        title="Click to toggle Member (M) / Assisting (A)"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setEditTeamMembers((prev) =>
                                            prev.filter(
                                              (t) => t.staffId !== item.staffId,
                                            ),
                                          )
                                        }
                                        className="text-slate-400 hover:text-red-600 font-bold cursor-pointer ml-0.5"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          </td>
                          <td className="p-2 text-right whitespace-nowrap w-[1%]">
                            <div className="flex items-center justify-end gap-0.5">
                              <button
                                onClick={() => handleSaveEdit(proj.id!)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 font-semibold text-slate-800">
                            {proj.name}
                          </td>
                          <td className="p-3">
                            {proj.startMonth && proj.endMonth ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200/80 text-[11px] font-medium">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>{proj.startMonth.replace("-", " ")}</span>
                                <span className="text-slate-400">→</span>
                                <span>{proj.endMonth.replace("-", " ")}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">
                                No timeline set
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {plStaff ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/60 text-amber-900 text-[11px] font-medium">
                                <span>{plStaff.name}</span>
                                <RoleBadge role="PL" />
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">
                                Unassigned
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {teamAssignments.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {teamAssignments.map((a) => {
                                  const staff = staffMembers.find(
                                    (s) => s.id === a.staffId,
                                  );
                                  return staff ? (
                                    <span
                                      key={a.id}
                                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-700"
                                    >
                                      <span>{staff.name}</span>
                                      <RoleBadge role={a.role} />
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">
                                No members
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right whitespace-nowrap w-[1%]">
                            <div className="flex items-center justify-end gap-0.5">
                              <button
                                onClick={() => startEdit(proj)}
                                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onRequestDelete(proj)}
                                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
