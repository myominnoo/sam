import { forwardRef } from "react";
import type { Staff, Project, Assignment } from "../db";
import { getYearGroups } from "../constants";
import type { TimelineMonth } from "../constants";
import { getRoleBadgeClass, getHeatmapClass } from "../utils/styleHelpers";

interface StaffMatrixProps {
  staffMembers: Staff[];
  projects: Project[];
  assignments: Assignment[];
  timelineMonths: TimelineMonth[];
  getRole: (staffId: number, projectId: number) => string;
  leftSideWidth: number;
}

export const StaffMatrix = forwardRef<HTMLDivElement, StaffMatrixProps>(
  (
    {
      staffMembers,
      projects,
      assignments,
      timelineMonths,
      getRole,
      leftSideWidth,
    },
    ref,
  ) => {
    const currentLeftWidth = 345 + projects.length * 90;
    const paddingWidth = Math.max(0, leftSideWidth - currentLeftWidth);
    const totalMinWidth = leftSideWidth + timelineMonths.length * 60;
    const yearGroups = getYearGroups(timelineMonths);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center flex-wrap gap-2">
          <h2 className="font-semibold text-slate-800">
            Staff Allocation & Capacity Matrix
          </h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-yellow-300 border border-yellow-400 rounded"></span>{" "}
              Project Lead (PL)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-emerald-400 border border-emerald-500 rounded"></span>{" "}
              Member (M)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-amber-400 border border-amber-500 rounded"></span>{" "}
              Assisting (A)
            </span>
          </div>
        </div>

        <div ref={ref} className="table-container overflow-x-auto">
          <table
            style={{ minWidth: `${totalMinWidth}px` }}
            className="w-full text-left border-collapse text-xs table-fixed"
          >
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th
                  rowSpan={2}
                  className="p-3 border-r border-slate-200 sticky left-0 bg-slate-100 z-20 w-[170px] align-middle"
                >
                  Staff Name
                </th>
                <th
                  rowSpan={2}
                  className="p-3 border-r border-slate-200 align-middle w-[60px]"
                >
                  Role
                </th>
                <th
                  rowSpan={2}
                  className="p-3 border-r border-slate-200 text-center align-middle w-[50px]"
                >
                  FTE
                </th>
                {projects.map((p) => (
                  <th
                    key={p.id}
                    rowSpan={2}
                    className="p-2 border-r border-slate-200 text-center font-semibold text-slate-700 w-[90px] align-middle truncate"
                    title={p.name}
                  >
                    {p.name}
                  </th>
                ))}
                <th
                  rowSpan={2}
                  className="p-3 border-r border-slate-200 text-center bg-slate-200/50 align-middle w-[65px]"
                >
                  # Proj
                </th>

                {/* Dynamic width balancer spacer column */}
                {paddingWidth > 0 && (
                  <th
                    rowSpan={2}
                    style={{ width: `${paddingWidth}px` }}
                    className="border-r border-slate-200 bg-slate-100/40"
                  />
                )}

                {Object.entries(yearGroups).map(([year, count]) => (
                  <th
                    key={year}
                    colSpan={count}
                    className="p-1.5 border-r border-slate-300 text-center font-bold text-slate-800 bg-slate-200/60 border-b"
                  >
                    {year}
                  </th>
                ))}
              </tr>

              <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                {timelineMonths.map((m) => (
                  <th
                    key={m.key}
                    className="p-2 border-r border-slate-200 text-center font-semibold text-slate-700 w-[60px]"
                    title={`${m.month} ${m.year}`}
                  >
                    {m.shortMonth}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {staffMembers.map((staff) => {
                const activeProjCount = assignments.filter(
                  (a) => a.staffId === staff.id,
                ).length;
                return (
                  <tr key={staff.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 border-r border-slate-200 font-semibold text-slate-900 sticky left-0 bg-white z-10 w-[170px] truncate">
                      {staff.name}
                    </td>
                    <td className="p-3 border-r border-slate-200 text-slate-500 w-[60px]">
                      {staff.designation}
                    </td>
                    <td className="p-3 border-r border-slate-200 text-center font-mono w-[50px]">
                      {staff.fte}
                    </td>
                    {projects.map((p) => {
                      const role = getRole(staff.id!, p.id!);
                      return (
                        <td
                          key={p.id}
                          className={`p-2 border-r border-slate-200 text-center w-[90px] ${getRoleBadgeClass(role)}`}
                        >
                          {role}
                        </td>
                      );
                    })}
                    <td className="p-3 border-r border-slate-200 text-center font-bold bg-slate-50 w-[65px]">
                      {activeProjCount}
                    </td>

                    {/* Spacer cell matching header */}
                    {paddingWidth > 0 && (
                      <td
                        style={{ width: `${paddingWidth}px` }}
                        className="border-r border-slate-200 bg-slate-50/30"
                      />
                    )}

                    {timelineMonths.map((m) => (
                      <td
                        key={m.key}
                        className={`p-2 border-r border-slate-200 text-center w-[60px] ${getHeatmapClass(staff.capacity)}`}
                      >
                        {staff.capacity ?? 100}%
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  },
);

StaffMatrix.displayName = "StaffMatrix";
