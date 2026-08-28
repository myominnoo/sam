import type { KeyboardEvent } from "react";
import { getRoleBadgeClass } from "../../utils/styleHelpers";

interface RoleBadgeProps {
  role?: string;
  onClick?: () => void;
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
  const isInteractive = Boolean(onClick);

  const handleKeyDown = (
    e: KeyboardEvent<HTMLDivElement | HTMLSpanElement>,
  ) => {
    if (isInteractive && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick?.();
    }
  };

  const badgeClass =
    getRoleBadgeClass(role) || "bg-slate-100 text-slate-600 border-slate-200";

  if (fullCell) {
    return (
      <div
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        title={title}
        className={`w-full h-full flex items-center justify-center font-bold text-xs select-none transition-opacity ${badgeClass} ${
          isInteractive
            ? "cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-indigo-500 inset-0"
            : ""
        }`}
      >
        {role}
      </div>
    );
  }

  return (
    <span
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      title={title}
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold select-none transition-opacity ${badgeClass} ${
        isInteractive
          ? "cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          : ""
      }`}
    >
      {role}
    </span>
  );
};
