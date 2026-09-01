import { useMemo } from "react"
import { generateMonthRange } from "@/lib/date-utils"

export function useMatrixTimeline(startMonth: string, endMonth: string) {
  const months = useMemo(() => {
    const [startYear, startM] = startMonth.split("-").map(Number)
    const [endYear, endM] = endMonth.split("-").map(Number)
    const totalMonths = (endYear - startYear) * 12 + (endM - startM) + 1
    return generateMonthRange(startMonth, Math.max(1, totalMonths))
  }, [startMonth, endMonth])

  const yearGroups = useMemo(() => {
    const groups: { year: number; span: number }[] = []
    months.forEach((m) => {
      const lastGroup = groups[groups.length - 1]
      if (lastGroup && lastGroup.year === m.year) {
        lastGroup.span += 1
      } else {
        groups.push({ year: m.year, span: 1 })
      }
    })
    return groups
  }, [months])

  return { months, yearGroups }
}