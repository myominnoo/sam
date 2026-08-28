import { forwardRef, useMemo, type ReactNode } from "react";
import type { TimelineMonth } from "../../constants";

interface BaseMatrixProps {
  title: string;
  countLabel: string;
  timelineMonths: TimelineMonth[];
  prefixColsSpan: number;
  dynamicColsCount?: number;
  groupLabel?: string;
  children: ReactNode;
}

export const BaseMatrix = forwardRef<HTMLDivElement, BaseMatrixProps>(
  (
    {
      title,
      countLabel,
      timelineMonths = [],
      prefixColsSpan,
      dynamicColsCount = 0,
      groupLabel,
      children,
    },
    ref,
  ) => {
    const yearGroups = useMemo(() => {
      return timelineMonths.reduce<{ year: number; count: number }[]>(
        (acc, m) => {
          const last = acc[acc.length - 1];
          if (last && last.year === m.year) {
            last.count += 1;
          } else {
            acc.push({ year: m.year, count: 1 });
          }
          return acc;
        },
        [],
      );
    }, [timelineMonths]);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 text-sm">{title}</h2>
          <span className="text-xs text-slate-500 font-medium">
            {countLabel}
          </span>
        </div>

        <div className="overflow-x-auto" ref={ref}>
          <table className="text-xs border-collapse w-full min-w-max">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 h-6 text-[11px]">
                {prefixColsSpan > 0 && (
                  <th
                    colSpan={prefixColsSpan}
                    className="bg-slate-100 border-r border-slate-200"
                  />
                )}

                {dynamicColsCount > 0 && (
                  <th
                    colSpan={dynamicColsCount}
                    className="p-1 border-r border-slate-200 text-center tracking-wider bg-slate-100 uppercase text-[10px] text-slate-600"
                  >
                    {groupLabel}
                  </th>
                )}

                <th className="bg-slate-100 border-r border-slate-200" />

                {yearGroups.map((g, idx) => (
                  <th
                    key={`${g.year}-${idx}`}
                    colSpan={g.count}
                    className="p-1 border-r border-slate-200 text-center tracking-wider bg-slate-100"
                  >
                    {g.year}
                  </th>
                ))}
              </tr>
            </thead>
            {children}
          </table>
        </div>
      </div>
    );
  },
);

BaseMatrix.displayName = "BaseMatrix";
