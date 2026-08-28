import { useMemo } from "react";
import type { TimelineMonth } from "../../constants";

interface MatrixSuperHeaderProps {
  timelineMonths: TimelineMonth[];
  leftMetadataSpan: number;
}

export const MatrixSuperHeader = ({
  timelineMonths,
  leftMetadataSpan,
}: MatrixSuperHeaderProps) => {
  const yearGroups = useMemo(() => {
    if (!Array.isArray(timelineMonths) || timelineMonths.length === 0) {
      return [];
    }

    return timelineMonths.reduce<{ year: number; count: number }[]>(
      (acc, m) => {
        if (!m || typeof m.year !== "number") return acc;

        const lastGroup = acc[acc.length - 1];
        if (lastGroup && lastGroup.year === m.year) {
          lastGroup.count += 1;
        } else {
          acc.push({ year: m.year, count: 1 });
        }
        return acc;
      },
      [],
    );
  }, [timelineMonths]);

  return (
    <tr className="bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-700 h-8">
      <th
        colSpan={leftMetadataSpan}
        className="sticky top-0 z-10 bg-slate-100 border-r border-slate-200 px-3 py-1.5"
      />
      {yearGroups.map((g, idx) => (
        <th
          key={`${g.year}-${idx}`}
          colSpan={g.count}
          className="sticky top-0 z-10 bg-slate-100 border-r border-slate-200 text-center font-bold text-slate-700 tracking-wider uppercase px-2 py-1.5 align-middle"
        >
          {g.year}
        </th>
      ))}
    </tr>
  );
};
