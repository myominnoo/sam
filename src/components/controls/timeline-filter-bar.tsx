import { useState, useRef, useEffect } from "react"
import { Calendar, SlidersHorizontal, X } from "lucide-react"
import { getCurrentYearMonth, calculateEndMonth, generateMonthOptions } from "@/lib/date-utils"

export const PRESET_OPTIONS = [1, 3, 6, 9, 12, 24, 36, 48] as const

interface TimelineFilterBarProps {
  preset?: number
  startMonth?: string
  endMonth?: string
  onTimelineChange?: (timeline: { preset: number; startMonth: string; endMonth: string }) => void
}

export function TimelineFilterBar({
  preset: initialPreset = 12,
  startMonth: initialStartMonth = getCurrentYearMonth(),
  endMonth: initialEndMonth,
  onTimelineChange,
}: TimelineFilterBarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [preset, setPreset] = useState<number>(initialPreset)
  const [startMonth, setStartMonth] = useState<string>(initialStartMonth)
  const [endMonth, setEndMonth] = useState<string>(
    initialEndMonth || calculateEndMonth(initialStartMonth, initialPreset)
  )

  const popoverRef = useRef<HTMLDivElement>(null)
  const monthOptions = generateMonthOptions()

  // Close popup on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Handle Preset Selection Change -> Recalculate End Month from Start Month
  const handlePresetChange = (newPreset: number) => {
    setPreset(newPreset)
    const newEndMonth = calculateEndMonth(startMonth, newPreset)
    setEndMonth(newEndMonth)
    onTimelineChange?.({ preset: newPreset, startMonth, endMonth: newEndMonth })
  }

  // Handle Start Month Change -> Keep Preset & Update End Month
  const handleStartMonthChange = (newStartMonth: string) => {
    setStartMonth(newStartMonth)
    const newEndMonth = calculateEndMonth(newStartMonth, preset)
    setEndMonth(newEndMonth)
    onTimelineChange?.({ preset, startMonth: newStartMonth, endMonth: newEndMonth })
  }

  // Handle Manual End Month Change
  const handleEndMonthChange = (newEndMonth: string) => {
    setEndMonth(newEndMonth)
    onTimelineChange?.({ preset, startMonth, endMonth: newEndMonth })
  }

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      {/* Trigger Filter Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 h-8 rounded-xl bg-neutral-200/40 dark:bg-neutral-800/40 border border-neutral-300/60 dark:border-neutral-700/60 backdrop-blur-md text-xs font-semibold text-foreground hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition-all shadow-2xs cursor-pointer select-none"
      >
        <SlidersHorizontal className="h-3.5 w-3.5 text-primary shrink-0" />
        <span>Timeline Window</span>
        <span className="ml-1 px-1.5 py-0.2 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
          {preset}M
        </span>
      </button>

      {/* Floating Popup Control Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 p-3.5 rounded-2xl border border-neutral-300/80 dark:border-neutral-700/80 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl backdrop-saturate-150 shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold text-foreground uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>Configure Timeline</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            {/* Preset Selector */}
            <div className="flex flex-col gap-1">
              <label className="text-muted-foreground font-semibold text-[11px]">Preset Duration</label>
              <select
                value={preset}
                onChange={(e) => handlePresetChange(Number(e.target.value))}
                className="bg-white/60 dark:bg-neutral-900/60 border border-neutral-300/80 dark:border-neutral-700/80 rounded-lg px-2.5 h-7 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {PRESET_OPTIONS.map((months) => (
                  <option key={months} value={months}>
                    {months} {months === 1 ? "Month" : "Months"}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Selectors */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-muted-foreground font-semibold text-[11px]">Start Month</label>
                <select
                  value={startMonth}
                  onChange={(e) => handleStartMonthChange(e.target.value)}
                  className="bg-white/60 dark:bg-neutral-900/60 border border-neutral-300/80 dark:border-neutral-700/80 rounded-lg px-2 h-7 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  {monthOptions.map((opt) => (
                    <option key={`start-${opt.value}`} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-muted-foreground font-semibold text-[11px]">End Month</label>
                <select
                  value={endMonth}
                  onChange={(e) => handleEndMonthChange(e.target.value)}
                  className="bg-white/60 dark:bg-neutral-900/60 border border-neutral-300/80 dark:border-neutral-700/80 rounded-lg px-2 h-7 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  {monthOptions.map((opt) => (
                    <option key={`end-${opt.value}`} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}