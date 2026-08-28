import {
  useState,
  type FormEvent,
  type RefObject,
  type ChangeEvent,
} from "react";
import {
  Users,
  FolderKanban,
  Trash2,
  Edit3,
  Plus,
  Check,
  X,
  Calendar,
  Sliders,
  Upload,
  Download,
  AlertTriangle,
  FileSpreadsheet,
  ShieldCheck,
  Database,
  Search,
} from "lucide-react";
import type { Staff, Project, Assignment, RoleCategory } from "../db";
import type { TimelineMonth } from "../constants";
import { MASTER_MONTH_OPTIONS } from "../constants";
import { RoleBadge } from "./common/RoleBadge";
import { FormSelect, FormInput } from "./common/FormControls";
import { Modal } from "./common/Modal";

interface ManageDataProps {
  staffMembers: Staff[];
  projects: Project[];
  assignments: Assignment[];
  roles: RoleCategory[];
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
  onClearAllData: () => Promise<void>;
  onOpenBulkCapacityModal: (staff: Staff) => void;
  onOpenRoleModal: () => void;
  onImportClick: () => void;
  onExport: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const ManageData = ({
  staffMembers,
  projects,
  assignments,
  roles,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onClearAllData,
  onOpenBulkCapacityModal,
  onOpenRoleModal,
  onImportClick,
  onExport,
  fileInputRef,
  onFileChange,
}: ManageDataProps) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [staffSearch, setStaffSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");

  // Dynamic Role Options derived from database
  const roleOptions =
    roles.length > 0
      ? roles.map((r) => ({ label: r.name, value: r.name }))
      : [{ label: "RA", value: "RA" }];

  // Staff Form State
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState(roleOptions[0].value);
  const [newStaffFte, setNewStaffFte] = useState<number | "">(1.0);
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [editStaffName, setEditStaffName] = useState("");
  const [editStaffRole, setEditStaffRole] = useState(roleOptions[0].value);
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
  const [editPlStaffId, setEditPlStaffId] = useState<number | null>(null);
  const [editTeamMembers, setEditTeamMembers] = useState<
    { staffId: number; role: "M" | "A" }[]
  >([]);

  // Handlers
  const handleConfirmClear = async () => {
    await onClearAllData();
    setShowClearConfirm(false);
  };

  const handleAddStaff = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;
    const fteValue = typeof newStaffFte === "number" ? newStaffFte : 1.0;
    await onAddStaff(
      newStaffName,
      newStaffRole || roleOptions[0].value,
      fteValue,
    );
    setNewStaffName("");
    setNewStaffRole(roleOptions[0].value);
    setNewStaffFte(1.0);
  };

