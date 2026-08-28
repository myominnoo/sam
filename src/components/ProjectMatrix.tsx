import { forwardRef } from "react";
import { Check } from "lucide-react";
import type { Staff, Project, Assignment } from "../db";
import type { TimelineMonth } from "../constants";
import { RoleBadge } from "./common/RoleBadge";
import { BaseMatrix } from "./common/BaseMatrix";
import { MASTER_MONTH_OPTIONS } from "../constants";

interface ProjectMatrixProps {
  staffMembers: Staff[];
  projects: Project[];
  assignments: Assignment[];
  timelineMonths: TimelineMonth[];
  getRole: (staffId: number, projectId: number) => string;
  maxDynamicCols: number;
}

const isMonthInRange = (
  targetKey: string,
  startKey?: string,
  endKey?: string,
): boolean => {
  if (!startKey || !endKey) return false;
  const targetIdx = MASTER_MONTH_OPTIONS.findIndex((m) => m.key === targetKey);
  const startIdx = MASTER_MONTH_OPTIONS.findIndex((m) => m.key === startKey);
  const endIdx = MASTER_MONTH_OPTIONS.findIndex((m) => m.key === endKey);
  if (targetIdx === -1 || startIdx === -1 || endIdx === -1) return false;
  return targetIdx >= startIdx && targetIdx <= endIdx;
};

export const ProjectMatrix = forwardRef<HTMLDivElement, ProjectMatrixProps>(
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
    // 1 Fixed Prefix Column (Project Name)
    const prefixColsSpan = 1;

    return (
      <BaseMatrix
        ref={ref}
        title="Project Timeline & Staffing"
        countLabel={`${projects.length} Projects`}
        timelineMonths={timelineMonths}
        prefixColsSpan={prefixColsSpan}
        dynamicColsCount={maxDynamicCols}
        groupLabel="Staff"
      >
        <thead>
          <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 h-7 text-[10px] tracking-wider">
            <th className="sticky left-0 z-30 bg-slate-50 p-2 border-r border-slate-200 text-left w-[304px] min-w-[304px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
              Project Name
            </th>

            {/* DYNAMIC STAFF COLUMNS */}
            {Array.from({ length: maxDynamicCols }).map((_, idx) => {
              const staff = staffMembers[idx];
              const firstName = staff ? staff.name.split(" ")[0] : "";
              return (
                <th
                  key={idx}
                  className="p-2 border-r border-slate-200 text-center w-20 min-w-[80px] max-w-[80px] truncate"
                  title={staff?.name || ""}
                >
                  {firstName}
                </th>
              );
            })}

            {/* # STAFF COLUMN */}
            <th className="p-2 border-r border-slate-200 text-center w-16 min-w-[64px]">
              # Staff
            </th>

            {/* TIMELINE MONTH COLUMNS */}
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
          {projects.map((proj) => {
            const projAssignments = assignments.filter(
              (a) => a.projectId === proj.id,
            );
            const activeStaffCount = projAssignments.length;

            return (
              <tr key={proj.id} className="hover:bg-slate-50 h-9">
                <td className="sticky left-0 z-20 bg-white group-hover:bg-slate-50 p-2 border-r border-slate-200 font-semibold text-slate-800 truncate w-[304px] min-w-[304px] max-w-[304px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  {proj.name}
                </td>

                {/* DYNAMIC STAFF ASSIGNMENTS */}
                {Array.from({ length: maxDynamicCols }).map((_, idx) => {
                  const staff = staffMembers[idx];
                  if (!staff) {
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
                  {activeStaffCount}
                </td>

                {/* PROJECT ACTIVE TIMELINE INDICATOR */}
                {timelineMonths.map((m) => {
                  const active = isMonthInRange(
                    m.key,
                    proj.startMonth,
                    proj.endMonth,
                  );
                  return (
                    <td
                      key={m.key}
                      className={`p-0 border-r border-slate-200 text-center w-[60px] min-w-[60px] h-9 ${
                        active ? "bg-slate-900 text-white" : "bg-white"
                      }`}
                    >
                      {active && (
                        <div className="w-full h-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white stroke-[2.5]" />
                        </div>
                      )}
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

ProjectMatrix.displayName = "ProjectMatrix";
