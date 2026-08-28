import type { RefObject, ChangeEvent } from "react";
import {
  Database,
  ShieldCheck,
  FileSpreadsheet,
  Upload,
  Download,
  Trash2,
} from "lucide-react";

interface ManageDataToolbarProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  onOpenRoleModal: () => void;
  onImportClick: () => void;
  onExport: () => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onRequestClearAll: () => void;
}

export const ManageDataToolbar = ({
  fileInputRef,
  onOpenRoleModal,
  onImportClick,
  onExport,
  onFileChange,
  onRequestClearAll,
}: ManageDataToolbarProps) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Data Management Center
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Manage database records, bulk import/export configuration datasets,
            and define role categories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={onOpenRoleModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200/60 transition cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Roles
          </button>

          <a
            href="/staff_allocation_template.xlsx"
            download="staff_allocation_template.xlsx"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200/60 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />{" "}
            Template
          </a>

          <button
            onClick={onImportClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" /> Import
          </button>

          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" /> Export
          </button>

          <button
            onClick={onRequestClearAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100/80 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200/60 transition cursor-pointer ml-auto lg:ml-0"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Clear Data
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            accept=".xlsx, .xls"
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};
