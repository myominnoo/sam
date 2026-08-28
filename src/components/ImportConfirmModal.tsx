import { AlertTriangle, UploadCloud, FileSpreadsheet } from "lucide-react";
import type { ParsedImportData } from "../utils/excel";

interface ImportConfirmModalProps {
  isOpen: boolean;
  parsedData: ParsedImportData | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function ImportConfirmModal({
  isOpen,
  parsedData,
  onClose,
  onConfirm,
}: ImportConfirmModalProps) {
  if (!isOpen || !parsedData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-5">
        <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200/60">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <h3 className="text-sm font-bold">Replace Current Data?</h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Importing this file will{" "}
          <strong>overwrite and replace all current database records</strong>.
          The following records were parsed from your file:
        </p>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-700">
            <span className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              <strong>Staff Members:</strong>
            </span>
            <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              {parsedData.staff.length}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-700">
            <span className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              <strong>Projects:</strong>
            </span>
            <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              {parsedData.projects.length}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-700">
            <span className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              <strong>Assignments:</strong>
            </span>
            <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              {parsedData.assignments.length}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Confirm & Import</span>
          </button>
        </div>
      </div>
    </div>
  );
}
