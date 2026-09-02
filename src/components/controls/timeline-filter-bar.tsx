import { useState, useRef, useEffect } from "react"
import { Calendar, SlidersHorizontal, X } from "lucide-react"
import { getCurrentYearMonth, calculateEndMonth, generateMonthOptions } from "@/lib/date-utils"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const PRESET_OPTIONS = [6, 12, 24, 36, 48] as const

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
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
  }, [])

  const keepPopoverOpen = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    setIsOpen(true)
  }

  const schedulePopoverClose = () => {
    closeTimerRef.current = setTimeout(() => setIsOpen(false), 150)
  }

  const startMonthIndex = Math.max(0, monthOptions.findIndex((month) => month.value === startMonth))
  const endMonthIndex = Math.max(startMonthIndex, monthOptions.findIndex((month) => month.value === endMonth))

  const handleRangeChange = ([newStartIndex, newEndIndex]: readonly number[]) => {
    const newStartMonth = monthOptions[newStartIndex]?.value ?? startMonth
    const newEndMonth = monthOptions[newEndIndex]?.value ?? endMonth
    const newPreset = newEndIndex - newStartIndex + 1

    setStartMonth(newStartMonth)
    setEndMonth(newEndMonth)
    setPreset(newPreset)
    onTimelineChange?.({ preset: newPreset, startMonth: newStartMonth, endMonth: newEndMonth })
  }

  const handlePresetChange = ([presetValue]: string[]) => {
    const selectedPreset = Number(presetValue)
    if (!selectedPreset) return

    const newEndIndex = Math.min(startMonthIndex + selectedPreset - 1, monthOptions.length - 1)
    handleRangeChange([startMonthIndex, newEndIndex])
  }

  const selectedPreset = PRESET_OPTIONS.includes(preset as (typeof PRESET_OPTIONS)[number])
    ? [String(preset)]
    : []

  return (
    <div
      className="relative inline-block text-left"
      ref={popoverRef}
      onPointerEnter={keepPopoverOpen}
      onPointerLeave={schedulePopoverClose}
    >
      {/* Trigger Filter Button */}
      <button
        type="button"
        onPointerEnter={keepPopoverOpen}
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
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground font-semibold text-[11px]">Preset months</span>
              <ToggleGroup
                aria-label="Timeline duration preset"
                value={selectedPreset}
                onValueChange={handlePresetChange}
              >
                {PRESET_OPTIONS.map((months) => (
                  <ToggleGroupItem
                    key={months}
                    value={String(months)}
                    aria-label={`${months} months`}
                    className="data-pressed:bg-primary data-pressed:text-primary-foreground data-pressed:shadow-md data-pressed:ring-1 data-pressed:ring-primary/30"
                  >
                    {months}M
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Start</span>
                  <span className="font-semibold text-foreground">{monthOptions[startMonthIndex]?.label}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">End</span>
                  <span className="font-semibold text-foreground">{monthOptions[endMonthIndex]?.label}</span>
                </div>
              </div>
              <Slider
                min={0}
                max={monthOptions.length - 1}
                step={1}
                value={[startMonthIndex, endMonthIndex]}
                thumbCollisionBehavior="none"
                onValueChange={handleRangeChange}
              />
              <p className="text-center text-[11px] font-medium text-muted-foreground">
                {preset} {preset === 1 ? "month" : "months"} selected
                {selectedPreset.length === 0 ? " · Custom range" : ""}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
