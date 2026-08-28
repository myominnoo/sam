import { forwardRef } from "react";
import type { Staff, Project, Assignment } from "../db";
import type { TimelineMonth } from "../constants";
import { getHeatmapClass } from "../utils/styleHelpers";
import { RoleBadge } from "./common/RoleBadge";
import { BaseMatrix } from "./common/BaseMatrix";

interface StaffMatrixProps {
  staffMembers: Staff[];
  projects: Project[];
  assignments: Assignment[];
  timelineMonths: TimelineMonth[];
  getRole: (staffId: number, projectId: number) => string;
  maxDynamicCols: number;
}

export const StaffMatrix = forwardRef<HTMLDivElement, StaffMatrixProps>(
  (
    {
      staffMembers,
      projects,
      assignments,
      timelineMonths,
      getRole,
      maxDynamicCols,
    },
    ref,
  ) => {
    // 3 Fixed Columns (Staff Name, Role, FTE) + maxDynamicCols + 1 (# Project)
    const prefixColsSpan = 3 + maxDynamicCols + 1;

    return (
      <BaseMatrix
        ref={ref}
        title="Staff Allocation Matrix"
        countLabel={`${staffMembers.length} Staff Members`}
        timelineMonths={timelineMonths}
        prefixColsSpan={prefixColsSpan}
      >
        <thead>
          <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 h-7 text-[10px] tracking-wider">
            <th className="sticky left-0 z-30 bg-slate-50 p-2 border-r border-slate-200 text-left w-44 min-w-[176px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
              Staff
            </th>
            <th className="p-2 border-r border-slate-200 text-left w-20 min-w-[80px]">
              Role
            </th>
            <th className="p-2 border-r border-slate-200 text-center w-12 min-w-[48px]">
              FTE
            </th>

            {Array.from({ length: maxDynamicCols }).map((_, idx) => {
              const proj = projects[idx];
              return (
                <th
                  key={idx}
                  className="p-2 border-r border-slate-200 text-center w-20 min-w-[80px] max-w-[80px] truncate"
                  title={proj?.name || ""}
                >
                  {proj ? proj.name : ""}
                </th>
              );
            })}

            <th className="p-2 border-r border-slate-200 text-center w-16 min-w-[64px]">
              # Project
            </th>

            {timelineMonths.map((m) => (
              <th
                key={m.key}
                className="p-1 border-r border-slate-200 text-center w-[60px] min-w-[60px] uppercase"
              >
                {m.shortMonth}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-200">
          {staffMembers.map((staff) => {
            const staffAssignments = assignments.filter(
              (a) => a.staffId === staff.id,
            );
            const activeProjectsCount = staffAssignments.length;

            return (
              <tr key={staff.id} className="hover:bg-slate-50 h-9">
                <td className="sticky left-0 z-20 bg-white group-hover:bg-slate-50 p-2 border-r border-slate-200 font-semibold text-slate-800 truncate max-w-[176px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  {staff.name}
                </td>

                <td className="p-2 border-r border-slate-200 text-slate-500 font-medium truncate max-w-[80px]">
                  {staff.designation}
                </td>
                <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-600 w-12 min-w-[48px]">
                  {staff.fte}
                </td>

                {/* DYNAMIC PROJECT ASSIGNMENTS */}
                {Array.from({ length: maxDynamicCols }).map((_, idx) => {
                  const proj = projects[idx];
                  if (!proj) {
                    return (
                      <td
                        key={idx}
                        className="p-0 border-r border-slate-200 text-center w-20 min-w-[80px] bg-slate-50/50"
                      />
                    );
                  }
                  const role = getRole(staff.id!, proj.id!);
                  return (
                    <td
                      key={idx}
                      className="p-0 border-r border-slate-200 text-center w-20 min-w-[80px] h-9"
                    >
                      <RoleBadge role={role} fullCell />
                    </td>
                  );
                })}

                <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-700 w-16 min-w-[64px]">
                  {activeProjectsCount}
                </td>

                {/* CAPACITY HEATMAP */}
                {timelineMonths.map((m) => {
                  const rawCapacity =
                    staff.monthlyCapacity?.[m.key] ?? (staff as any).capacity;
                  const hasCapacity =
                    rawCapacity !== undefined && rawCapacity !== null;

                  return (
                    <td
                      key={m.key}
                      className={`p-0 border-r border-slate-200 text-center w-[60px] min-w-[60px] h-9 font-mono ${
                        hasCapacity
                          ? getHeatmapClass(rawCapacity)
                          : "bg-white text-slate-300"
                      }`}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        {hasCapacity ? `${rawCapacity}%` : ""}
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
