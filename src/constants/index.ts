export interface TimelineMonth {
  key: string; // e.g. "2026-August"
  month: string; // e.g. "August"
  shortMonth: string; // e.g. "Aug"
  year: number; // e.g. 2026
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Master list of month options for selection dropdowns
export const MASTER_MONTH_OPTIONS: TimelineMonth[] = (() => {
  const options: TimelineMonth[] = [];
  for (let year = 2025; year <= 2030; year++) {
    MONTH_NAMES.forEach((month) => {
      options.push({
        key: `${year}-${month}`,
        month,
        shortMonth: month.slice(0, 3),
        year,
      });
    });
  }
  return options;
})();

/**
 * Returns a key 17 months after startKey (total 18 months = 1.5 years)
 */
export const getDefaultEndKey = (startKey: string): string => {
  const [yStr, mStr] = startKey.split("-");
  const year = parseInt(yStr, 10);
  const mIdx = MONTH_NAMES.indexOf(mStr);
  if (isNaN(year) || mIdx === -1) return startKey;

  const endDate = new Date(year, mIdx + 17, 1);
  return `${endDate.getFullYear()}-${MONTH_NAMES[endDate.getMonth()]}`;
};

/**
 * Generates an array of TimelineMonth objects between startKey and endKey
 */
export const generateTimelineMonthsRange = (
  startKey: string,
  endKey: string,
): TimelineMonth[] => {
  const [sY, sM] = startKey.split("-");
  const [eY, eM] = endKey.split("-");

  const startYear = parseInt(sY, 10);
  const startMIdx = MONTH_NAMES.indexOf(sM);
  const endYear = parseInt(eY, 10);
  const endMIdx = MONTH_NAMES.indexOf(eM);

  if (
    isNaN(startYear) ||
    startMIdx === -1 ||
    isNaN(endYear) ||
    endMIdx === -1
  ) {
    return [];
  }

  const startDate = new Date(startYear, startMIdx, 1);
  const endDate = new Date(endYear, endMIdx, 1);

  if (startDate > endDate) return [];

  const timeline: TimelineMonth[] = [];
  let curr = new Date(startDate.getTime());

  while (curr <= endDate) {
    const year = curr.getFullYear();
    const month = MONTH_NAMES[curr.getMonth()];
    timeline.push({
      key: `${year}-${month}`,
      month,
      shortMonth: month.slice(0, 3),
      year,
    });
    curr.setMonth(curr.getMonth() + 1);
  }

  return timeline;
};

export const getYearGroups = (timelineMonths: TimelineMonth[]) => {
  return timelineMonths.reduce(
    (acc, m) => {
      acc[m.year] = (acc[m.year] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );
};

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
