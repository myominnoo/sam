import { forwardRef, type ReactNode } from "react";

interface BaseMatrixProps {
  title: string;
  countLabel: string;
  children: ReactNode;
}

export const BaseMatrix = forwardRef<HTMLDivElement, BaseMatrixProps>(
  ({ title, countLabel, children }, ref) => {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden mb-8">
        {/* Highlighted Header Banner */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 border-b border-slate-800 border-l-4 border-l-indigo-500">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">
              {title}
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-300 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700/60 shadow-2xs">
            {countLabel}
          </span>
        </div>

        {/* Scrollable Table Area */}
        <div
          ref={ref}
          className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200"
        >
          <table className="w-full border-collapse text-left text-xs select-none min-w-max">
            {children}
          </table>
        </div>
      </div>
    );
  },
);

BaseMatrix.displayName = "BaseMatrix";
