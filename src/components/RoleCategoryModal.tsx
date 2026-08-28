import { useState, type FormEvent } from "react";
import { ShieldCheck, Plus, Trash2, Edit3, Check, X } from "lucide-react";
import type { RoleCategory } from "../db";
import { Modal } from "./common/Modal";
import { FormInput } from "./common/FormControls";

interface RoleCategoryModalProps {
  isOpen: boolean;
  roles: RoleCategory[];
  onClose: () => void;
  onAddRole: (name: string) => Promise<void>;
  onUpdateRole: (id: number, name: string) => Promise<void>;
  onDeleteRole: (id: number) => Promise<void>;
}

export function RoleCategoryModal({
  isOpen,
  roles,
  onClose,
  onAddRole,
  onUpdateRole,
  onDeleteRole,
}: RoleCategoryModalProps) {
  const [newRoleName, setNewRoleName] = useState("");
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [editRoleName, setEditRoleName] = useState("");

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    await onAddRole(newRoleName.trim().toUpperCase());
    setNewRoleName("");
  };

  const handleStartEdit = (role: RoleCategory) => {
    setEditingRoleId(role.id!);
    setEditRoleName(role.name);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editRoleName.trim()) return;
    await onUpdateRole(id, editRoleName.trim().toUpperCase());
    setEditingRoleId(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Designation Roles"
      icon={<ShieldCheck className="w-5 h-5 text-indigo-600" />}
    >
      <div className="space-y-4 text-xs">
        <form onSubmit={handleAdd} className="flex gap-2">
          <FormInput
            placeholder="New Role Designation (e.g. PM, SDE)..."
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            className="flex-1"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </form>

        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="p-2.5">Designation</th>
                <th className="p-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roles.map((r) => {
                const isEditing = editingRoleId === r.id;
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    {isEditing ? (
                      <>
                        <td className="p-2">
                          <FormInput
                            value={editRoleName}
                            onChange={(e) => setEditRoleName(e.target.value)}
                            className="uppercase font-semibold"
                          />
                        </td>
                        <td className="p-2 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(r.id!)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingRoleId(null)}
                            className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2.5 font-bold text-slate-800">
                          {r.name}
                        </td>
                        <td className="p-2.5 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(r)}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteRole(r.id!)}
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
