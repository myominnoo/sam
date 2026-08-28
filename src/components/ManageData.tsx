import {
  useState,
  type FormEvent,
  type RefObject,
  type ChangeEvent,
} from "react";
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
import { RoleBadge } from "./common/RoleBadge";
import { FormSelect, FormInput } from "./common/FormControls";

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

const ROLE_OPTIONS = [
  { label: "RA", value: "RA" },
  { label: "SRA", value: "SRA" },
  { label: "ADE", value: "ADE" },
  { label: "DOR", value: "DOR" },
];

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
  // Form state
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("RA");
  const [newStaffFte, setNewStaffFte] = useState(1.0);
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [editStaffName, setEditStaffName] = useState("");
  const [editStaffRole, setEditStaffRole] = useState("RA");
  const [editStaffFte, setEditStaffFte] = useState(1.0);
  const [editStaffProjectIds, setEditStaffProjectIds] = useState<number[]>([]);

  const [newProjectName, setNewProjectName] = useState("");
  const [newProjStart, setNewProjStart] = useState("");
  const [newProjEnd, setNewProjEnd] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjStart, setEditProjStart] = useState("");
  const [editProjEnd, setEditProjEnd] = useState("");
  const [editPlStaffId, setEditPlStaffId] = useState<number | null>(null);
  const [editTeamMembers, setEditTeamMembers] = useState<
    { staffId: number; role: "M" | "A" }[]
  >([]);

  // Staff handlers
  const handleAddStaff = async (e: FormEvent<HTMLFormElement>) => {
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
      ROLE_OPTIONS.some((r) => r.value === staff.designation)
        ? staff.designation
        : "RA",
    );
    setEditStaffFte(staff.fte);
    setEditStaffProjectIds(
      assignments.filter((a) => a.staffId === staff.id).map((a) => a.projectId),
    );
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

  // Project handlers
  const handleAddProject = async (e: FormEvent<HTMLFormElement>) => {
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
      {/* OPERATIONS TOOLBAR */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between flex-wrap gap-3">
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
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" /> Import
          </button>
          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 font-medium text-xs rounded-xl border border-slate-200/60 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export
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

      {/* STACKED DIRECTORIES CONTAINER (SINGLE COLUMN) */}
      <div className="flex flex-col gap-8 w-full">
        {/* STAFF DIRECTORY */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full">
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
              className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap lg:flex-nowrap items-center gap-2.5 w-full"
            >
              {/* STAFF NAME INPUT */}
              <div className="flex-1 min-w-[200px]">
                <FormInput
                  placeholder="Staff Name..."
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="bg-white"
                />
              </div>

              {/* ROLE SELECT */}
              <div className="w-full sm:w-auto min-w-[120px]">
                <FormSelect
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  options={ROLE_OPTIONS}
                  className="bg-white"
                />
              </div>

              {/* FTE INPUT + INLINE LABEL GROUP */}
              <div className="w-full sm:w-auto flex items-center gap-1.5">
                <FormInput
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="1.0"
                  placeholder="1.0"
                  value={newStaffFte || ""}
                  onChange={(e) => setNewStaffFte(Number(e.target.value))}
                  className="w-20 bg-white text-center font-mono"
                />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider select-none shrink-0 pr-1">
                  FTE
                </span>
              </div>

              {/* ADD BUTTON */}
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer shrink-0 w-full sm:w-auto"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add</span>
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
                              <FormInput
                                value={editStaffName}
                                onChange={(e) =>
                                  setEditStaffName(e.target.value)
                                }
                              />
                            </td>
                            <td className="p-2">
                              <FormSelect
                                value={editStaffRole}
                                onChange={(e) =>
                                  setEditStaffRole(e.target.value)
                                }
                                options={ROLE_OPTIONS}
                                className="w-20"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <FormInput
                                type="number"
                                step="0.1"
                                value={editStaffFte}
                                onChange={(e) =>
                                  setEditStaffFte(Number(e.target.value))
                                }
                                className="w-14 text-center"
                              />
                            </td>
                            <td className="p-2">
                              <FormSelect
                                value=""
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  if (val) handleToggleStaffProject(val);
                                }}
                                options={[
                                  { label: "+ Add Project...", value: "" },
                                  ...projects.map((p) => ({
                                    label: p.name,
                                    value: p.id!,
                                    disabled: editStaffProjectIds.includes(
                                      p.id!,
                                    ),
                                  })),
                                ]}
                              />
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {editStaffProjectIds.map((pid) => {
                                  const proj = projects.find(
                                    (p) => p.id === pid,
                                  );
                                  return proj ? (
                                    <span
                                      key={pid}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-medium"
                                    >
                                      {proj.name}
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
                                  ) : null;
                                })}
                              </div>
                            </td>
                            <td className="p-2 text-right space-x-1">
                              <button
                                onClick={() => handleSaveStaffEdit(staff.id!)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingStaffId(null)}
                                className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
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
                                    return proj ? (
                                      <span
                                        key={a.id}
                                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700"
                                      >
                                        <span>{proj.name}</span>
                                        <RoleBadge role={a.role} />
                                      </span>
                                    ) : null;
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
                                className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
                                title="Set Capacity"
                              >
                                <Sliders className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => startEditStaff(staff)}
                                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteStaff(staff.id!)}
                                className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
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

        {/* PROJECTS DIRECTORY */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full">
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
              className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap lg:flex-nowrap items-center gap-2.5 w-full"
            >
              {/* PROJECT NAME INPUT */}
              <div className="flex-1 min-w-[200px]">
                <FormInput
                  placeholder="New Project Name..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="bg-white"
                />
              </div>

              {/* START MONTH SELECT */}
              <div className="w-full sm:w-auto min-w-[140px]">
                <FormSelect
                  value={newProjStart}
                  onChange={(e) => setNewProjStart(e.target.value)}
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

              {/* END MONTH SELECT */}
              <div className="w-full sm:w-auto min-w-[140px]">
                <FormSelect
                  value={newProjEnd}
                  onChange={(e) => setNewProjEnd(e.target.value)}
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

              {/* ADD BUTTON */}
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer shrink-0 w-full sm:w-auto"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add</span>
              </button>
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
                              <FormInput
                                value={editProjectName}
                                onChange={(e) =>
                                  setEditProjectName(e.target.value)
                                }
                              />
                            </td>
                            <td className="p-2 space-y-1">
                              <FormSelect
                                value={editProjStart}
                                onChange={(e) =>
                                  setEditProjStart(e.target.value)
                                }
                                options={[
                                  { label: "(Start Month)", value: "" },
                                  ...MASTER_MONTH_OPTIONS.map((m) => ({
                                    label: `${m.month} ${m.year}`,
                                    value: m.key,
                                  })),
                                ]}
                              />
                              <FormSelect
                                value={editProjEnd}
                                onChange={(e) => setEditProjEnd(e.target.value)}
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
                              <FormSelect
                                value=""
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  if (
                                    val &&
                                    !editTeamMembers.some(
                                      (t) => t.staffId === val,
                                    )
                                  ) {
                                    setEditTeamMembers((prev) => [
                                      ...prev,
                                      { staffId: val, role: "M" },
                                    ]);
                                  }
                                }}
                                options={[
                                  { label: "+ Add Team Member...", value: "" },
                                  ...staffMembers
                                    .filter((s) => s.id !== editPlStaffId)
                                    .map((s) => ({
                                      label: s.name,
                                      value: s.id!,
                                      disabled: editTeamMembers.some(
                                        (t) => t.staffId === s.id,
                                      ),
                                    })),
                                ]}
                              />
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {editTeamMembers.map((item) => {
                                  const s = staffMembers.find(
                                    (staff) => staff.id === item.staffId,
                                  );
                                  return s ? (
                                    <span
                                      key={item.staffId}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-medium"
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
                                        className="text-slate-400 hover:text-red-600 cursor-pointer font-bold ml-0.5"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            </td>
                            <td className="p-2 text-right space-x-1">
                              <button
                                onClick={() => handleSaveProjectEdit(proj.id!)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingProjectId(null)}
                                className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
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
                                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700"
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
                            <td className="p-3 text-right space-x-1">
                              <button
                                onClick={() => startEditProject(proj)}
                                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteProject(proj.id!)}
                                className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
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
