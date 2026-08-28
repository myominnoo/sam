import { forwardRef, useMemo } from "react";
import { Check } from "lucide-react";
import type { Staff, Project, Assignment } from "../db";
import type { TimelineMonth } from "../constants";
import { RoleBadge } from "./common/RoleBadge";
import { BaseMatrix } from "./common/BaseMatrix";
import { MASTER_MONTH_OPTIONS } from "../constants";
import { ThresholdBadge } from "./common/ThresholdBadge";

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
    const prefixColsSpan = 1;

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
        title="Project Timeline & Staffing"
        countLabel={`${projects.length} Projects`}
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
              STAFF
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
            <th className="sticky left-0 z-30 bg-slate-50 p-2 border-r border-slate-200 text-left font-bold text-slate-800 w-[304px] min-w-[304px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] align-middle">
              Project Name
            </th>

            {Array.from({ length: maxDynamicCols }).map((_, idx) => {
              const staff = staffMembers[idx];
              const firstName = staff ? staff.name.split(" ")[0] : "";
              return (
                <th
                  key={idx}
                  className="p-2 border-r border-slate-200 text-center font-bold text-slate-800 w-20 min-w-[80px] max-w-[80px] align-middle"
                  title={staff?.name || ""}
                >
                  <span className="line-clamp-2 break-words leading-tight block">
                    {firstName}
                  </span>
                </th>
              );
            })}

            <th className="p-2 border-r border-slate-200 text-center font-bold text-slate-800 w-20 min-w-[80px] max-w-[80px] align-middle">
              # Staff
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
          {projects.map((proj) => {
            const projAssignments = assignments.filter(
              (a) => a.projectId === proj.id,
            );
            const activeStaffCount = projAssignments.length;

            return (
              <tr
                key={proj.id}
                className="group h-9 transition-colors duration-150 relative"
              >
                <td className="sticky left-0 z-20 bg-white group-hover:bg-blue-100 p-2 border-r border-slate-200 font-semibold text-slate-800 group-hover:text-blue-950 w-[304px] min-w-[304px] max-w-[304px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span
                    className="line-clamp-2 break-words leading-snug block pl-1"
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

                <td className="p-2 border-r border-slate-200 group-hover:bg-blue-100/70 text-center font-bold text-slate-700 group-hover:text-blue-950 w-20 min-w-[80px] max-w-[80px] transition-colors">
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
                      className={`p-0 border-r border-slate-200 text-center w-[60px] min-w-[60px] h-9 transition-colors ${
                        active
                          ? "bg-slate-900 group-hover:bg-blue-900 text-white"
                          : "bg-white group-hover:bg-blue-100"
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
