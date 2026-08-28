import type { ReactNode } from "react";

export interface ActionCardProps {
  title?: ReactNode;
  icon?: ReactNode;
  accentColorClass?: string;
  children?: ReactNode;
  className?: string;
}

export const ActionCard = ({
  title,
  icon,
  accentColorClass = "border-l-indigo-500",
  children,
  className = "",
}: ActionCardProps) => {
  const hasHeader = Boolean(title || icon);

  return (
    <div
      className={`bg-slate-900 rounded-2xl border border-slate-800 border-l-4 shadow-xs min-h-[64px] flex items-center ${accentColorClass} ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-3 w-full">
        {/* Render header section only if title or icon is provided */}
        {hasHeader && (
          <div className="flex items-center gap-2.5 shrink-0">
            {icon && <span className="text-indigo-400">{icon}</span>}
            {title && (
              <h2 className="text-xs font-bold text-white tracking-wider uppercase">
                {title}
              </h2>
            )}
          </div>
        )}

        {/* Children expand to full width when no header exists */}
        {children && (
          <div
            className={`flex items-center gap-2.5 flex-wrap ${
              hasHeader ? "w-full sm:w-auto" : "w-full"
            }`}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
};
