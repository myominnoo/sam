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

  // Close the dropdown when clicking outside
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
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex flex-row items-center justify-between gap-6">
        {/* Header Title & Description */}
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600 shrink-0" />
            <h2 className="text-base font-semibold text-slate-900">
              Data Management Center
            </h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Manage database records, bulk import/export configuration datasets,
            and define designation categories.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Designations Button */}
          <button
            onClick={onOpenDesignationModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200/60 transition cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Designations
          </button>

          {/* 3 Dots Dropdown Menu Container */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsOpen((prev) => !prev)}
              aria-label="More options"
              className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Options */}
            {isOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-30 space-y-1">
                {/* Threshold Settings Option */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenThresholdModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 hover:text-amber-900 rounded-lg transition-colors duration-150 cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Threshold Limits</span>
                </button>

                {/* Template - Emerald */}
                <a
                  href="/staff_allocation_template.xlsx"
                  download="staff_allocation_template.xlsx"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900 rounded-lg transition-colors duration-150"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Template</span>
                </a>

                {/* Import - Upload Icon */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onImportClick();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 hover:text-blue-900 rounded-lg transition-colors duration-150 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Import</span>
                </button>

                {/* Export - Download Icon */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onExport();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100 hover:text-violet-900 rounded-lg transition-colors duration-150 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-violet-600 shrink-0" />
                  <span>Export</span>
                </button>

                <div className="my-1 border-t border-slate-100" />

                {/* Clear Data - Rose */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onRequestClearAll();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 hover:text-rose-800 rounded-lg transition-colors duration-150 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
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
        </div>
      </div>
    </div>
  );
};
