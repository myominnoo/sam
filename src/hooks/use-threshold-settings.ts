import { useEffect, useState } from "react"

export interface ThresholdSettings {
  maxProjectsPerStaff: number
  maxStaffPerProject: number
}

export const DEFAULT_THRESHOLDS: ThresholdSettings = {
  maxProjectsPerStaff: 3,
  maxStaffPerProject: 4,
}

function readThresholds(): ThresholdSettings {
  try {
    const saved = localStorage.getItem("sam_flagging_thresholds")
    if (!saved) return DEFAULT_THRESHOLDS
    const parsed = JSON.parse(saved) as Partial<ThresholdSettings>
    return {
      maxProjectsPerStaff: Number.isFinite(parsed.maxProjectsPerStaff) ? Number(parsed.maxProjectsPerStaff) : DEFAULT_THRESHOLDS.maxProjectsPerStaff,
      maxStaffPerProject: Number.isFinite(parsed.maxStaffPerProject) ? Number(parsed.maxStaffPerProject) : DEFAULT_THRESHOLDS.maxStaffPerProject,
    }
  } catch {
    return DEFAULT_THRESHOLDS
  }
}

/** Keeps dashboard indicators aligned with the limits configured in Manage Data. */
export function useThresholdSettings() {
  const [thresholds, setThresholds] = useState(readThresholds)

  useEffect(() => {
    const refresh = () => setThresholds(readThresholds())
    window.addEventListener("storage", refresh)
    window.addEventListener("sam:thresholds-changed", refresh)
    return () => {
      window.removeEventListener("storage", refresh)
      window.removeEventListener("sam:thresholds-changed", refresh)
    }
  }, [])

  return thresholds
}
