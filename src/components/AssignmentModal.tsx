import React from "react";
import type { Staff, Project } from "../db";

interface AssignmentModalProps {
  isOpen: boolean;
  staffMembers: Staff[];
  projects: Project[];
  selectedStaffId: number | "";
  selectedProjectId: number | "";
  selectedRole: string;
  onStaffChange: (id: number) => void;
  onProjectChange: (id: number) => void;
  onRoleChange: (role: string) => void;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  staffMembers,
  projects,
  selectedStaffId,
  selectedProjectId,
  selectedRole,
  onStaffChange,
  onProjectChange,
  onRoleChange,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-900">
          Manage Project Assignment
        </h3>

        <form onSubmit={onSave} className="space-y-4 text-sm">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Staff Member
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => onStaffChange(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            >
              {staffMembers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => onProjectChange(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => onRoleChange(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">None (Remove)</option>
              <option value="PL">Project Lead (PL)</option>
              <option value="M">Member (M)</option>
              <option value="A">Assisting (A)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Save Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
