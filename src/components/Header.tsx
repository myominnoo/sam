import type { RefObject, ChangeEvent } from "react";
import { Upload, Download, Plus, Users, Calendar } from "lucide-react";
import { MASTER_MONTH_OPTIONS } from "../constants";

interface HeaderProps {
  activeTab: "dashboard" | "manage";
  startMonthKey: string;
  endMonthKey: string;
  onStartMonthChange: (key: string) => void;
  onEndMonthChange: (key: string) => void;
  onImportClick: () => void;
  onExport: () => void;
  onOpenAssignmentModal: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const Header = ({
  activeTab,
  startMonthKey,
  endMonthKey,
  onStartMonthChange,
  onEndMonthChange,
  onImportClick,
  onExport,
  onOpenAssignmentModal,
  fileInputRef,
  onFileChange,
}: HeaderProps) => {
  const filteredEndOptions = MASTER_MONTH_OPTIONS.filter((opt) => {
    const startIdx = MASTER_MONTH_OPTIONS.findIndex(
      (m) => m.key === startMonthKey,
    );
    const currIdx = MASTER_MONTH_OPTIONS.findIndex((m) => m.key === opt.key);
    return currIdx >= startIdx;
  });

  return (
    <header className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
      {/* Title & Live Indicator */}
      <div className="flex items-center justify-between sm:justify-start gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 flex-shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
            Staff Allocation
          </h1>
        </div>

        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
          Live Sync
        </span>
      </div>

      {/* Control Actions & Range Toolbar */}
      <div className="flex items-center gap-2 flex-wrap justify-start md:justify-end">
        {/* Timeline Selectors */}
        {activeTab === "dashboard" && (
          <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1 text-xs w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <span className="text-slate-500 font-medium hidden sm:inline">
                Range:
              </span>
            </div>

            <div className="flex items-center gap-1">
              <select
                value={startMonthKey}
                onChange={(e) => onStartMonthChange(e.target.value)}
                className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
              >
                {MASTER_MONTH_OPTIONS.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.month.slice(0, 3)} {m.year}
                  </option>
                ))}
              </select>
              <span className="text-slate-400">→</span>
              <select
                value={endMonthKey}
                onChange={(e) => onEndMonthChange(e.target.value)}
                className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
              >
                {filteredEndOptions.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.month.slice(0, 3)} {m.year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Primary Action Button */}
        <button
          onClick={onOpenAssignmentModal}
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Assignment</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-200 hidden sm:block mx-0.5" />

        {/* Excel Import / Export Group */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onImportClick}
            title="Import Excel"
            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-medium text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span>Import</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            accept=".xlsx, .xls"
            className="hidden"
          />

          <button
            onClick={onExport}
            title="Export Excel"
            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-medium text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export</span>
          </button>
        </div>
      </div>
    </header>
  );
};
