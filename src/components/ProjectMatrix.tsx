import { forwardRef } from "react";
import { Check } from "lucide-react";
import type { Staff, Project, Assignment } from "../db";
import type { TimelineMonth } from "../constants";
import { RoleBadge } from "./common/RoleBadge";
import { BaseMatrix } from "./common/BaseMatrix";
import { MASTER_MONTH_OPTIONS } from "../constants";
import { ThresholdBadge } from "./common/ThresholdBadge";
import { MatrixSuperHeader } from "./common/MatrixSuperHeader";

interface ProjectMatrixProps {
  staffMembers: Staff[];
  projects: Project[];
  assignments: Assignment[];
  timelineMonths: TimelineMonth[];
  getRole: (staffId: number, projectId: number) => string;
  maxDynamicCols: number;
  maxStaffPerProject?: number;
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
      timelineMonths = [],
      getRole,
      maxDynamicCols,
      maxStaffPerProject = 4,
    },
    ref,
  ) => {
    const leftMetadataSpan = 1 + maxDynamicCols + 1;

    return (
      <BaseMatrix
        ref={ref}
        title="Project Timeline & Staffing"
        countLabel={`${projects.length} Projects`}
      >
        <thead>
          <MatrixSuperHeader
            timelineMonths={timelineMonths}
            leftMetadataSpan={leftMetadataSpan}
          />

          <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 h-10">
            <th className="sticky top-8 left-0 z-20 bg-slate-50 border-r border-slate-200 text-left px-3 py-2 w-[328px] min-w-[328px] max-w-[328px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] align-middle">
              Project Name
            </th>

            {Array.from({ length: maxDynamicCols }).map((_, idx) => {
              const staff = staffMembers[idx];
              return (
                <th
                  key={idx}
                  className="sticky top-8 z-10 bg-slate-50 border-r border-slate-200 text-center px-2 py-1.5 w-24 min-w-[96px] max-w-[96px] align-middle"
                  title={staff?.name || ""}
                >
                  <span className="line-clamp-2 break-words leading-tight text-[11px] font-semibold text-slate-700 block">
                    {staff?.name || ""}
                  </span>
                </th>
              );
            })}

            <th className="sticky top-8 z-10 bg-slate-50 border-r border-slate-200 text-center px-2 py-2 w-20 min-w-[80px] max-w-[80px] align-middle">
              # Staff
            </th>

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

        <tbody className="divide-y divide-slate-200 text-xs text-slate-700 bg-white">
          {projects.map((proj) => {
            const projAssignments = assignments.filter(
              (a) => a.projectId === proj.id,
            );
            const activeStaffCount = projAssignments.length;

            return (
              <tr
                key={proj.id}
                className="group h-10 hover:bg-indigo-50/40 transition-colors duration-150"
              >
                <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 px-3 py-2 border-r border-slate-200 font-semibold text-slate-900 w-[328px] min-w-[328px] max-w-[328px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] transition-colors">
                  <span
                    className="line-clamp-1 truncate block font-medium text-slate-900"
                    title={proj.name}
                  >
                    {proj.name}
                  </span>
                </td>

                {Array.from({ length: maxDynamicCols }).map((_, idx) => {
                  const staff = staffMembers[idx];
                  if (!staff) {
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

                <td className="px-2 py-1.5 border-r border-slate-200 text-center font-bold text-slate-700 w-20 min-w-[80px] max-w-[80px] transition-colors">
                  <div className="flex items-center justify-center">
                    <ThresholdBadge
                      count={activeStaffCount}
                      threshold={maxStaffPerProject}
                      type="staff"
                    />
                  </div>
                </td>

                {timelineMonths.map((m) => {
                  const active = isMonthInRange(
                    m.key,
                    proj.startMonth,
                    proj.endMonth,
                  );
                  return (
                    <td
                      key={m.key}
                      className={`p-0 border-r border-slate-200 text-center w-[60px] min-w-[60px] h-10 transition-colors ${
                        active
                          ? "bg-slate-900 text-white"
                          : "bg-white group-hover:bg-indigo-50/30"
                      }`}
                    >
                      {active && (
                        <div className="w-full h-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
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
