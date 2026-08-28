import React, { forwardRef } from "react";
import type { Staff, Project, Assignment } from "../db";
import { getYearGroups, getDynamicTableMinWidth } from "../constants";
import type { TimelineMonth } from "../constants";
import { getRoleBadgeClass } from "../utils/styleHelpers";

interface ProjectMatrixProps {
  staffMembers: Staff[];
  projects: Project[];
  assignments: Assignment[];
  timelineMonths: TimelineMonth[];
  getRole: (staffId: number, projectId: number) => string;
}

export const ProjectMatrix = forwardRef<HTMLDivElement, ProjectMatrixProps>(
  ({ staffMembers, projects, assignments, timelineMonths, getRole }, ref) => {
    const dynamicMinWidth = getDynamicTableMinWidth(
      345,
      staffMembers.length * 90,
      timelineMonths.length,
      60,
    );
    const yearGroups = getYearGroups(timelineMonths);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <h2 className="font-semibold text-slate-800">
            Project Timeline & Staffing
          </h2>
        </div>

        <div ref={ref} className="table-container overflow-x-auto">
          <table
            style={{ minWidth: dynamicMinWidth }}
            className="w-full text-left border-collapse text-xs table-fixed"
          >
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th
                  rowSpan={2}
                  className="p-3 border-r border-slate-200 sticky left-0 bg-slate-100 z-20 w-[280px] align-middle"
                >
                  Project Name
                </th>

                {staffMembers.map((s) => (
                  <th
                    key={s.id}
                    rowSpan={2}
                    className="p-2 border-r border-slate-200 text-center font-semibold text-slate-700 w-[90px] align-middle truncate"
                    title={s.name}
                  >
                    {s.name.split(" ")[0]}
                  </th>
                ))}

                <th
                  rowSpan={2}
                  className="p-3 border-r border-slate-200 text-center bg-slate-200/50 align-middle w-[65px]"
                >
                  # Staff
                </th>

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
                  >
                    {m.month}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {projects.map((proj) => {
                const assignedStaffCount = assignments.filter(
                  (a) => a.projectId === proj.id,
                ).length;
                const activeMonths = proj.activeMonths || ["Aug", "Sep", "Oct"];

                return (
                  <tr key={proj.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 border-r border-slate-200 font-semibold text-slate-900 sticky left-0 bg-white z-10 w-[280px] truncate">
                      {proj.name}
                    </td>
                    {staffMembers.map((staff) => {
                      const role = getRole(staff.id!, proj.id!);
                      return (
                        <td
                          key={staff.id}
                          className={`p-2 border-r border-slate-200 text-center w-[90px] ${getRoleBadgeClass(role)}`}
                        >
                          {role}
                        </td>
                      );
                    })}
                    <td className="p-3 border-r border-slate-200 text-center font-bold bg-slate-50 w-[65px]">
                      {assignedStaffCount}
                    </td>

                    {timelineMonths.map((m) => {
                      const isActive = activeMonths.includes(m.month);
                      return (
                        <td
                          key={m.key}
                          className="p-1.5 border-r border-slate-200 text-center align-middle w-[60px]"
                        >
                          {isActive ? (
                            <div className="h-5 rounded-md bg-slate-800 shadow-sm flex items-center justify-center text-[10px] text-slate-100 font-bold">
                              ✓
                            </div>
                          ) : (
                            <div className="h-5" />
                          )}
                        </td>
                      );
                    })}
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

ProjectMatrix.displayName = "ProjectMatrix";
