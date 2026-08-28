import { Users } from "lucide-react";

export const Header = () => {
  return (
    <header className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Staff Allocation
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal">
            Resource capacity management & project timelines
          </p>
        </div>
      </div>
    </header>
  );
};
