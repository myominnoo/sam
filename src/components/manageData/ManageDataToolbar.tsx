import {
  useState,
  useRef,
  useEffect,
  type RefObject,
  type ChangeEvent,
} from "react";
import {
  Database,
  ShieldCheck,
  MoreVertical,
  FileSpreadsheet,
  Upload,
  Download,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import { ActionCard } from "../common/ActionCard";

interface ManageDataToolbarProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  onOpenDesignationModal: () => void;
  onImportClick: () => void;
  onExport: () => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onRequestClearAll: () => void;
  onOpenThresholdModal: () => void;
}

export const ManageDataToolbar = ({
  fileInputRef,
  onOpenDesignationModal,
  onImportClick,
  onExport,
  onFileChange,
  onRequestClearAll,
  onOpenThresholdModal,
}: ManageDataToolbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <ActionCard
      title="Staff Directory & Assignments"
      icon={<Database className="w-4 h-4" />}
      accentColorClass="border-l-indigo-500"
    >
      {/* Designations Button */}
      <button
        type="button"
        onClick={onOpenDesignationModal}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/30 text-indigo-200 hover:text-white text-xs font-semibold rounded-xl border border-indigo-500/30 transition cursor-pointer"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
        Designations
      </button>

      {/* 3 Dots Dropdown Menu Container */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="More options"
          className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition cursor-pointer"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {/* Dropdown Options */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 space-y-1">
            {/* Threshold Settings Option */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenThresholdModal();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-400/30 hover:text-white rounded-lg transition-colors duration-150 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Threshold Limits</span>
            </button>

            {/* Template - Emerald */}
            <a
              href={`${import.meta.env.BASE_URL}staff_allocation_template.xlsx`}
              download="staff_allocation_template.xlsx"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-400/30 hover:text-white rounded-lg transition-colors duration-150"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Template</span>
            </a>

            {/* Import - Upload Icon */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onImportClick();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-sky-200 hover:bg-sky-400/30 hover:text-white rounded-lg transition-colors duration-150 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-sky-300 shrink-0" />
              <span>Import</span>
            </button>

            {/* Export - Download Icon */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onExport();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-violet-200 hover:bg-violet-400/30 hover:text-white rounded-lg transition-colors duration-150 cursor-pointer"
            >
              <Download className="w-4 h-4 text-violet-300 shrink-0" />
              <span>Export</span>
            </button>

            <div className="my-1 border-t border-slate-800" />

            {/* Clear Data - Rose */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onRequestClearAll();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-400/30 hover:text-white rounded-lg transition-colors duration-150 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-300 shrink-0" />
              <span>Clear Data</span>
            </button>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept=".xlsx, .xls"
        className="hidden"
      />
    </ActionCard>
  );
};
