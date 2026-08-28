import { useState } from "react";
import type { FormEvent, RefObject, ChangeEvent } from "react";
import {
  User,
  Briefcase,
  Trash2,
  Edit3,
  Plus,
  Check,
  X,
  Calendar,
  Sliders,
  Upload,
  Download,
} from "lucide-react";
import type { Staff, Project, Assignment } from "../db";
import type { TimelineMonth } from "../constants";
import { MASTER_MONTH_OPTIONS } from "../constants";
import { getRoleBadgeClass } from "../utils/styleHelpers";

interface ManageDataProps {
  staffMembers: Staff[];
  projects: Project[];
  assignments: Assignment[];
  timelineMonths: TimelineMonth[];
  onAddStaff: (name: string, designation: string, fte: number) => Promise<void>;
  onUpdateStaff: (
    id: number,
    name: string,
    designation: string,
    fte: number,
    assignedProjectIds: number[],
  ) => Promise<void>;
  onDeleteStaff: (id: number) => Promise<void>;
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
  onDeleteProject: (id: number) => Promise<void>;
  onOpenBulkCapacityModal: (staff: Staff) => void;
  onImportClick: () => void;
  onExport: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const ROLE_OPTIONS = ["RA", "SRA", "ADE", "DOR"];

export const ManageData = ({
  staffMembers,
  projects,
  assignments,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onOpenBulkCapacityModal,
  onImportClick,
  onExport,
  fileInputRef,
  onFileChange,
}: ManageDataProps) => {
  // Staff Form State
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("RA");
  const [newStaffFte, setNewStaffFte] = useState(1.0);
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [editStaffName, setEditStaffName] = useState("");
  const [editStaffRole, setEditStaffRole] = useState("RA");
  const [editStaffFte, setEditStaffFte] = useState(1.0);
  const [editStaffProjectIds, setEditStaffProjectIds] = useState<number[]>([]);

  // Project Form State
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjStart, setNewProjStart] = useState("");
  const [newProjEnd, setNewProjEnd] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjStart, setEditProjStart] = useState("");
  const [editProjEnd, setEditProjEnd] = useState("");

  // Project Assignment State
  const [editPlStaffId, setEditPlStaffId] = useState<number | null>(null);
  const [editTeamMembers, setEditTeamMembers] = useState<
    { staffId: number; role: "M" | "A" }[]
  >([]);

  // Handlers
  const handleAddStaff = async (e: FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;
    await onAddStaff(newStaffName, newStaffRole, newStaffFte);
    setNewStaffName("");
    setNewStaffRole("RA");
  };

  const startEditStaff = (staff: Staff) => {
    setEditingStaffId(staff.id!);
    setEditStaffName(staff.name);
    setEditStaffRole(
      ROLE_OPTIONS.includes(staff.designation) ? staff.designation : "RA",
    );
    setEditStaffFte(staff.fte);
    const currentProjIds = assignments
      .filter((a) => a.staffId === staff.id)
      .map((a) => a.projectId);
    setEditStaffProjectIds(currentProjIds);
  };

  const handleToggleStaffProject = (projId: number) => {
    setEditStaffProjectIds((prev) =>
      prev.includes(projId)
        ? prev.filter((id) => id !== projId)
        : [...prev, projId],
    );
  };

  const handleSaveStaffEdit = async (id: number) => {
    await onUpdateStaff(
      id,
      editStaffName,
      editStaffRole,
      editStaffFte,
      editStaffProjectIds,
    );
    setEditingStaffId(null);
  };

  const handleAddProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    await onAddProject(
      newProjectName,
      newProjStart || undefined,
      newProjEnd || undefined,
    );
    setNewProjectName("");
    setNewProjStart("");
    setNewProjEnd("");
  };

  const startEditProject = (proj: Project) => {
    setEditingProjectId(proj.id!);
    setEditProjectName(proj.name);
    setEditProjStart(proj.startMonth || "");
    setEditProjEnd(proj.endMonth || "");

    const projAssignments = assignments.filter((a) => a.projectId === proj.id);
    const pl = projAssignments.find((a) => a.role === "PL");
    const team = projAssignments
      .filter((a) => a.role !== "PL")
      .map((a) => ({ staffId: a.staffId, role: (a.role as "M" | "A") || "M" }));

    setEditPlStaffId(pl ? pl.staffId : null);
    setEditTeamMembers(team);
  };

  const handleAddTeamMember = (staffId: number) => {
    if (editTeamMembers.some((t) => t.staffId === staffId)) return;
    setEditTeamMembers((prev) => [...prev, { staffId, role: "M" }]);
  };

  const handleRemoveTeamMember = (staffId: number) => {
    setEditTeamMembers((prev) => prev.filter((t) => t.staffId !== staffId));
  };

  const handleToggleMemberRole = (staffId: number) => {
    setEditTeamMembers((prev) =>
      prev.map((t) =>
        t.staffId === staffId ? { ...t, role: t.role === "M" ? "A" : "M" } : t,
      ),
    );
  };

  const handleSaveProjectEdit = async (id: number) => {
    await onUpdateProject(
      id,
      editProjectName,
      editPlStaffId,
      editTeamMembers,
      editProjStart || undefined,
      editProjEnd || undefined,
    );
    setEditingProjectId(null);
  };

  return (
    <div className="space-y-6">
      {/* DATA MANAGEMENT TOOLBAR (IMPORT & EXPORT) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">
            Directory Operations
          </h2>
          <p className="text-xs text-slate-500">
            Import or export your system database in Excel format.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onImportClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 font-medium text-xs rounded-xl border border-slate-200/60 transition cursor-pointer"
            title="Import Excel data"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import</span>
          </button>

          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 font-medium text-xs rounded-xl border border-slate-200/60 transition cursor-pointer"
            title="Export to Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            accept=".xlsx, .xls"
            className="hidden"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* STAFF DIRECTORY CARD */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              <h2 className="font-semibold text-slate-800">
                Staff Members Directory
              </h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
              {staffMembers.length} Total
            </span>
          </div>

          <div className="p-6 space-y-6">
            <form
              onSubmit={handleAddStaff}
              className="flex gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200"
            >
              <input
                type="text"
                placeholder="Staff Name..."
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={newStaffRole}
                onChange={(e) => setNewStaffRole(e.target.value)}
                className="w-24 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="1.0"
                placeholder="FTE"
                value={newStaffFte}
                onChange={(e) => setNewStaffFte(Number(e.target.value))}
                className="w-16 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </form>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3">Name</th>
                    <th className="p-3">Role</th>
                    <th className="p-3 text-center">FTE</th>
                    <th className="p-3">Assigned Projects</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {staffMembers.map((staff) => {
                    const staffAssignments = assignments.filter(
                      (a) => a.staffId === staff.id,
                    );
                    const isEditing = editingStaffId === staff.id;

                    return (
                      <tr
                        key={staff.id}
                        className="hover:bg-slate-50 transition"
                      >
                        {isEditing ? (
                          <>
                            <td className="p-2">
                              <input
                                type="text"
                                value={editStaffName}
                                onChange={(e) =>
                                  setEditStaffName(e.target.value)
                                }
                                className="w-full px-2 py-1 border rounded text-xs focus:ring-2 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={editStaffRole}
                                onChange={(e) =>
                                  setEditStaffRole(e.target.value)
                                }
                                className="w-20 px-1.5 py-1 border border-slate-300 rounded text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                              >
                                {ROLE_OPTIONS.map((role) => (
                                  <option key={role} value={role}>
                                    {role}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                step="0.1"
                                value={editStaffFte}
                                onChange={(e) =>
                                  setEditStaffFte(Number(e.target.value))
                                }
                                className="w-14 px-1 py-1 border rounded text-xs text-center focus:ring-2 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="p-2">
                              <div className="space-y-1.5">
                                <select
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    if (val) handleToggleStaffProject(val);
                                    e.target.value = "";
                                  }}
                                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none"
                                >
                                  <option value="">+ Add Project...</option>
                                  {projects.map((p) => (
                                    <option
                                      key={p.id}
                                      value={p.id}
                                      disabled={editStaffProjectIds.includes(
                                        p.id!,
                                      )}
                                    >
                                      {p.name}
                                    </option>
                                  ))}
                                </select>

                                <div className="flex flex-wrap gap-1">
                                  {editStaffProjectIds.map((pid) => {
                                    const proj = projects.find(
                                      (p) => p.id === pid,
                                    );
                                    if (!proj) return null;
                                    return (
                                      <span
                                        key={pid}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-medium"
                                      >
                                        <span>{proj.name}</span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleToggleStaffProject(pid)
                                          }
                                          className="hover:text-red-600 cursor-pointer"
                                        >
                                          ×
                                        </button>
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                            <td className="p-2 text-right space-x-1">
                              <button
                                onClick={() => handleSaveStaffEdit(staff.id!)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition cursor-pointer"
                                title="Save"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingStaffId(null)}
                                className="p-1 text-slate-400 hover:bg-slate-100 rounded transition cursor-pointer"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-3 font-semibold text-slate-800">
                              {staff.name}
                            </td>
                            <td className="p-3 text-slate-500 font-medium">
                              {staff.designation}
                            </td>
                            <td className="p-3 text-center font-mono">
                              {staff.fte}
                            </td>
                            <td className="p-3">
                              {staffAssignments.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {staffAssignments.map((a) => {
                                    const proj = projects.find(
                                      (p) => p.id === a.projectId,
                                    );
                                    if (!proj) return null;
                                    return (
                                      <span
                                        key={a.id}
                                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700"
                                      >
                                        <span>{proj.name}</span>
                                        <span
                                          className={`px-1 rounded text-[9px] font-bold ${getRoleBadgeClass(a.role)}`}
                                        >
                                          {a.role}
                                        </span>
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">
                                  No active projects
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right space-x-1">
                              <button
                                onClick={() => onOpenBulkCapacityModal(staff)}
                                className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
                                title="Set Workload / Capacity"
                              >
                                <Sliders className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => startEditStaff(staff)}
                                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteStaff(staff.id!)}
                                className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* PROJECTS DIRECTORY CARD */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-slate-800">
                Projects Directory
              </h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
              {projects.length} Total
            </span>
          </div>

          <div className="p-6 space-y-6">
            <form
              onSubmit={handleAddProject}
              className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New Project Name..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Start:
                </span>
                <select
                  value={newProjStart}
                  onChange={(e) => setNewProjStart(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">(Select Start)</option>
                  {MASTER_MONTH_OPTIONS.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.month} {m.year}
                    </option>
                  ))}
                </select>

                <span className="text-slate-500 font-medium flex items-center gap-1 ml-2">
                  End:
                </span>
                <select
                  value={newProjEnd}
                  onChange={(e) => setNewProjEnd(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">(Select End)</option>
                  {MASTER_MONTH_OPTIONS.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.month} {m.year}
                    </option>
                  ))}
                </select>
              </div>
            </form>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3">Project Name</th>
                    <th className="p-3">Timeline Duration</th>
                    <th className="p-3">Assigned PL</th>
                    <th className="p-3">Assigned Team</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {projects.map((proj) => {
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

                    const isEditing = editingProjectId === proj.id;

                    return (
                      <tr
                        key={proj.id}
                        className="hover:bg-slate-50 transition"
                      >
                        {isEditing ? (
                          <>
                            <td className="p-2">
                              <input
                                type="text"
                                value={editProjectName}
                                onChange={(e) =>
                                  setEditProjectName(e.target.value)
                                }
                                className="w-full px-2 py-1 border rounded text-xs focus:ring-2 focus:ring-blue-500"
                              />
                            </td>

                            <td className="p-2">
                              <div className="space-y-1">
                                <select
                                  value={editProjStart}
                                  onChange={(e) =>
                                    setEditProjStart(e.target.value)
                                  }
                                  className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-[11px] focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                >
                                  <option value="">(Start Month)</option>
                                  {MASTER_MONTH_OPTIONS.map((m) => (
                                    <option key={m.key} value={m.key}>
                                      {m.month} {m.year}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  value={editProjEnd}
                                  onChange={(e) =>
                                    setEditProjEnd(e.target.value)
                                  }
                                  className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-[11px] focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                >
                                  <option value="">(End Month)</option>
                                  {MASTER_MONTH_OPTIONS.map((m) => (
                                    <option key={m.key} value={m.key}>
                                      {m.month} {m.year}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </td>

                            <td className="p-2">
                              <select
                                value={editPlStaffId || ""}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setEditPlStaffId(val || null);
                                  if (val) handleRemoveTeamMember(val);
                                }}
                                className="w-full bg-white border border-amber-300 rounded px-2 py-1 text-xs font-semibold text-amber-900 focus:ring-2 focus:ring-amber-500 cursor-pointer"
                              >
                                <option value="">(No PL Assigned)</option>
                                {staffMembers.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="p-2">
                              <div className="space-y-1.5">
                                <select
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    if (val) handleAddTeamMember(val);
                                    e.target.value = "";
                                  }}
                                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none"
                                >
                                  <option value="">+ Add Team Member...</option>
                                  {staffMembers
                                    .filter((s) => s.id !== editPlStaffId)
                                    .map((s) => (
                                      <option
                                        key={s.id}
                                        value={s.id}
                                        disabled={editTeamMembers.some(
                                          (t) => t.staffId === s.id,
                                        )}
                                      >
                                        {s.name}
                                      </option>
                                    ))}
                                </select>

                                <div className="flex flex-wrap gap-1">
                                  {editTeamMembers.map((item) => {
                                    const s = staffMembers.find(
                                      (staff) => staff.id === item.staffId,
                                    );
                                    if (!s) return null;
                                    return (
                                      <span
                                        key={item.staffId}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-medium"
                                      >
                                        <span>{s.name}</span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleToggleMemberRole(item.staffId)
                                          }
                                          className={`px-1 rounded text-[9px] font-bold cursor-pointer ${getRoleBadgeClass(item.role)}`}
                                          title="Click to toggle Member (M) / Assisting (A)"
                                        >
                                          {item.role}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleRemoveTeamMember(item.staffId)
                                          }
                                          className="text-slate-400 hover:text-red-600 font-bold ml-0.5 cursor-pointer"
                                        >
                                          ×
                                        </button>
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>

                            <td className="p-2 text-right space-x-1">
                              <button
                                onClick={() => handleSaveProjectEdit(proj.id!)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition cursor-pointer"
                                title="Save"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingProjectId(null)}
                                className="p-1 text-slate-400 hover:bg-slate-100 rounded transition cursor-pointer"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-3 font-semibold text-slate-800">
                              {proj.name}
                            </td>

                            <td className="p-3">
                              {proj.startMonth && proj.endMonth ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">
                                  <Calendar className="w-3 h-3 text-slate-500" />
                                  <span>
                                    {proj.startMonth.replace("-", " ")}
                                  </span>
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
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium">
                                  <span>{plStaff.name}</span>
                                  <span className="px-1 rounded text-[9px] font-bold bg-yellow-300 text-yellow-900">
                                    PL
                                  </span>
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
                                    if (!staff) return null;
                                    return (
                                      <span
                                        key={a.id}
                                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700"
                                      >
                                        <span>{staff.name}</span>
                                        <span
                                          className={`px-1 rounded text-[9px] font-bold ${getRoleBadgeClass(a.role)}`}
                                        >
                                          {a.role}
                                        </span>
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">
                                  No members
                                </span>
                              )}
                            </td>

                            <td className="p-3 text-right space-x-1">
                              <button
                                onClick={() => startEditProject(proj)}
                                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteProject(proj.id!)}
                                className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
