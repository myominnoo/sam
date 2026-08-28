import { Clock, ArrowRight } from "lucide-react";
import { MASTER_MONTH_OPTIONS, DURATION_OPTIONS } from "../constants";

export interface PlanningPeriodCardProps {
  selectedDuration: string;
  startMonthKey: string;
  endMonthKey: string;
  onDurationChange: (monthsStr: string) => void;
  onStartMonthChange: (newStartKey: string) => void;
  onEndMonthChange: (newEndKey: string) => void;
}

export const PlanningPeriodCard = ({
  selectedDuration,
  startMonthKey,
  endMonthKey,
  onDurationChange,
  onStartMonthChange,
  onEndMonthChange,
}: PlanningPeriodCardProps) => {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 border-l-4 border-l-indigo-500 shadow-xs overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-3.5">
        {/* Card Header Title */}
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-indigo-400" />
          <h2 className="text-xs font-bold text-white tracking-wider uppercase">
            Planning Period
          </h2>
        </div>

        {/* Controls Controls Bar */}
        <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
          {/* Preset Selector */}
          <div className="inline-flex items-center bg-slate-800/90 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
            <span className="text-[11px] font-medium text-slate-400 pr-2 select-none hidden min-[400px]:inline">
              Preset:
            </span>
            <select
              value={selectedDuration}
              onChange={(e) => onDurationChange(e.target.value)}
              className="bg-transparent font-semibold text-indigo-300 focus:outline-none cursor-pointer pr-1"
            >
              {DURATION_OPTIONS.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-slate-900 text-slate-200"
                >
                  {opt.label}
                </option>
              ))}
              {selectedDuration === "custom" && (
                <option value="custom" className="bg-slate-900 text-slate-200">
                  Custom Range
                </option>
              )}
            </select>
          </div>

          {/* Start and End Range Pickers */}
          <div className="inline-flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/60 rounded-xl p-1 text-xs">
            <select
              value={startMonthKey}
              onChange={(e) => onStartMonthChange(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-200 shadow-2xs focus:outline-none focus:ring-1 focus:ring-indigo-500/40 cursor-pointer"
            >
              {MASTER_MONTH_OPTIONS.map((m) => (
                <option key={`start-${m.key}`} value={m.key}>
                  {m.shortMonth} {m.year}
                </option>
              ))}
            </select>

            <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />

            <select
              value={endMonthKey}
              onChange={(e) => onEndMonthChange(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-200 shadow-2xs focus:outline-none focus:ring-1 focus:ring-indigo-500/40 cursor-pointer"
            >
              {MASTER_MONTH_OPTIONS.map((m) => (
                <option key={`end-${m.key}`} value={m.key}>
                  {m.shortMonth} {m.year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
