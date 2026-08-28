import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Sliders, Check } from "lucide-react";
import type { Staff } from "../db";
import type { TimelineMonth } from "../constants";
import { Modal } from "./common/Modal";
import { FormInput, FormSelect } from "./common/FormControls";
import type { ToastType } from "./common/Toast";

interface BulkCapacityModalProps {
  isOpen: boolean;
  staff: Staff | null;
  timelineMonths: TimelineMonth[];
  onClose: () => void;
  onSave: (
    staffId: number,
    monthlyCapacity: Record<string, number>,
  ) => Promise<void>;
  showToast?: (message: string, type: ToastType) => void;
}

export const BulkCapacityModal = ({
  isOpen,
  staff,
  timelineMonths,
  onClose,
  onSave,
  showToast,
}: BulkCapacityModalProps) => {
  if (!isOpen || !staff) return null;

  const activeStaff = staff;
  const defaultCapacityPct = Math.round((activeStaff.fte ?? 1.0) * 100);

  const [targetCapacity, setTargetCapacity] =
    useState<number>(defaultCapacityPct);
  const [startMonthKey, setStartMonthKey] = useState<string>(
    timelineMonths[0]?.key || "",
  );
  const [endMonthKey, setEndMonthKey] = useState<string>(
    timelineMonths[timelineMonths.length - 1]?.key || "",
  );
  const [applyToAll, setApplyToAll] = useState<boolean>(false);

  useEffect(() => {
    if (activeStaff) {
      setTargetCapacity(Math.round((activeStaff.fte ?? 1.0) * 100));
    }
  }, [activeStaff]);

  const monthOptions = timelineMonths.map((m) => ({
    label: `${m.shortMonth} ${m.year}`,
    value: m.key,
  }));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeStaff.id) return;

    if (targetCapacity < 0 || targetCapacity > 300) {
      showToast?.("Target capacity must be between 0% and 300%.", "warning");
      return;
    }

    const updatedMap: Record<string, number> = {
      ...(activeStaff.monthlyCapacity || {}),
    };

    if (applyToAll) {
      timelineMonths.forEach((m) => {
        updatedMap[m.key] = targetCapacity;
      });
    } else {
      const keys = timelineMonths.map((m) => m.key);
      const sIdx = keys.indexOf(startMonthKey);
      const eIdx = keys.indexOf(endMonthKey);

      if (sIdx === -1 || eIdx === -1) {
        showToast?.("Please select a valid date range.", "error");
        return;
      }

      if (sIdx > eIdx) {
        showToast?.("Start month must precede end month.", "warning");
        return;
      }

      for (let i = sIdx; i <= eIdx; i++) {
        updatedMap[keys[i]] = targetCapacity;
      }
    }

    try {
      await onSave(activeStaff.id, updatedMap);
      onClose();
    } catch (err: any) {
      showToast?.(err?.message || "Failed to save capacity updates.", "error");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Bulk Set Capacity: ${activeStaff.name}`}
      icon={<Sliders className="w-4 h-4 text-indigo-600" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-medium text-slate-700 mb-1">
            Target Capacity (%)
          </label>
          <div className="flex items-center gap-2">
            <FormInput
              type="number"
              min="0"
              max="300"
              value={targetCapacity}
              onChange={(e) => setTargetCapacity(Number(e.target.value))}
              className="font-semibold"
            />
            <button
              type="button"
              onClick={() => setTargetCapacity(0)}
              className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium whitespace-nowrap cursor-pointer transition"
            >
              Reset (0%)
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
            <span className="text-slate-700">Apply to all timeline months</span>
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
            <FormSelect
              label="From:"
              value={startMonthKey}
              onChange={(e) => setStartMonthKey(e.target.value)}
              options={monthOptions}
            />
            <FormSelect
              label="To:"
              value={endMonthKey}
              onChange={(e) => setEndMonthKey(e.target.value)}
              options={monthOptions}
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 flex items-center gap-1 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" /> Apply
          </button>
        </div>
      </form>
    </Modal>
  );
};
