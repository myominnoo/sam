import { useState, useMemo, type FormEvent } from "react";
import {
  Users,
  Search,
  Plus,
  Sliders,
  Edit3,
  Trash2,
  Check,
  X,
} from "lucide-react";
import type { Staff, Project, Assignment } from "../../db";
import { RoleBadge } from "../common/RoleBadge";
import { FormInput, FormSelect } from "../common/FormControls";
import type { ToastType } from "../common/Toast";

interface StaffDirectoryProps {
  staffMembers: Staff[];
  projects: Project[];
  assignments: Assignment[];
  roleOptions: { label: string; value: string }[];
  onAddStaff: (name: string, designation: string, fte: number) => Promise<void>;
  onUpdateStaff: (
    id: number,
    name: string,
    designation: string,
    fte: number,
    assignedProjectIds: number[],
  ) => Promise<void>;
  onRequestDelete: (staff: Staff) => void;
  onOpenBulkCapacityModal: (staff: Staff) => void;
  showToast: (message: string, type?: ToastType) => void;
}

export const StaffDirectory = ({
  staffMembers,
  projects,
  assignments,
  roleOptions,
  onAddStaff,
  onUpdateStaff,
  onRequestDelete,
  onOpenBulkCapacityModal,
  showToast,
}: StaffDirectoryProps) => {
  const [search, setSearch] = useState("");

  // New Staff Form State
  const [name, setName] = useState("");
  const [role, setRole] = useState(roleOptions[0]?.value || "");
  const [fte, setFte] = useState<number | "">(1.0);

  // Edit Staff State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editFte, setEditFte] = useState(1.0);
  const [editProjectIds, setEditProjectIds] = useState<number[]>([]);

  const filteredStaff = useMemo(
    () =>
      staffMembers.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.designation?.toLowerCase().includes(search.toLowerCase()),
      ),
    [staffMembers, search],
  );

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Please enter a staff name.", "warning");
      return;
    }
    const fteVal = typeof fte === "number" ? fte : 1.0;
    await onAddStaff(name, role || roleOptions[0]?.value, fteVal);
    showToast(`Added staff member "${name}".`, "success");
    setName("");
    setRole(roleOptions[0]?.value || "");
    setFte(1.0);
  };

  const startEdit = (staff: Staff) => {
    setEditingId(staff.id!);
    setEditName(staff.name);
    setEditRole(staff.designation || roleOptions[0]?.value);
    setEditFte(staff.fte);
    setEditProjectIds(
      assignments.filter((a) => a.staffId === staff.id).map((a) => a.projectId),
    );
  };

  const handleSaveEdit = async (id: number) => {
    await onUpdateStaff(id, editName, editRole, editFte, editProjectIds);
    setEditingId(null);
    showToast("Staff member updated.", "success");
  };

  return (
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
              Manage personnel details, role assignments, and base FTE capacity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-36 sm:w-48"
            />
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
            {staffMembers.length} Total
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
              placeholder="New Staff Name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="w-full sm:w-auto min-w-[120px]">
            <FormSelect
              value={role}
              onChange={(e) => setRole(e.target.value)}
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
              value={fte}
              onChange={(e) =>
                setFte(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-20 bg-white text-center font-mono"
            />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none shrink-0 pr-1">
              FTE
            </span>
          </div>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer shrink-0 w-full sm:w-auto shadow-xs"
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
                <th className="p-3 text-right whitespace-nowrap w-[1%]">
                  Actions
                </th>
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
                  const isEditing = editingId === staff.id;
                  const staffAssignments = assignments.filter(
                    (a) => a.staffId === staff.id,
                  );

                  return (
                    <tr
                      key={staff.id}
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
                          <td className="p-2">
                            <FormSelect
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value)}
                              options={roleOptions}
                              className="w-28"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <FormInput
                              type="number"
                              step="0.1"
                              value={editFte}
                              onChange={(e) =>
                                setEditFte(Number(e.target.value))
                              }
                              className="w-16 text-center font-mono"
                            />
                          </td>
                          <td className="p-2">
                            <FormSelect
                              value=""
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (val) {
                                  setEditProjectIds((prev) =>
                                    prev.includes(val)
                                      ? prev.filter((id) => id !== val)
                                      : [...prev, val],
                                  );
                                }
                                e.target.value = "";
                              }}
                              options={[
                                { label: "+ Add Project...", value: "" },
                                ...projects.map((p) => ({
                                  label: p.name,
                                  value: p.id!,
                                  disabled: editProjectIds.includes(p.id!),
                                })),
                              ]}
                            />
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {editProjectIds.map((pid) => {
                                const proj = projects.find((p) => p.id === pid);
                                return proj ? (
                                  <span
                                    key={pid}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-[11px] font-medium"
                                  >
                                    {proj.name}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditProjectIds((prev) =>
                                          prev.filter((id) => id !== pid),
                                        )
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
                          <td className="p-2 text-right whitespace-nowrap w-[1%]">
                            <div className="flex items-center justify-end gap-0.5">
                              <button
                                onClick={() => handleSaveEdit(staff.id!)}
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
                          <td className="p-3 text-right whitespace-nowrap w-[1%]">
                            <div className="flex items-center justify-end gap-0.5">
                              <button
                                onClick={() => onOpenBulkCapacityModal(staff)}
                                className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                              >
                                <Sliders className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => startEdit(staff)}
                                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onRequestDelete(staff)}
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
