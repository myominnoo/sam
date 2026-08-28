export interface TimelineMonth {
  key: string;
  month: string;
  shortMonth: string;
  year: number;
}

export const PROJECT_ROLE_LEGEND = [
  { code: "PL", name: "Project Lead" },
  { code: "M", name: "Member" },
  { code: "A", name: "Assisting" },
] as const;

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

export const DURATION_OPTIONS = [
  { label: "3 Months", value: "3" },
  { label: "6 Months", value: "6" },
  { label: "12 Months (1 Yr)", value: "12" },
  { label: "18 Months", value: "18" },
  { label: "24 Months (2 Yrs)", value: "24" },
  { label: "36 Months (3 Yrs)", value: "36" },
  { label: "48 Months (4 Yrs)", value: "48" },
];

export const MASTER_MONTH_OPTIONS: TimelineMonth[] = (() => {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 1;
  const endYear = currentYear + 3;

  const options: TimelineMonth[] = [];
  for (let year = startYear; year <= endYear; year++) {
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

export const getDefaultEndKey = (startKey: string): string => {
  const [yStr, mStr] = startKey.split("-");
  const year = parseInt(yStr, 10);
  const mIdx = MONTH_NAMES.indexOf(mStr);
  if (isNaN(year) || mIdx === -1) return startKey;

  const endDate = new Date(year, mIdx + 17, 1);
  return `${endDate.getFullYear()}-${MONTH_NAMES[endDate.getMonth()]}`;
};

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

export const getEndKeyForDuration = (
  startKey: string,
  durationMonths: number,
): string => {
  const [yStr, mStr] = startKey.split("-");
  const year = parseInt(yStr, 10);
  const mIdx = MONTH_NAMES.indexOf(mStr);
  if (isNaN(year) || mIdx === -1) return startKey;

  const endDate = new Date(year, mIdx + durationMonths - 1, 1);
  return `${endDate.getFullYear()}-${MONTH_NAMES[endDate.getMonth()]}`;
};
