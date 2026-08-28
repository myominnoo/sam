import { forwardRef, type ReactNode } from "react";

interface BaseMatrixProps {
  title: string;
  countLabel: string;
  children: ReactNode;
}

export const BaseMatrix = forwardRef<HTMLDivElement, BaseMatrixProps>(
  ({ title, countLabel, children }, ref) => {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden flex flex-col relative z-0">
        {/* Matrix Header Banner */}
        <div className="bg-slate-900 px-6 py-3.5 flex items-center justify-between border-b border-slate-800">
          <h3 className="text-xs font-bold text-white tracking-wider uppercase">
            {title}
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full border border-slate-700/60">
            {countLabel}
          </span>
        </div>

        {/* Scrollable Table Wrapper */}
        <div
          ref={ref}
          className="relative overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
        >
          <table className="w-full text-left border-collapse select-none">
            {children}
          </table>
        </div>
      </div>
    );
  },
);

BaseMatrix.displayName = "BaseMatrix";
