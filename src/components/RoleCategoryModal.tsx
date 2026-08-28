import { useState, type FormEvent } from "react";
import { ShieldCheck, Plus, Trash2 } from "lucide-react";
import type { RoleCategory } from "../db";
import { Modal } from "./common/Modal";
import { FormInput } from "./common/FormControls";

interface RoleCategoryModalProps {
  isOpen: boolean;
  roles: RoleCategory[];
  onClose: () => void;
  onAddRole: (code: string, name: string) => Promise<void>;
  onDeleteRole: (id: number) => Promise<void>;
}

export const RoleCategoryModal = ({
  isOpen,
  roles,
  onClose,
  onAddRole,
  onDeleteRole,
}: RoleCategoryModalProps) => {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    await onAddRole(code.trim().toUpperCase(), name.trim());
    setCode("");
    setName("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Dynamic Roles"
      icon={<ShieldCheck className="w-5 h-5 text-indigo-600" />}
      maxWidthClass="max-w-lg"
    >
      <div className="space-y-4 text-xs">
        <form
          onSubmit={handleSubmit}
          className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200"
        >
          <FormInput
            placeholder="Code (e.g. PL)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-28 uppercase font-bold"
          />
          <FormInput
            placeholder="Role Name (e.g. Project Lead)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Role
          </button>
        </form>

        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {roles.map((role) => (
            <div
              key={role.id}
              className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded font-bold uppercase text-[10px]">
                  {role.code}
                </span>
                <span className="font-medium text-slate-700">{role.name}</span>
              </div>
              {role.id !== undefined && (
                <button
                  type="button"
                  onClick={() => onDeleteRole(role.id!)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                  title="Delete Role"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
