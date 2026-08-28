import { LayoutDashboard, SlidersHorizontal } from "lucide-react";

interface HeaderProps {
  activeTab: "dashboard" | "manage";
  setActiveTab: (tab: "dashboard" | "manage") => void;
}

export const Header = ({ activeTab, setActiveTab }: HeaderProps) => {
  return (
    <header className="sticky top-4 z-40 w-full mb-8 sm:mb-10">
      <div className="w-full bg-white/80 backdrop-blur-xl border border-slate-300/80 ring-1 ring-slate-900/5 shadow-xl shadow-slate-900/10 rounded-2xl p-3 sm:px-5 sm:py-3.5 transition-all">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Title & Favicon Logo */}
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="p-2 bg-indigo-50/80 border border-indigo-100/80 rounded-xl shrink-0 shadow-xs flex items-center justify-center">
              <img
                src="/favicon_io/favicon.ico"
                alt="App Logo"
                className="w-6 h-6 object-contain"
              />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Staff Allocation Matrix (SAM)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
                Stay on top of team bandwidth and project workloads.
              </p>
            </div>
          </div>

          {/* Floating Translucent Tab Navigation */}
          <nav className="flex items-center bg-slate-100/90 p-1 rounded-full border border-slate-300/60 shadow-inner w-full sm:w-auto justify-center">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab("manage")}
              className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === "manage"
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Manage Data</span>
            </button>
          </nav>

          {/* Live Sync Badge - Right Aligned */}
          <div className="hidden lg:flex items-center shrink-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50/90 border border-emerald-300/60 rounded-full shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 tracking-wide">
                Live Sync
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
