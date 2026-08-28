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

    const leftMetadataSpan = 3 + maxDynamicCols + 1;

    return (
      <BaseMatrix
        ref={ref}
        title="Staff Allocation & Capacity"
        countLabel={`${staffMembers.length} Staff Members`}
      >
        <thead>
          {/* Row 1: Super Header Category Grouping */}
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

          {/* Row 2: Column Headers */}
          <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 h-10">
            {/* STICKY TOP-8 & LEFT-0 WITH CONTROLLED Z-INDEX */}
            <th className="sticky top-8 left-0 z-20 bg-slate-50 border-r border-slate-200 text-left px-3 py-2 w-48 min-w-[192px] max-w-[192px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] align-middle">
              Staff
            </th>
            <th className="sticky top-8 z-10 bg-slate-50 border-r border-slate-200 text-center px-2 py-2 w-20 min-w-[80px] max-w-[80px] align-middle">
              Role
            </th>
            <th className="sticky top-8 z-10 bg-slate-50 border-r border-slate-200 text-center px-1.5 py-2 w-14 min-w-[56px] max-w-[56px] align-middle">
              FTE
            </th>

            {/* Dynamic Project Headers */}
            {Array.from({ length: maxDynamicCols }).map((_, idx) => {
              const proj = projects[idx];
              return (
                <th
                  key={idx}
                  className="sticky top-8 z-10 bg-slate-50 border-r border-slate-200 text-center px-2 py-1.5 w-24 min-w-[96px] max-w-[96px] align-middle"
                  title={proj?.name || ""}
                >
                  <span className="line-clamp-2 break-words leading-tight text-[11px] font-semibold text-slate-700">
                    {proj ? proj.name : ""}
                  </span>
                </th>
              );
            })}

            {/* # Project Column Header */}
            <th className="sticky top-8 z-10 bg-slate-50 border-r border-slate-200 text-center px-2 py-2 w-20 min-w-[80px] max-w-[80px] align-middle">
              # Project
            </th>

            {/* Timeline Month Headers */}
            {timelineMonths.map((m) => (
              <th
                key={m.key}
                className="sticky top-8 z-10 bg-slate-50 border-r border-slate-200 text-center px-1 py-2 w-[60px] min-w-[60px] uppercase text-[11px] font-bold text-slate-600 align-middle"
              >
                {m.shortMonth}
              </th>
            ))}
          </tr>
        </thead>

        {/* Standardized Table Body Typography: text-xs, font-medium, text-slate-700 */}
        <tbody className="divide-y divide-slate-200 text-xs font-medium text-slate-700 bg-white">
          {staffMembers.map((staff) => {
            const staffAssignments = assignments.filter(
              (a) => a.staffId === staff.id,
            );
            const activeProjectsCount = staffAssignments.length;

            return (
              <tr
                key={staff.id}
                className="group h-10 hover:bg-indigo-50/40 transition-colors duration-150"
              >
                {/* Staff Name */}
                <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 px-3 py-2 border-r border-slate-200 w-48 min-w-[192px] max-w-[192px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] transition-colors">
                  <span
                    className="line-clamp-1 truncate block"
                    title={staff.name}
                  >
                    {staff.name}
                  </span>
                </td>

                {/* Designation */}
                <td className="px-2 py-2 border-r border-slate-200 text-center w-20 min-w-[80px] max-w-[80px] truncate transition-colors">
                  {staff.designation}
                </td>

                {/* FTE */}
                <td className="px-1.5 py-2 border-r border-slate-200 text-center w-14 min-w-[56px] max-w-[56px] transition-colors">
                  {staff.fte}
                </td>

                {/* Dynamic Role Badges */}
                {Array.from({ length: maxDynamicCols }).map((_, idx) => {
                  const proj = projects[idx];
                  if (!proj) {
                    return (
                      <td
                        key={idx}
                        className="p-0 border-r border-slate-200 text-center w-24 min-w-[96px] bg-slate-50/50 group-hover:bg-indigo-50/20 transition-colors"
                      />
                    );
                  }
                  const role = getRole(staff.id!, proj.id!);
                  return (
                    <td
                      key={idx}
                      className="p-0 border-r border-slate-200 text-center w-24 min-w-[96px] h-10 transition-colors"
                    >
                      <RoleBadge role={role} fullCell />
                    </td>
                  );
                })}

                {/* Threshold Badge */}
                <td className="px-2 py-1.5 border-r border-slate-200 text-center w-20 min-w-[80px] max-w-[80px] transition-colors">
                  <div className="flex items-center justify-center">
                    <ThresholdBadge
                      count={activeProjectsCount}
                      threshold={maxProjectsPerStaff}
                      type="project"
                    />
                  </div>
                </td>

                {/* Timeline Heatmap Capacity Cells */}
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
                      className={`p-0 border-r border-slate-200 text-center w-[60px] min-w-[60px] h-10 transition-colors ${
                        hasCapacity && rawCapacity > 0
                          ? getHeatmapClass(rawCapacity)
                          : "bg-white group-hover:bg-indigo-50/30 text-slate-300"
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
