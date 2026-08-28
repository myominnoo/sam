import { useState } from "react";
import type { FormEvent } from "react";
import { Sliders, X, Check } from "lucide-react";
import type { Staff } from "../db";
import type { TimelineMonth } from "../constants";

interface BulkCapacityModalProps {
  isOpen: boolean;
  staff: Staff | null;
  timelineMonths: TimelineMonth[];
  onClose: () => void;
  onSave: (
    staffId: number,
    monthlyCapacity: Record<string, number>,
  ) => Promise<void>;
}

export const BulkCapacityModal = ({
  isOpen,
  staff,
  timelineMonths,
  onClose,
  onSave,
}: BulkCapacityModalProps) => {
  if (!isOpen || !staff) return null;

  const defaultCapacityPct = Math.round(staff.fte * 100);
  const [targetCapacity, setTargetCapacity] =
    useState<number>(defaultCapacityPct);
  const [startMonthKey, setStartMonthKey] = useState<string>(
    timelineMonths[0]?.key || "",
  );
  const [endMonthKey, setEndMonthKey] = useState<string>(
    timelineMonths[timelineMonths.length - 1]?.key || "",
  );
  const [applyToAll, setApplyToAll] = useState<boolean>(true);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!staff.id) return;

    const updatedMap: Record<string, number> = {
      ...(staff.monthlyCapacity || {}),
    };

    if (applyToAll) {
      timelineMonths.forEach((m) => {
        updatedMap[m.key] = targetCapacity;
      });
    } else {
      const keys = timelineMonths.map((m) => m.key);
      const sIdx = keys.indexOf(startMonthKey);
      const eIdx = keys.indexOf(endMonthKey);

      if (sIdx !== -1 && eIdx !== -1 && sIdx <= eIdx) {
        for (let i = sIdx; i <= eIdx; i++) {
          updatedMap[keys[i]] = targetCapacity;
        }
      }
    }

    await onSave(staff.id, updatedMap);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-slate-800 text-sm">
              Bulk Set Capacity: {staff.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Target Capacity (%)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="200"
                value={targetCapacity}
                onChange={(e) => setTargetCapacity(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setTargetCapacity(defaultCapacityPct)}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium whitespace-nowrap"
              >
                Reset to FTE ({defaultCapacityPct}%)
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block font-medium text-slate-700">
              Apply Scope
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="scope"
                checked={applyToAll}
                onChange={() => setApplyToAll(true)}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-700">
                Apply to all timeline months
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="scope"
                checked={!applyToAll}
                onChange={() => setApplyToAll(false)}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-700">Apply to custom date range</span>
            </label>
          </div>

          {!applyToAll && (
            <div className="grid grid-cols-2 gap-2 pl-6 pt-1">
              <div>
                <span className="block text-[11px] text-slate-500 mb-1">
                  From:
                </span>
                <select
                  value={startMonthKey}
                  onChange={(e) => setStartMonthKey(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1 text-xs"
                >
                  {timelineMonths.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.shortMonth} {m.year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-[11px] text-slate-500 mb-1">
                  To:
                </span>
                <select
                  value={endMonthKey}
                  onChange={(e) => setEndMonthKey(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1 text-xs"
                >
                  {timelineMonths.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.shortMonth} {m.year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Apply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
