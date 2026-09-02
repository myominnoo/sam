import { HardDrive, LayoutGrid, SlidersHorizontal } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"

export type TabType = "dashboard" | "manage"

interface HeaderProps {
  activeTab?: TabType
  onTabChange?: (tab: TabType) => void
}

export function Header({ activeTab = "dashboard", onTabChange }: HeaderProps) {
  // Dynamically resolve the base URL configured in vite.config.ts
  const logoUrl = `${import.meta.env.BASE_URL}icon.svg`

  return (
    <header className="fixed top-3 left-4 right-4 sm:left-6 sm:right-6 max-w-7xl mx-auto z-50 grid grid-cols-3 items-center gap-2 sm:gap-3 p-2.5 px-3 sm:px-4 rounded-3xl border border-neutral-300 dark:border-neutral-700 bg-gradient-to-b from-white/30 via-white/15 to-white/5 dark:from-white/10 dark:via-white/[0.04] dark:to-transparent backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_0_rgba(255,255,255,0.8)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.2)] text-left transition-all duration-300">
      {/* 1. Brand Identity */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <div className="shrink-0 transition-transform duration-200 hover:scale-105 flex items-center justify-center">
          <img
            src={logoUrl}
            alt="Staff Allocation Manager"
            className="h-8 w-8 object-contain filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.15)]"
          />
        </div>
        <div className="flex flex-col justify-center min-w-0">
          <h1 className="text-xs sm:text-sm font-bold tracking-tight text-foreground m-0 p-0 leading-tight drop-shadow-xs whitespace-nowrap">
            <span className="sm:hidden">SAM</span>
            <span className="hidden sm:inline">Staff Allocation Manager</span>
          </h1>
          <p className="hidden sm:block text-[10px] sm:text-[11px] text-muted-foreground font-medium m-0 mt-0.5 leading-tight">
            Stay on top of team bandwidth and project workloads.
          </p>
        </div>
      </div>

      {/* 2. Navigation */}
      <div className="flex justify-center">
          <nav aria-label="Main Navigation" className="inline-flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => onTabChange?.("dashboard")}
              aria-current={activeTab === "dashboard" ? "page" : undefined}
              aria-label="Dashboard"
              title="Dashboard"
              className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3.5 h-8 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.35)] border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/20 dark:hover:bg-white/10 border border-transparent"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <button
              type="button"
              onClick={() => onTabChange?.("manage")}
              aria-current={activeTab === "manage" ? "page" : undefined}
              aria-label="Manage Data"
              title="Manage Data"
              className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3.5 h-8 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === "manage"
                  ? "bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.35)] border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/20 dark:hover:bg-white/10 border border-transparent"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Manage Data</span>
            </button>
          </nav>
      </div>

      {/* 3. Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 justify-end">
        <div title="Local Only" className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 h-8 rounded-xl text-xs font-semibold border border-primary/30 bg-primary/10 text-primary shrink-0 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] select-none">
          <HardDrive className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Local Only</span>
          <span className="sr-only">Local Only</span>
        </div>
        <ModeToggle />
      </div>
    </header>
  )
}