  const startEditStaff = (staff: Staff) => {
    setEditingStaffId(staff.id!);
    setEditStaffName(staff.name);
    setEditStaffRole(staff.designation || roleOptions[0].value);
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

  const filteredStaff = staffMembers.filter(
    (staff) =>
      staff.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
      staff.designation?.toLowerCase().includes(staffSearch.toLowerCase()),
  );

  const filteredProjects = projects.filter((proj) =>
    proj.name.toLowerCase().includes(projectSearch.toLowerCase()),
  );

  return (
    <div className="space-y-6 max-w-full mx-auto">
      {/* TOOLBAR PANEL */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-semibold text-slate-900">
                Data Management Center
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Manage database records, bulk import/export configuration
              datasets, and define role categories.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              onClick={onOpenRoleModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200/60 transition cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Roles
            </button>

            <a
              href="/staff_allocation_template.xlsx"
              download="staff_allocation_template.xlsx"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200/60 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />{" "}
              Template
            </a>

            <button
              onClick={onImportClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-600" /> Import
            </button>

            <button
              onClick={onExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" /> Export
            </button>

            <button
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100/80 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200/60 transition cursor-pointer ml-auto lg:ml-0"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Clear Data
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
      </div>

      {/* CONFIRM CLEAR DATA MODAL */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Confirm Clear All Data"
        icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Are you sure you want to clear all data? This action will
            permanently remove all staff members, projects, and assignments from
            your local database.
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmClear}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All Data
            </button>
          </div>
        </div>
      </Modal>

      {/* DIRECTORY GRID */}
      <div className="grid grid-cols-1 gap-6">
        {/* STAFF DIRECTORY */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">
                  Staff Members Directory
                </h3>
                <p className="text-[11px] text-slate-500">
                  Manage personnel details, role assignments, and base FTE
                  capacity
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter staff..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-36 sm:w-48"
                />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                {staffMembers.length} Total
              </span>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* ADD STAFF FORM */}
            <form
              onSubmit={handleAddStaff}
              className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 flex flex-wrap lg:flex-nowrap items-center gap-2.5"
            >
              <div className="flex-1 min-w-[180px]">
                <FormInput
                  placeholder="New Staff Name..."
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="bg-white"
                />
              </div>

              <div className="w-full sm:w-auto min-w-[120px]">
                <FormSelect
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  options={roleOptions}
                  className="bg-white"
                />
              </div>

              <div className="w-full sm:w-auto flex items-center gap-1.5">
                <FormInput
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="1.0"
                  placeholder="1.0"
                  value={newStaffFte}
                  onChange={(e) =>
                    setNewStaffFte(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="w-20 bg-white text-center font-mono"
                />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none shrink-0 pr-1">
                  FTE
                </span>
              </div>

              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer shrink-0 w-full sm:w-auto shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Staff</span>
              </button>
            </form>

            <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                    <th className="p-3">Name</th>
                    <th className="p-3">Designation / Role</th>
                    <th className="p-3 text-center">FTE</th>
                    <th className="p-3">Assigned Projects</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-4 text-center text-slate-400 italic"
                      >
                        No staff members found matching search filter.
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((staff) => {
                      const staffAssignments = assignments.filter(
                        (a) => a.staffId === staff.id,
                      );
                      const isEditing = editingStaffId === staff.id;

                      return (
                        <tr
                          key={staff.id}
                          className="hover:bg-slate-50/60 transition-colors"
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
                                  options={roleOptions}
                                  className="w-28"
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
                                  className="w-16 text-center font-mono"
                                />
                              </td>
                              <td className="p-2">
                                <FormSelect
                                  value=""
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    if (val) handleToggleStaffProject(val);
                                    e.target.value = "";
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
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-[11px] font-medium"
                                      >
                                        {proj.name}
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleToggleStaffProject(pid)
                                          }
                                          className="hover:text-red-600 cursor-pointer ml-0.5 font-bold"
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
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                                  title="Save Changes"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingStaffId(null)}
                                  className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
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
                              <td className="p-3 text-slate-600">
                                <span className="inline-block px-2 py-0.5 bg-slate-100 border border-slate-200/60 rounded text-[11px] font-medium text-slate-700">
                                  {staff.designation}
                                </span>
                              </td>
                              <td className="p-3 text-center font-mono font-medium text-slate-700">
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
                                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-700"
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
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                  title="Set Monthly Capacity"
                                >
                                  <Sliders className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => startEditStaff(staff)}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Staff Member"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onDeleteStaff(staff.id!)}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Staff Member"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
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

        {/* PROJECTS DIRECTORY */}
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
                  Manage active projects, schedules, project leaders, and
                  assigned team members
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter projects..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-36 sm:w-48"
                />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                {projects.length} Total
              </span>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* ADD PROJECT FORM */}
            <form
              onSubmit={handleAddProject}
              className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 flex flex-wrap lg:flex-nowrap items-center gap-2.5"
            >
              <div className="flex-1 min-w-[180px]">
                <FormInput
                  placeholder="New Project Name..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="bg-white"
                />
              </div>

              <div className="w-full sm:w-auto min-w-[130px]">
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

              <div className="w-full sm:w-auto min-w-[130px]">
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

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer shrink-0 w-full sm:w-auto shadow-xs"
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
                    <th className="p-3 text-right">Actions</th>
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
                      const projAssignments = assignments.filter(
                        (a) => a.projectId === proj.id,
                      );
                      const plAssignment = projAssignments.find(
                        (a) => a.role === "PL",
                      );
                      const plStaff = plAssignment
                        ? staffMembers.find(
                            (s) => s.id === plAssignment.staffId,
                          )
                        : null;
                      const teamAssignments = projAssignments.filter(
                        (a) => a.role !== "PL",
                      );
                      const isEditing = editingProjectId === proj.id;

                      return (
                        <tr
                          key={proj.id}
                          className="hover:bg-slate-50/60 transition-colors"
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
                                  onChange={(e) =>
                                    setEditProjEnd(e.target.value)
                                  }
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
                                      {
                                        label: "+ Add Team Member...",
                                        value: "",
                                      },
                                      ...staffMembers
                                        .filter((s) => s.id !== editPlStaffId)
                                        .flatMap((s) => {
                                          const isAssigned =
                                            editTeamMembers.some(
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
                                                  (t) =>
                                                    t.staffId !== item.staffId,
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
                              <td className="p-2 text-right space-x-1">
                                <button
                                  onClick={() =>
                                    handleSaveProjectEdit(proj.id!)
                                  }
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                                  title="Save Changes"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingProjectId(null)}
                                  className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
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
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200/80 text-[11px] font-medium">
                                    <Calendar className="w-3 h-3 text-slate-400" />
                                    <span>
                                      {proj.startMonth.replace("-", " ")}
                                    </span>
                                    <span className="text-slate-400">→</span>
                                    <span>
                                      {proj.endMonth.replace("-", " ")}
                                    </span>
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
                              <td className="p-3 text-right space-x-1">
                                <button
                                  onClick={() => startEditProject(proj)}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Project"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onDeleteProject(proj.id!)}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Project"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
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
      </div>
    </div>
  );
};
