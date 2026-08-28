import type { FormEvent } from "react";
import type { Staff, Project } from "../db";
import { Modal } from "./common/Modal";
import { FormSelect } from "./common/FormControls";

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
  onSave: (e: FormEvent) => void;
}

export const AssignmentModal = ({
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
}: AssignmentModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Project Assignment">
      <form onSubmit={onSave} className="space-y-4 text-xs">
        <FormSelect
          label="Staff Member"
          value={selectedStaffId}
          onChange={(e) => onStaffChange(Number(e.target.value))}
          required
          options={staffMembers.map((s) => ({ label: s.name, value: s.id! }))}
        />
        <FormSelect
          label="Project"
          value={selectedProjectId}
          onChange={(e) => onProjectChange(Number(e.target.value))}
          required
          options={projects.map((p) => ({ label: p.name, value: p.id! }))}
        />
        <FormSelect
          label="Role"
          value={selectedRole}
          onChange={(e) => onRoleChange(e.target.value)}
          options={[
            { label: "None (Remove)", value: "" },
            { label: "Project Lead (PL)", value: "PL" },
            { label: "Member (M)", value: "M" },
            { label: "Assisting (A)", value: "A" },
          ]}
        />
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-100 font-medium text-slate-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium cursor-pointer"
          >
            Save Assignment
          </button>
        </div>
      </form>
    </Modal>
  );
};
