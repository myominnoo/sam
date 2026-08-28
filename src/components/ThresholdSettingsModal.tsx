import { useState, useEffect } from "react";
// Replace Sliders with ShieldAlert
import { ShieldAlert, X, RotateCcw } from "lucide-react";

interface ThresholdSettingsModalProps {
  isOpen: boolean;
  maxProjectsPerStaff: number;
  maxStaffPerProject: number;
  onClose: () => void;
  onSave: (maxProjects: number, maxStaff: number) => void;
}

const DEFAULT_PROJECTS_LIMIT = 3;
const DEFAULT_STAFF_LIMIT = 4;

export const ThresholdSettingsModal = ({
  isOpen,
  maxProjectsPerStaff,
  maxStaffPerProject,
  onClose,
  onSave,
}: ThresholdSettingsModalProps) => {
  const [projectThreshold, setProjectThreshold] = useState(maxProjectsPerStaff);
  const [staffThreshold, setStaffThreshold] = useState(maxStaffPerProject);

  useEffect(() => {
    setProjectThreshold(maxProjectsPerStaff);
    setStaffThreshold(maxStaffPerProject);
  }, [maxProjectsPerStaff, maxStaffPerProject, isOpen]);

  if (!isOpen) return null;

  const handleResetDefaults = () => {
    setProjectThreshold(DEFAULT_PROJECTS_LIMIT);
    setStaffThreshold(DEFAULT_STAFF_LIMIT);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectThreshold > 0 && staffThreshold > 0) {
      onSave(projectThreshold, staffThreshold);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          {/* Updated Icon Box */}
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Flagging Thresholds
            </h3>
            <p className="text-xs text-slate-500">
              Set count limits to trigger warning badges on matrices.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Max Projects per Staff (Default: {DEFAULT_PROJECTS_LIMIT})
            </label>
            <input
              type="number"
              min="1"
              value={projectThreshold}
              onChange={(e) =>
                setProjectThreshold(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Max Staff per Project (Default: {DEFAULT_STAFF_LIMIT})
            </label>
            <input
              type="number"
              min="1"
              value={staffThreshold}
              onChange={(e) =>
                setStaffThreshold(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              required
            />
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 mt-5">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-slate-100/80 rounded-xl transition cursor-pointer"
              title="Reset limits to default values (3 & 4)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs transition cursor-pointer"
              >
                Save Limits
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
