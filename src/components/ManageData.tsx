import { useState, useRef, type ChangeEvent } from "react";
import {
  Users,
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Download,
  Shield,
  Sliders,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";

import type { Staff, Project, Assignment, RoleCategory } from "../db";
import type { TimelineMonth } from "../constants";
import type { ToastType } from "./common/Toast";
import { FormInput, FormSelect } from "./common/FormControls";

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
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
  showToast?: (message: string, type?: ToastType) => void;
}

export const ManageData = ({
  staffMembers,
  projects,
  assignments,
  roles,
  timelineMonths,
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
  showToast,
}: ManageDataProps) => {
  // Staff Form State
  const [staffName, setStaffName] = useState("");
  const [staffDesignation, setStaffDesignation] = useState("");
  const [staffFTE, setStaffFTE] = useState<number>(1.0);
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);

  // Project Form State
  const [projectName, setProjectName] = useState("");
  const [projectStartMonth, setProjectStartMonth] = useState("");
  const [projectEndMonth, setProjectEndMonth] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [projectPLId, setProjectPLId] = useState<number | null>(null);
  const [projectTeamMembers, setProjectTeamMembers] = useState<
    { staffId: number; role: "M" | "A" }[]
  >([]);

  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  // Month select options
  const monthOptions = [
    { label: "Select Month", value: "" },
    ...timelineMonths.map((m) => ({
      label: `${m.shortMonth} ${m.year}`,
      value: m.key,
    })),
  ];

  // --- Staff Operations ---
  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) {
      showToast?.("Staff name is required.", "warning");
      return;
    }

    try {
      if (editingStaffId) {
        await onUpdateStaff(
          editingStaffId,
          staffName.trim(),
          staffDesignation.trim(),
          staffFTE,
          selectedProjectIds,
        );
        setEditingStaffId(null);
      } else {
        await onAddStaff(staffName.trim(), staffDesignation.trim(), staffFTE);
      }
      resetStaffForm();
    } catch (err: any) {
      showToast?.(err?.message || "Failed to save staff record.", "error");
    }
  };

  const startEditStaff = (staff: Staff) => {
    if (!staff.id) return;
    setEditingStaffId(staff.id);
    setStaffName(staff.name);
    setStaffDesignation(staff.designation || "");
    setStaffFTE(staff.fte ?? 1.0);

    const assignedProjs = assignments
      .filter((a) => a.staffId === staff.id)
      .map((a) => a.projectId);
    setSelectedProjectIds(assignedProjs);
  };

  const resetStaffForm = () => {
    setEditingStaffId(null);
    setStaffName("");
    setStaffDesignation("");
    setStaffFTE(1.0);
    setSelectedProjectIds([]);
  };

  // --- Project Operations ---
  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      showToast?.("Project name is required.", "warning");
      return;
    }

    if (projectStartMonth && projectEndMonth) {
      const sIdx = timelineMonths.findIndex((m) => m.key === projectStartMonth);
      const eIdx = timelineMonths.findIndex((m) => m.key === projectEndMonth);
      if (sIdx !== -1 && eIdx !== -1 && sIdx > eIdx) {
        showToast?.(
          "Project start month must be prior to or equal to end month.",
          "warning",
        );
        return;
      }
    }

    try {
      if (editingProjectId) {
        await onUpdateProject(
          editingProjectId,
          projectName.trim(),
          projectPLId,
          projectTeamMembers,
          projectStartMonth || undefined,
          projectEndMonth || undefined,
        );
        setEditingProjectId(null);
      } else {
        await onAddProject(
          projectName.trim(),
          projectStartMonth || undefined,
          projectEndMonth || undefined,
        );
      }
      resetProjectForm();
    } catch (err: any) {
      showToast?.(err?.message || "Failed to save project record.", "error");
    }
  };

  const startEditProject = (project: Project) => {
    if (!project.id) return;
    setEditingProjectId(project.id);
    setProjectName(project.name);
    setProjectStartMonth(project.startMonth || "");
    setProjectEndMonth(project.endMonth || "");

    const projAssignments = assignments.filter(
      (a) => a.projectId === project.id,
    );
    const pl = projAssignments.find((a) => a.role === "PL");
    setProjectPLId(pl ? pl.staffId : null);

    const members = projAssignments
      .filter((a) => a.role === "M" || a.role === "A")
      .map((a) => ({ staffId: a.staffId, role: a.role as "M" | "A" }));
    setProjectTeamMembers(members);
  };

  const resetProjectForm = () => {
    setEditingProjectId(null);
    setProjectName("");
    setProjectStartMonth("");
    setProjectEndMonth("");
    setProjectPLId(null);
    setProjectTeamMembers([]);
  };

  const toggleProjectTeamMember = (staffId: number) => {
    setProjectTeamMembers((prev) => {
      const exists = prev.find((m) => m.staffId === staffId);
      if (exists) {
        return prev.filter((m) => m.staffId !== staffId);
      } else {
        return [...prev, { staffId, role: "M" }];
      }
    });
  };

  const setTeamMemberRole = (staffId: number, role: "M" | "A") => {
    setProjectTeamMembers((prev) =>
      prev.map((m) => (m.staffId === staffId ? { ...m, role } : m)),
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Utility Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenRoleModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Manage Roles ({roles.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            accept=".xlsx, .xls"
            className="hidden"
          />
          <button
            type="button"
            onClick={onImportClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span>Import Excel</span>
          </button>

          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          {!isConfirmingClear ? (
            <button
              type="button"
              onClick={() => setIsConfirmingClear(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Database</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 p-1 rounded-lg text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 ml-1" />
              <span className="text-rose-700 font-medium">Are you sure?</span>
              <button
                type="button"
                onClick={async () => {
                  await onClearAllData();
                  setIsConfirmingClear(false);
                }}
                className="px-2 py-0.5 bg-rose-600 text-white font-bold rounded hover:bg-rose-700 transition cursor-pointer"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingClear(false)}
                className="px-2 py-0.5 bg-slate-200 text-slate-700 font-bold rounded hover:bg-slate-300 transition cursor-pointer"
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff Management Column */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-800 text-base">
              Staff Members ({staffMembers.length})
            </h2>
          </div>

          <form
            onSubmit={handleStaffSubmit}
            className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs"
          >
            <div className="font-semibold text-slate-700">
              {editingStaffId ? "Edit Staff Record" : "Add New Staff Member"}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <FormInput
                placeholder="Name *"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
              />
              <FormInput
                placeholder="Designation"
                value={staffDesignation}
                onChange={(e) => setStaffDesignation(e.target.value)}
              />
              <FormInput
                type="number"
                step="0.1"
                min="0"
                max="3"
                placeholder="FTE (e.g. 1.0)"
                value={staffFTE}
                onChange={(e) => setStaffFTE(parseFloat(e.target.value) || 0)}
              />
            </div>

            {editingStaffId && (
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <span className="font-medium text-slate-600">
                  Assign Projects:
                </span>
                <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                  {projects.map((p) => {
                    const isChecked = selectedProjectIds.includes(p.id!);
                    return (
                      <label
                        key={p.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedProjectIds((prev) =>
                                prev.filter((id) => id !== p.id),
                              );
                            } else {
                              setSelectedProjectIds((prev) => [...prev, p.id!]);
                            }
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-slate-700 font-medium">
                          {p.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              {editingStaffId && (
                <button
                  type="button"
                  onClick={resetStaffForm}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1 cursor-pointer transition"
              >
                {editingStaffId ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>{editingStaffId ? "Update Staff" : "Add Staff"}</span>
              </button>
            </div>
          </form>

          {/* Staff List */}
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {staffMembers.map((staff) => (
              <div
                key={staff.id}
                className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 transition"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-800 text-xs flex items-center gap-2">
                    <span>{staff.name}</span>
                    <span className="px-1.5 py-0.2 bg-slate-200 text-slate-600 rounded text-[10px]">
                      FTE: {staff.fte ?? 1.0}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {staff.designation || "No designation specified"}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenBulkCapacityModal(staff)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                    title="Set Monthly Capacity"
                  >
                    <Sliders className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => startEditStaff(staff)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                    title="Edit Staff"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => staff.id && onDeleteStaff(staff.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Delete Staff"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Management Column */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-800 text-base">
              Projects ({projects.length})
            </h2>
          </div>

          <form
            onSubmit={handleProjectSubmit}
            className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs"
          >
            <div className="font-semibold text-slate-700">
              {editingProjectId ? "Edit Project Record" : "Add New Project"}
            </div>

            <FormInput
              placeholder="Project Name *"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-2">
              <FormSelect
                label="Start Month:"
                value={projectStartMonth}
                onChange={(e) => setProjectStartMonth(e.target.value)}
                options={monthOptions}
              />
              <FormSelect
                label="End Month:"
                value={projectEndMonth}
                onChange={(e) => setProjectEndMonth(e.target.value)}
                options={monthOptions}
              />
            </div>

            {editingProjectId && (
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <FormSelect
                  label="Project Lead (PL):"
                  value={projectPLId || ""}
                  onChange={(e) =>
                    setProjectPLId(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  options={[
                    { label: "None Assigned", value: "" },
                    ...staffMembers.map((s) => ({
                      label: s.name,
                      value: s.id!,
                    })),
                  ]}
                />

                <div className="space-y-1.5">
                  <span className="font-medium text-slate-600">
                    Team Members & Roles:
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {staffMembers
                      .filter((s) => s.id !== projectPLId)
                      .map((s) => {
                        const member = projectTeamMembers.find(
                          (m) => m.staffId === s.id,
                        );
                        const isAssigned = !!member;

                        return (
                          <div
                            key={s.id}
                            className="flex items-center justify-between bg-white p-2 rounded border border-slate-200"
                          >
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isAssigned}
                                onChange={() => toggleProjectTeamMember(s.id!)}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-slate-700 font-medium">
                                {s.name}
                              </span>
                            </label>

                            {isAssigned && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setTeamMemberRole(s.id!, "M")}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                                    member.role === "M"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                  }`}
                                >
                                  Member (M)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTeamMemberRole(s.id!, "A")}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                                    member.role === "A"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                  }`}
                                >
                                  Advisor (A)
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              {editingProjectId && (
                <button
                  type="button"
                  onClick={resetProjectForm}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1 cursor-pointer transition"
              >
                {editingProjectId ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>
                  {editingProjectId ? "Update Project" : "Add Project"}
                </span>
              </button>
            </div>
          </form>

          {/* Project List */}
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {projects.map((proj) => {
              const projAssignments = assignments.filter(
                (a) => a.projectId === proj.id,
              );
              const plAssignment = projAssignments.find((a) => a.role === "PL");
              const plStaff = plAssignment
                ? staffMembers.find((s) => s.id === plAssignment.staffId)
                : null;

              return (
                <div
                  key={proj.id}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 transition"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-800 text-xs">
                      {proj.name}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>PL: {plStaff ? plStaff.name : "Unassigned"}</span>
                      <span>•</span>
                      <span>
                        {proj.startMonth && proj.endMonth
                          ? `${proj.startMonth} to ${proj.endMonth}`
                          : "Full Timeline"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEditProject(proj)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                      title="Edit Project"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => proj.id && onDeleteProject(proj.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
