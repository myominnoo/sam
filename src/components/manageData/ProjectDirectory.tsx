import { useState, useMemo, type FormEvent } from "react";
import {
  FolderKanban,
  Search,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Power,
  PowerOff,
} from "lucide-react";
import type { Project, Staff, Assignment } from "../../db";
import { MASTER_MONTH_OPTIONS } from "../../constants";
import { RoleBadge } from "../common/RoleBadge";
import { FormInput, FormSelect } from "../common/FormControls";
import type { ToastType } from "../common/Toast";
import { ActionCard } from "../common/ActionCard";

interface ProjectDirectoryProps {
  projects: Project[];
  staffMembers: Staff[];
  assignments: Assignment[];
  onAddProject: (
    name: string,
    startMonth?: string,
    endMonth?: string,
  ) => Promise<void>;
  onToggleProjectActive: (project: Project) => Promise<void>;
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
  onToggleProjectActive,
  onUpdateProject,
  onRequestDelete,
  showToast,
}: ProjectDirectoryProps) => {
  const [search, setSearch] = useState("");

  const [projectName, setProjectName] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editStartMonth, setEditStartMonth] = useState("");
  const [editEndMonth, setEditEndMonth] = useState("");
  const [editPlId, setEditPlId] = useState<number | null>(null);
  const [editTeam, setEditTeam] = useState<
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
    if (!projectName.trim()) {
      showToast("Please enter a project name.", "warning");
      return;
    }
    await onAddProject(
      projectName,
      startMonth || undefined,
      endMonth || undefined,
    );
    setProjectName("");
    setStartMonth("");
    setEndMonth("");
  };

  const startEdit = (proj: Project) => {
    setEditingId(proj.id!);
    setEditName(proj.name);
    setEditStartMonth(proj.startMonth || "");
    setEditEndMonth(proj.endMonth || "");

    const projAssignments = assignments.filter((a) => a.projectId === proj.id);
    const pl = projAssignments.find((a) => a.role === "PL");
    const team = projAssignments
      .filter((a) => a.role === "M" || a.role === "A")
      .map((a) => ({ staffId: a.staffId, role: a.role as "M" | "A" }));

    setEditPlId(pl ? pl.staffId : null);
    setEditTeam(team);
  };

  const handleSaveEdit = async (id: number) => {
    await onUpdateProject(
      id,
      editName,
      editPlId,
      editTeam,
      editStartMonth || undefined,
      editEndMonth || undefined,
    );
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200/90 ring-1 ring-slate-900/5 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <FolderKanban className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">
              Projects Directory
            </h3>
            <p className="text-[11px] text-slate-500">
              Manage project metadata, assigned roles, and active states
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
              className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-36 sm:w-48"
            />
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
            {projects.length} Projects
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <ActionCard accentColorClass="border-l-indigo-500">
          <form
            onSubmit={handleAdd}
            className="flex flex-wrap lg:flex-nowrap items-center gap-2.5 w-full"
          >
            {/* Project Name Input */}
            <div className="flex-1 min-w-[200px]">
              <FormInput
                placeholder="New Project Name..."
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="bg-slate-800/80 hover:bg-slate-800 border-slate-700 focus:border-indigo-500 text-slate-100 placeholder:text-slate-400"
              />
            </div>

            {/* Start Month Select */}
            <div className="w-full sm:w-auto min-w-[150px]">
              <FormSelect
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                options={[
                  { label: "Start Month (Optional)", value: "" },
                  ...MASTER_MONTH_OPTIONS.map((m) => ({
                    label: `${m.shortMonth} ${m.year}`,
                    value: m.key,
                  })),
                ]}
                className="bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-100 hover:text-white focus:text-white focus:bg-slate-800 focus:border-indigo-500 [&>option]:bg-slate-800 [&>option]:text-white"
              />
            </div>

            {/* End Month Select */}
            <div className="w-full sm:w-auto min-w-[150px]">
              <FormSelect
                value={endMonth}
                onChange={(e) => setEndMonth(e.target.value)}
                options={[
                  { label: "End Month (Optional)", value: "" },
                  ...MASTER_MONTH_OPTIONS.map((m) => ({
                    label: `${m.shortMonth} ${m.year}`,
                    value: m.key,
                  })),
                ]}
                className="bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-100 hover:text-white focus:text-white focus:bg-slate-800 focus:border-indigo-500 [&>option]:bg-slate-800 [&>option]:text-white"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 w-full sm:w-auto shadow-xs active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Create Project</span>
            </button>
          </form>
        </ActionCard>

        <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                <th className="p-3">Status</th>
                <th className="p-3">Project Name</th>
                <th className="p-3">Duration Range</th>
                <th className="p-3">Project Lead</th>
                <th className="p-3">Team Assignments</th>
                <th className="p-3 text-right whitespace-nowrap w-[1%]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-4 text-center text-slate-400 italic"
                  >
                    No projects found matching search filter.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => {
                  const isActive = project.isActive !== false;
                  const isEditing = editingId === project.id;
                  const projAssignments = assignments.filter(
                    (a) => a.projectId === project.id,
                  );
                  const plAssignment = projAssignments.find(
                    (a) => a.role === "PL",
                  );
                  const plStaff = plAssignment
                    ? staffMembers.find((s) => s.id === plAssignment.staffId)
                    : null;
                  const teamMembers = projAssignments.filter(
                    (a) => a.role !== "PL",
                  );

                  return (
                    <tr
                      key={project.id}
                      className={`transition-colors ${
                        isActive
                          ? "hover:bg-slate-50/60"
                          : "bg-slate-50/40 text-slate-400"
                      }`}
                    >
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                              : "bg-slate-200/80 text-slate-600 border border-slate-300/80"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {isEditing ? (
                        <>
                          <td className="p-2">
                            <FormInput
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <FormSelect
                                value={editStartMonth}
                                onChange={(e) =>
                                  setEditStartMonth(e.target.value)
                                }
                                options={[
                                  { label: "Start", value: "" },
                                  ...MASTER_MONTH_OPTIONS.map((m) => ({
                                    label: m.shortMonth,
                                    value: m.key,
                                  })),
                                ]}
                                className="w-20"
                              />
                              <FormSelect
                                value={editEndMonth}
                                onChange={(e) =>
                                  setEditEndMonth(e.target.value)
                                }
                                options={[
                                  { label: "End", value: "" },
                                  ...MASTER_MONTH_OPTIONS.map((m) => ({
                                    label: m.shortMonth,
                                    value: m.key,
                                  })),
                                ]}
                                className="w-20"
                              />
                            </div>
                          </td>
                          <td className="p-2">
                            <FormSelect
                              value={editPlId || ""}
                              onChange={(e) =>
                                setEditPlId(
                                  e.target.value
                                    ? Number(e.target.value)
                                    : null,
                                )
                              }
                              options={[
                                { label: "Select Lead...", value: "" },
                                ...staffMembers.map((s) => ({
                                  label: s.name,
                                  value: s.id!,
                                })),
                              ]}
                              className="w-32"
                            />
                          </td>
                          <td className="p-2">
                            <FormSelect
                              value=""
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (
                                  val &&
                                  !editTeam.some((t) => t.staffId === val)
                                ) {
                                  setEditTeam((prev) => [
                                    ...prev,
                                    { staffId: val, role: "M" },
                                  ]);
                                }
                                e.target.value = "";
                              }}
                              options={[
                                { label: "+ Add Team Member...", value: "" },
                                ...staffMembers.map((s) => ({
                                  label: s.name,
                                  value: s.id!,
                                  disabled:
                                    s.id === editPlId ||
                                    editTeam.some((t) => t.staffId === s.id),
                                })),
                              ]}
                            />
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {editTeam.map((team) => {
                                const st = staffMembers.find(
                                  (s) => s.id === team.staffId,
                                );
                                return st ? (
                                  <span
                                    key={team.staffId}
                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px]"
                                  >
                                    <span>{st.name}</span>
                                    <select
                                      value={team.role}
                                      onChange={(e) => {
                                        const r = e.target.value as "M" | "A";
                                        setEditTeam((prev) =>
                                          prev.map((t) =>
                                            t.staffId === team.staffId
                                              ? { ...t, role: r }
                                              : t,
                                          ),
                                        );
                                      }}
                                      className="bg-white border rounded px-1 text-[10px] font-bold text-indigo-600"
                                    >
                                      <option value="M">M</option>
                                      <option value="A">A</option>
                                    </select>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditTeam((prev) =>
                                          prev.filter(
                                            (t) => t.staffId !== team.staffId,
                                          ),
                                        )
                                      }
                                      className="hover:text-red-600 cursor-pointer font-bold ml-0.5"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </td>
                          <td className="p-2 text-right whitespace-nowrap w-[1%]">
                            <div className="flex items-center justify-end gap-0.5">
                              <button
                                onClick={() => handleSaveEdit(project.id!)}
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
                          <td
                            className={`p-3 font-semibold ${
                              isActive
                                ? "text-slate-800"
                                : "text-slate-400 line-through"
                            }`}
                          >
                            {project.name}
                          </td>
                          <td className="p-3 text-slate-600 font-mono text-[11px]">
                            {project.startMonth && project.endMonth ? (
                              <span>
                                {project.startMonth} → {project.endMonth}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">
                                Continuous / Unspecified
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {plStaff ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/80 text-amber-900 font-semibold text-[11px]">
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
                            {teamMembers.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {teamMembers.map((tm) => {
                                  const st = staffMembers.find(
                                    (s) => s.id === tm.staffId,
                                  );
                                  return st ? (
                                    <span
                                      key={tm.id}
                                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-700"
                                    >
                                      <span>{st.name}</span>
                                      <RoleBadge role={tm.role} />
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">
                                No team members
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right whitespace-nowrap w-[1%]">
                            <div className="flex items-center justify-end gap-1">
                              {isActive ? (
                                <>
                                  <button
                                    onClick={() => startEdit(project)}
                                    className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                                    title="Edit Project"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => onRequestDelete(project)}
                                    className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                    title="Delete Project"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      onToggleProjectActive(project)
                                    }
                                    className="p-1.5 xl:px-2 xl:py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-semibold text-[11px] border border-amber-200/80 inline-flex items-center gap-1 cursor-pointer transition-colors"
                                    title="Deactivate Project"
                                  >
                                    <PowerOff className="w-3.5 h-3.5" />
                                    <span className="hidden xl:inline">
                                      Deactivate
                                    </span>
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => onToggleProjectActive(project)}
                                  className="p-1.5 xl:px-2.5 xl:py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-semibold text-[11px] border border-emerald-200/80 inline-flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Activate Project"
                                >
                                  <Power className="w-3.5 h-3.5" />
                                  <span className="hidden xl:inline">
                                    Activate
                                  </span>
                                </button>
                              )}
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
