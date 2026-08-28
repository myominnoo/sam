import { useState, useMemo, type FormEvent } from "react";
import { Users, Plus, Sliders, Check, X } from "lucide-react";
import type { Staff, Project, Assignment } from "../../db";
import { RoleBadge } from "../common/RoleBadge";
import { FormInput, FormSelect } from "../common/FormControls";
import type { ToastType } from "../common/Toast";
import { ActionCard } from "../common/ActionCard";
import { DirectoryCard } from "../common/DirectoryCard";
import { TableRowActions } from "../common/TableRowActions";

interface StaffDirectoryProps {
  staffMembers: Staff[];
  projects: Project[];
  assignments: Assignment[];
  designationOptions: { label: string; value: string }[];
  onAddStaff: (name: string, designation: string, fte: number) => Promise<void>;
  onToggleStaffActive: (staff: Staff) => Promise<void>;
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
  designationOptions,
  onAddStaff,
  onToggleStaffActive,
  onUpdateStaff,
  onRequestDelete,
  onOpenBulkCapacityModal,
  showToast,
}: StaffDirectoryProps) => {
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [designation, setDesignation] = useState(
    designationOptions[0]?.value || "",
  );
  const [fte, setFte] = useState<number | "">(1.0);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesignation, setEditDesignation] = useState("");
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
    await onAddStaff(name, designation || designationOptions[0]?.value, fteVal);
    setName("");
    setDesignation(designationOptions[0]?.value || "");
    setFte(1.0);
  };

  const startEdit = (staff: Staff) => {
    setEditingId(staff.id!);
    setEditName(staff.name);
    setEditDesignation(staff.designation || designationOptions[0]?.value);
    setEditFte(staff.fte);
    setEditProjectIds(
      assignments.filter((a) => a.staffId === staff.id).map((a) => a.projectId),
    );
  };

  const handleSaveEdit = async (id: number) => {
    await onUpdateStaff(id, editName, editDesignation, editFte, editProjectIds);
    setEditingId(null);
  };

  return (
    <DirectoryCard
      icon={<Users className="w-4 h-4" />}
      title="Staff Members Directory"
      description="Manage personnel details, staff position designations, and active state"
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Filter staff..."
      itemCount={staffMembers.length}
      itemCountLabel="Members"
      actionForm={
        <ActionCard accentColorClass="border-l-indigo-500">
          <form
            onSubmit={handleAdd}
            className="flex flex-wrap lg:flex-nowrap items-center gap-2.5 w-full"
          >
            <div className="flex-1 min-w-[180px]">
              <FormInput
                placeholder="New Staff Name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500"
              />
            </div>

            <div className="w-full sm:w-auto min-w-[140px]">
              <FormSelect
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                options={designationOptions}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-indigo-500 [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-800 dark:[&>option]:text-white"
              />
            </div>

            <div className="w-full sm:w-auto flex items-center gap-1.5 bg-slate-800 border border-slate-700/80 rounded-lg px-2.5 py-1 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-xs">
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
                className="!bg-transparent !border-0 !shadow-none !ring-0 p-0 w-10 !text-white font-mono font-semibold text-xs text-center focus:outline-none placeholder:text-slate-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none shrink-0 border-l border-slate-700/80 pl-2 py-0.5">
                FTE
              </span>
            </div>

            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 w-full sm:w-auto shadow-xs active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Staff</span>
            </button>
          </form>
        </ActionCard>
      }
      tableContent={
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-700/80">
              <th className="p-3">Status</th>
              <th className="p-3">Name</th>
              <th className="p-3">Designation</th>
              <th className="p-3 text-center">FTE</th>
              <th className="p-3">Assigned Projects</th>
              <th className="p-3 text-right whitespace-nowrap w-[1%]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredStaff.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-4 text-center text-slate-400 dark:text-slate-500 italic"
                >
                  No staff members found matching search filter.
                </td>
              </tr>
            ) : (
              filteredStaff.map((staff) => {
                const isActive = staff.isActive !== false;
                const isEditing = editingId === staff.id;
                const staffAssignments = assignments.filter(
                  (a) => a.staffId === staff.id,
                );

                return (
                  <tr
                    key={staff.id}
                    className={`transition-colors ${
                      isActive
                        ? "hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                        : "bg-slate-50/40 dark:bg-slate-800/20 text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60"
                            : "bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300/80 dark:border-slate-700"
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
                          <FormSelect
                            value={editDesignation}
                            onChange={(e) => setEditDesignation(e.target.value)}
                            options={designationOptions}
                            className="w-28"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <FormInput
                            type="number"
                            step="0.1"
                            value={editFte}
                            onChange={(e) => setEditFte(Number(e.target.value))}
                            className="w-16 text-center font-mono text-slate-900 dark:text-slate-100 dark:[color-scheme:dark]"
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
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium"
                                >
                                  {proj.name}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditProjectIds((prev) =>
                                        prev.filter((id) => id !== pid),
                                      )
                                    }
                                    className="hover:text-red-600 dark:hover:text-red-400 cursor-pointer ml-0.5 font-bold"
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
                              className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
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
                              ? "text-slate-800 dark:text-slate-200"
                              : "text-slate-400 dark:text-slate-500 line-through"
                          }`}
                        >
                          {staff.name}
                        </td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded text-[11px] font-medium text-slate-700 dark:text-slate-300">
                            {staff.designation}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono font-medium text-slate-700 dark:text-slate-300">
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
                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300"
                                  >
                                    <span>{proj.name}</span>
                                    <RoleBadge role={a.role} />
                                  </span>
                                ) : null;
                              })}
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">
                              No active projects
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right whitespace-nowrap w-[1%]">
                          <TableRowActions
                            isActive={isActive}
                            onStartEdit={() => startEdit(staff)}
                            onRequestDelete={() => onRequestDelete(staff)}
                            onToggleActive={() => onToggleStaffActive(staff)}
                            deactivateTitle="Deactivate Staff"
                            activateTitle="Activate Staff"
                            extraActions={
                              <button
                                onClick={() => onOpenBulkCapacityModal(staff)}
                                className="p-1 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg cursor-pointer transition-colors"
                                title="Edit Capacity"
                              >
                                <Sliders className="w-4 h-4" />
                              </button>
                            }
                          />
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      }
    />
  );
};
