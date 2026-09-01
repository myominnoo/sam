import type { MonthHeader } from "@/types/sam"

// Format a Date object into YYYY-MM
export function formatDateToYearMonth(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

// Get current month in YYYY-MM format
export function getCurrentYearMonth(): string {
  return formatDateToYearMonth(new Date())
}

// Calculate End Month given a Start Month (YYYY-MM) and Duration in Months
export function calculateEndMonth(startYearMonth: string, durationMonths: number): string {
  const [yearStr, monthStr] = startYearMonth.split("-")
  const date = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1)

  // Add duration (subtracting 1 for inclusive range)
  date.setMonth(date.getMonth() + (durationMonths - 1))
  return formatDateToYearMonth(date)
}

// Generate sequential MonthHeader objects across a month range span
export function generateMonthRange(startYearMonth: string, totalMonths: number): MonthHeader[] {
  const [yearStr, monthStr] = startYearMonth.split("-")
  let currentYear = parseInt(yearStr, 10)
  let currentMonth = parseInt(monthStr, 10) - 1 // 0-indexed (0 = Jan)

  const months: MonthHeader[] = []
  const monthLabels = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]

  for (let i = 0; i < totalMonths; i++) {
    const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`
    months.push({
      key: monthKey,
      year: currentYear,
      monthLabel: monthLabels[currentMonth],
    })

    currentMonth++
    if (currentMonth > 11) {
      currentMonth = 0
      currentYear++
    }
  }

  return months
}

// Generate dropdown options list for Start/End months
export function generateMonthOptions(startOffsetYears = -1, totalYears = 6): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = []
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const baseYear = new Date().getFullYear() + startOffsetYears
  for (let year = baseYear; year < baseYear + totalYears; year++) {
    for (let month = 0; month < 12; month++) {
      const val = `${year}-${String(month + 1).padStart(2, "0")}`
      const label = `${monthNames[month]} ${year}`
      options.push({ value: val, label })
    }
  }
  return options
}