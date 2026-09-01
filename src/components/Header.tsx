import { LayoutGrid, SlidersHorizontal } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"

export type TabType = "dashboard" | "manage"

interface HeaderProps {
  activeTab?: TabType
  onTabChange?: (tab: TabType) => void
}

export function Header({ activeTab = "dashboard", onTabChange }: HeaderProps) {
  return (
    <header className="fixed top-3 left-4 right-4 sm:left-6 sm:right-6 max-w-7xl mx-auto z-50 flex flex-col md:grid md:grid-cols-3 items-center gap-3 p-2.5 px-4 rounded-3xl border border-neutral-300 dark:border-neutral-700 bg-gradient-to-b from-white/30 via-white/15 to-white/5 dark:from-white/10 dark:via-white/[0.04] dark:to-transparent backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_0_rgba(255,255,255,0.8)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.2)] text-left transition-all duration-300">
      {/* 1. Brand Identity */}
      <div className="flex items-center gap-2.5 w-full">
        <div className="shrink-0 transition-transform duration-200 hover:scale-105 flex items-center justify-center">
          <img
            src="/icon.svg"
            alt="Staff Allocation Manager"
            className="h-8 w-8 object-contain filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.15)]"
          />
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="text-xs sm:text-sm font-bold tracking-tight text-foreground m-0 p-0 leading-tight drop-shadow-xs">
            Staff Allocation Manager
          </h1>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium m-0 mt-0.5 block leading-tight">
            Stay on top of team bandwidth and project workloads.
          </p>
        </div>
      </div>

      {/* 2. Navigation */}
      <div className="flex items-center justify-between w-full md:contents">
        <div className="flex justify-start md:justify-center">
          <nav aria-label="Main Navigation" className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => onTabChange?.("dashboard")}
              aria-current={activeTab === "dashboard" ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 h-8 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.35)] border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/20 dark:hover:bg-white/10 border border-transparent"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => onTabChange?.("manage")}
              aria-current={activeTab === "manage" ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 h-8 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === "manage"
                  ? "bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.35)] border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/20 dark:hover:bg-white/10 border border-transparent"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Manage Data
            </button>
          </nav>
        </div>

        {/* 3. Controls */}
        <div className="flex items-center gap-2 justify-end">
          <div className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-xl text-xs font-semibold border border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] select-none">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="hidden sm:inline">Live Sync</span>
          </div>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}