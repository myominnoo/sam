import type { ReactNode } from "react";
import { Edit3, Trash2, CheckCircle2, Ban } from "lucide-react";

interface TableRowActionsProps {
  isActive: boolean;
  onStartEdit?: () => void;
  onRequestDelete?: () => void;
  onToggleActive: () => void;
  extraActions?: ReactNode;
  activateTitle?: string;
  deactivateTitle?: string;
}

export const TableRowActions = ({
  isActive,
  onStartEdit,
  onRequestDelete,
  onToggleActive,
  extraActions,
  activateTitle = "Activate",
  deactivateTitle = "Deactivate",
}: TableRowActionsProps) => {
  return (
    <div className="flex items-center justify-end gap-1">
      {isActive ? (
        <>
          {extraActions}
          {onStartEdit && (
            <button
              onClick={onStartEdit}
              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
              title="Edit"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          )}
          {onRequestDelete && (
            <button
              onClick={onRequestDelete}
              className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={onToggleActive}
            className="p-1.5 xl:px-2 xl:py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-semibold text-[11px] border border-amber-200/80 inline-flex items-center gap-1 cursor-pointer transition-colors"
            title={deactivateTitle}
          >
            <Ban className="w-3 h-3 text-amber-600" />
            <span className="hidden xl:inline">{deactivateTitle}</span>
          </button>
        </>
      ) : (
        <button
          onClick={onToggleActive}
          className="p-1.5 xl:px-2.5 xl:py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-semibold text-[11px] border border-emerald-200/80 inline-flex items-center gap-1 cursor-pointer transition-colors"
          title={activateTitle}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span className="hidden xl:inline">{activateTitle}</span>
        </button>
      )}
    </div>
  );
};
