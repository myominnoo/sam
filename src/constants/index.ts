export interface TimelineMonth {
  key: string; // e.g. "2026-Aug"
  month: string; // e.g. "Aug"
  year: number; // e.g. 2026
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Dynamically generates a timeline starting from the current month of today's date
 * @param startOffsetMonths Number of months prior to current month (default 0)
 * @param totalMonths Total month span to include (default 18 for 1.5 years)
 */
export const generateTimelineMonths = (
  totalMonths: number = 18,
  startOffsetMonths: number = 0,
): TimelineMonth[] => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth(); // 0-indexed (Aug = 7)

  const timeline: TimelineMonth[] = [];
  const startIdx = currentMonthIdx - startOffsetMonths;

  for (let i = 0; i < totalMonths; i++) {
    const targetIdx = startIdx + i;
    const date = new Date(currentYear, targetIdx, 1);
    const year = date.getFullYear();
    const month = MONTH_NAMES[date.getMonth()];

    timeline.push({
      key: `${year}-${month}`,
      month,
      year,
    });
  }

  return timeline;
};

/**
 * Calculates dynamic year grouping for header colSpans
 */
export const getYearGroups = (timelineMonths: TimelineMonth[]) => {
  return timelineMonths.reduce(
    (acc, m) => {
      acc[m.year] = (acc[m.year] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );
};

/**
 * Calculates total minimum table width dynamically based on visible timeline length
 */
export const getDynamicTableMinWidth = (
  leftSideWidthPx: number = 280,
  projectColsWidthPx: number = 0,
  timelineLength: number = 18,
  monthColWidthPx: number = 60,
): string => {
  const total =
    leftSideWidthPx + projectColsWidthPx + timelineLength * monthColWidthPx;
  return `${total}px`;
};
