import type { RefObject, ChangeEvent } from "react";
import {
  Upload,
  Download,
  Plus,
  Users,
  Calendar,
  UserPlus,
} from "lucide-react";

interface HeaderProps {
  visibleMonths: number;
  onVisibleMonthsChange: (months: number) => void;
  onImportClick: () => void;
  onExport: () => void;
  onOpenAddStaffModal?: () => void;
  onOpenAssignmentModal: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const Header = ({
  visibleMonths,
  onVisibleMonthsChange,
  onImportClick,
  onExport,
  onOpenAddStaffModal,
  onOpenAssignmentModal,
  fileInputRef,
  onFileChange,
}: HeaderProps) => (
  <header className="bg-white rounded-xl px-5 py-3 border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
    {/* Left Block: Icon + Title & Live Badge */}
    <div className="flex items-center gap-3">
      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 flex-shrink-0">
        <Users className="w-5 h-5" />
      </div>
      <div className="flex items-center gap-2.5">
        <h1 className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
          Staff Allocation
        </h1>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
          Live Sync
        </span>
      </div>
    </div>

    {/* Center & Right Controls Toolbar */}
    <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap justify-between lg:justify-end w-full lg:w-auto">
      {/* Timeline Selector with Full "Months" Spelling */}
      <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1">
        <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
        <select
          value={visibleMonths}
          onChange={(e) => onVisibleMonthsChange(Number(e.target.value))}
          className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
        >
          <option value={6}>6 Months (0.5 Yr)</option>
          <option value={12}>12 Months (1 Yr)</option>
          <option value={18}>18 Months (1.5 Yrs)</option>
          <option value={24}>24 Months (2 Yrs)</option>
          <option value={36}>36 Months (3 Yrs)</option>
        </select>
      </div>

      <div className="h-4 w-[1px] bg-slate-200 hidden sm:block mx-0.5" />

      {/* Primary Actions Group */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenAddStaffModal}
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Staff</span>
        </button>

        <button
          onClick={onOpenAssignmentModal}
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Assignment</span>
        </button>
      </div>

      <div className="h-4 w-[1px] bg-slate-200 hidden sm:block mx-0.5" />

      {/* Data Operations Group */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onImportClick}
          title="Import Excel"
          className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 active:bg-slate-300 text-slate-700 font-medium text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 transition-all cursor-pointer whitespace-nowrap"
        >
          <Upload className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden xl:inline">Import</span>
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
          className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 active:bg-slate-300 text-slate-700 font-medium text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 transition-all cursor-pointer whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden xl:inline">Export</span>
        </button>
      </div>
    </div>
  </header>
);
