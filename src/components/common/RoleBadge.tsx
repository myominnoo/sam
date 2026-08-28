import type { MouseEvent } from "react";
import { getRoleBadgeClass } from "../../utils/styleHelpers";

export interface RoleBadgeProps {
  role?: string;
  onClick?: (e: MouseEvent<HTMLButtonElement | HTMLSpanElement>) => void;
  title?: string;
  fullCell?: boolean;
}

export const RoleBadge = ({
  role,
  onClick,
  title,
  fullCell = false,
}: RoleBadgeProps) => {
  if (!role) return null;

  const badgeClass =
    getRoleBadgeClass(role) || "bg-slate-100 text-slate-600 border-slate-200";
  const isInteractive = Boolean(onClick);

  // Scaled matrix font size up by one notch (text-[11px]) while retaining font-semibold
  const layoutClasses = fullCell
    ? `w-full h-full flex items-center justify-center font-semibold text-[11px] tracking-tight ${badgeClass}`
    : `inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${badgeClass}`;

  if (isInteractive) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        className={`select-none transition-opacity cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${layoutClasses}`}
      >
        {role}
      </button>
    );
  }

  if (fullCell) {
    return (
      <div title={title} className={`select-none ${layoutClasses}`}>
        {role}
      </div>
    );
  }

  return (
    <span title={title} className={`select-none ${layoutClasses}`}>
      {role}
    </span>
  );
};
