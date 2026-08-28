import { forwardRef, useMemo } from "react";
import type { Staff, Project, Assignment } from "../db";
import { MONTH_NAMES, type TimelineMonth } from "../constants";
import { getHeatmapClass } from "../utils/styleHelpers";
import { RoleBadge } from "./common/RoleBadge";
import { BaseMatrix } from "./common/BaseMatrix";
import { ThresholdBadge } from "./common/ThresholdBadge";

interface StaffMatrixProps {
  staffMembers: Staff[];
  projects: Project[];
  assignments: Assignment[];
  timelineMonths: TimelineMonth[];
  getRole: (staffId: number, projectId: number) => string;
  maxDynamicCols: number;
  maxProjectsPerStaff?: number;
}

export const StaffMatrix = forwardRef<HTMLDivElement, StaffMatrixProps>(
  (
    {
      staffMembers,
      projects,
      assignments,
      timelineMonths = [],
      getRole,
      maxDynamicCols,
      maxProjectsPerStaff = 3,
    },
    ref,
  ) => {
    const prefixColsSpan = 3;

    // Calculate multi-year groupings dynamically
    const yearGroups = useMemo(() => {
      return timelineMonths.reduce<{ year: number; count: number }[]>(
        (acc, m) => {
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
      <BaseMatrix
        ref={ref}
        title="Staff Allocation & Capacity"
        countLabel={`${staffMembers.length} Staff Members`}
      >
        <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
          {/* Row 1: Super Header Category Grouping */}
          <tr className="bg-slate-100/80 border-b border-slate-200 h-8 text-xs font-bold text-slate-800">
            <th
              colSpan={prefixColsSpan}
              className="p-2 border-r border-slate-200 bg-slate-50/50"
            />
            <th
              colSpan={maxDynamicCols}
              className="p-2 border-r border-slate-200 text-center font-bold text-xs text-slate-800 tracking-wider uppercase bg-slate-100/80 align-middle"
            >
              PROJECT
            </th>
            <th className="p-2 border-r border-slate-200 bg-slate-50/50" />
            {yearGroups.map((g, idx) => (
              <th
                key={`${g.year}-${idx}`}
                colSpan={g.count}
                className="p-2 border-r border-slate-200 text-center font-bold text-xs text-slate-800 tracking-wider uppercase bg-slate-100/80 align-middle"
              >
                {g.year}
              </th>
            ))}
          </tr>

          {/* Row 2: Specific Column Headers */}
          <tr className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200 h-8 text-xs">
            <th className="sticky left-0 z-30 bg-slate-50 p-2 border-r border-slate-200 text-left w-44 min-w-[176px] font-bold text-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] align-middle">
              Staff
            </th>
            <th className="p-2 border-r border-slate-200 text-center font-bold text-slate-800 w-20 min-w-[80px] align-middle">
              Role
            </th>
            <th className="p-2 border-r border-slate-200 text-center font-bold text-slate-800 w-12 min-w-[48px] align-middle">
              FTE
            </th>

            {Array.from({ length: maxDynamicCols }).map((_, idx) => {
              const proj = projects[idx];
              return (
                <th
                  key={idx}
                  className="p-2 border-r border-slate-200 text-center font-bold text-slate-800 w-20 min-w-[80px] max-w-[80px] align-middle"
                  title={proj?.name || ""}
                >
                  <span className="line-clamp-2 break-words leading-tight block">
                    {proj ? proj.name : ""}
                  </span>
                </th>
              );
            })}

            <th className="p-2 border-r border-slate-200 text-center font-bold text-slate-800 w-20 min-w-[80px] max-w-[80px] align-middle">
              # Project
            </th>

            {timelineMonths.map((m) => (
              <th
                key={m.key}
                className="p-2 border-r border-slate-200 text-center font-bold text-slate-800 w-[60px] min-w-[60px] uppercase align-middle"
              >
                {m.shortMonth}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-200/80">
          {staffMembers.map((staff) => {
            const staffAssignments = assignments.filter(
              (a) => a.staffId === staff.id,
            );
            const activeProjectsCount = staffAssignments.length;

            return (
              <tr
                key={staff.id}
                className="group h-9 transition-colors duration-150 relative"
              >
                <td className="sticky left-0 z-20 bg-white group-hover:bg-blue-100 p-2 border-r border-slate-200 font-semibold text-slate-800 group-hover:text-blue-950 w-44 min-w-[176px] max-w-[176px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span
                    className="line-clamp-2 break-words leading-snug block pl-1"
                    title={staff.name}
                  >
                    {staff.name}
                  </span>
                </td>

                <td className="p-2 border-r border-slate-200 group-hover:bg-blue-100 text-slate-500 group-hover:text-blue-900 font-medium truncate max-w-[80px] text-center transition-colors">
                  {staff.designation}
                </td>
                <td className="p-2 border-r border-slate-200 group-hover:bg-blue-100 text-center font-mono text-slate-600 group-hover:text-blue-950 w-12 min-w-[48px] transition-colors">
                  {staff.fte}
                </td>

                {Array.from({ length: maxDynamicCols }).map((_, idx) => {
                  const proj = projects[idx];
                  if (!proj) {
                    return (
                      <td
                        key={idx}
                        className="p-0 border-r border-slate-200 text-center w-20 min-w-[80px] bg-slate-50 group-hover:bg-blue-50 transition-colors"
                      />
                    );
                  }
                  const role = getRole(staff.id!, proj.id!);
                  return (
                    <td
                      key={idx}
                      className="p-0 border-r border-slate-200 group-hover:bg-blue-100 text-center w-20 min-w-[80px] h-9 transition-colors"
                    >
                      <RoleBadge role={role} fullCell />
                    </td>
                  );
                })}

                <td className="p-2 border-r border-slate-200 group-hover:bg-blue-100/70 text-center w-20 min-w-[80px] max-w-[80px] transition-colors">
                  <div className="flex items-center justify-center">
                    <ThresholdBadge
                      count={activeProjectsCount}
                      threshold={maxProjectsPerStaff}
                      type="project"
                    />
                  </div>
                </td>

                {timelineMonths.map((m) => {
                  const monthIdx = MONTH_NAMES.indexOf(m.month);
                  const monthNum = String(monthIdx + 1).padStart(2, "0");
                  const numKey = `${m.year}-${monthNum}`;
                  const shortKey = `${m.year}-${m.shortMonth}`;

                  const rawCapacity =
                    staff.monthlyCapacity?.[numKey] ??
                    staff.monthlyCapacity?.[m.key] ??
                    staff.monthlyCapacity?.[shortKey] ??
                    (staff as any).capacity;

                  const hasCapacity =
                    rawCapacity !== undefined && rawCapacity !== null;

                  return (
                    <td
                      key={m.key}
                      className={`p-0 border-r border-slate-200 text-center w-[60px] min-w-[60px] h-9 font-mono transition-colors ${
                        hasCapacity && rawCapacity > 0
                          ? `${getHeatmapClass(rawCapacity)} group-hover:ring-1 group-hover:ring-blue-400 group-hover:z-10`
                          : "bg-white group-hover:bg-blue-100 text-slate-300 group-hover:text-blue-900"
                      }`}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        {hasCapacity && rawCapacity > 0
                          ? `${rawCapacity}%`
                          : ""}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </BaseMatrix>
    );
  },
);

StaffMatrix.displayName = "StaffMatrix";
