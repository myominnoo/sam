import { useState, type FormEvent } from "react";
import { ShieldCheck, Plus, Trash2 } from "lucide-react";
import type { DesignationCategory } from "../db";
import { Modal } from "./common/Modal";
import { FormInput } from "./common/FormControls";
import type { ToastType } from "./common/Toast";

interface DesignationCategoryModalProps {
  isOpen: boolean;
  designations: DesignationCategory[];
  onClose: () => void;
  onAddDesignation: (code: string, name: string) => Promise<void>;
  onDeleteDesignation: (id: number) => Promise<void>;
  showToast?: (message: string, type: ToastType) => void;
}

export const DesignationCategoryModal = ({
  isOpen,
  designations,
  onClose,
  onAddDesignation,
  onDeleteDesignation,
  showToast,
}: DesignationCategoryModalProps) => {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedCode || !trimmedName) {
      showToast?.("Both designation code and name are required.", "warning");
      return;
    }

    if (designations.some((d) => d.code === trimmedCode)) {
      showToast?.(
        `Designation code "${trimmedCode}" already exists.`,
        "warning",
      );
      return;
    }

    try {
      await onAddDesignation(trimmedCode, trimmedName);
      setCode("");
      setName("");
    } catch (err: any) {
      showToast?.(
        err?.message || "Failed to add designation category.",
        "error",
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Staff Designations"
      icon={<ShieldCheck className="w-5 h-5 text-indigo-600" />}
      maxWidthClass="max-w-lg"
    >
      <div className="space-y-4 text-xs">
        <form
          onSubmit={handleSubmit}
          className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200"
        >
          <FormInput
            placeholder="Code (e.g. SRA)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-28 uppercase font-bold"
          />
          <FormInput
            placeholder="Designation Name (e.g. Senior Research Assoc)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>

        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {designations.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded font-bold uppercase text-[10px]">
                  {d.code}
                </span>
                <span className="font-medium text-slate-700">{d.name}</span>
              </div>
              {d.id !== undefined && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await onDeleteDesignation(d.id!);
                    } catch (err: any) {
                      showToast?.(
                        err?.message || "Failed to delete designation.",
                        "error",
                      );
                    }
                  }}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                  title="Delete Designation"
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
