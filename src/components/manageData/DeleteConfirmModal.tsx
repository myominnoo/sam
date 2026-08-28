import { AlertTriangle, Trash2 } from "lucide-react";
import { Modal } from "../common/Modal";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  itemName?: string;
  itemDescription?: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export const DeleteConfirmModal = ({
  isOpen,
  title,
  itemName,
  itemDescription,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
    >
      <div className="space-y-4 text-xs">
        <p className="text-slate-600 leading-relaxed">
          Are you sure you want to delete{" "}
          {itemName && <strong className="text-slate-900">{itemName}</strong>}?{" "}
          {itemDescription}
        </p>
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" /> Confirm Delete
          </button>
        </div>
      </div>
    </Modal>
  );
};
