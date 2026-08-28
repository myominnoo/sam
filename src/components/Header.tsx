import { Users } from "lucide-react";

export const Header = () => {
  return (
    <header className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between gap-4">
      {/* Title & Description */}
      <div className="flex items-center gap-3.5">
        <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 shrink-0">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 leading-tight">
            Staff Capacity Planner
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track team bandwidth and project assignments in real time.
          </p>
        </div>
      </div>

      {/* Live Sync Badge - Right Aligned with Pulsing Dot */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50/80 border border-emerald-200/60 rounded-full shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-[11px] font-semibold text-emerald-700 tracking-wide">
          Live Sync
        </span>
      </div>
    </header>
  );
};
