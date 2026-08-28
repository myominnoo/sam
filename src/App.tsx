import { useState, useRef, useMemo, useEffect, type ChangeEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  LayoutDashboard,
  SlidersHorizontal,
  Calendar,
  ArrowRight,
  Clock,
  ShieldCheck,
} from "lucide-react";

import { db, type Staff } from "./db";
import { Header } from "./components/Header";
import { StaffMatrix } from "./components/StaffMatrix";
import { ProjectMatrix } from "./components/ProjectMatrix";
import { ManageData } from "./components/ManageData";
import { BulkCapacityModal } from "./components/BulkCapacityModal";
import { RoleCategoryModal } from "./components/RoleCategoryModal";
import { ImportConfirmModal } from "./components/ImportConfirmModal";
import { RoleBadge } from "./components/common/RoleBadge";
import { Toast, type ToastType } from "./components/common/Toast";
import { useScrollSync } from "./hooks/useScrollSync";

import {
  generateTimelineMonthsRange,
  getDefaultEndKey,
  getEndKeyForDuration,
  MASTER_MONTH_OPTIONS,
  DURATION_OPTIONS,
} from "./constants";
import {
  exportToExcel,
  parseExcelFile,
  commitImportToDatabase,
  type ParsedImportData,
} from "./utils/excel";

const TAB_STORAGE_KEY = "staff_alloc_active_tab";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "manage">(() => {
    const savedTab = localStorage.getItem(TAB_STORAGE_KEY);
    return savedTab === "manage" || savedTab === "dashboard"
      ? savedTab
      : "dashboard";
  });

  useEffect(() => {
    localStorage.setItem(TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  const initialStartKey = `${new Date().getFullYear()}-${
    [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ][new Date().getMonth()]
  }`;

  const [startMonthKey, setStartMonthKey] = useState<string>(initialStartKey);
  const [selectedDuration, setSelectedDuration] = useState<string>("18");
  const [endMonthKey, setEndMonthKey] = useState<string>(() =>
    getEndKeyForDuration(initialStartKey, 18),
  );

  const [bulkCapacityStaff, setBulkCapacityStaff] = useState<Staff | null>(
    null,
  );
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const [pendingImportData, setPendingImportData] =
    useState<ParsedImportData | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, type });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const staffMatrixScrollRef = useRef<HTMLDivElement>(null);
  const projectMatrixScrollRef = useRef<HTMLDivElement>(null);

  useScrollSync(
    staffMatrixScrollRef,
    projectMatrixScrollRef,
    activeTab === "dashboard",
  );

  // Duration select change handler
  const handleDurationChange = (monthsStr: string) => {
    setSelectedDuration(monthsStr);
    if (monthsStr !== "custom") {
      const newEndKey = getEndKeyForDuration(
        startMonthKey,
        parseInt(monthsStr, 10),
      );
      setEndMonthKey(newEndKey);
    }
  };

  // Start month change handler
  const handleStartMonthChange = (newStartKey: string) => {
    setStartMonthKey(newStartKey);
    if (selectedDuration !== "custom") {
      setEndMonthKey(
        getEndKeyForDuration(newStartKey, parseInt(selectedDuration, 10)),
      );
    } else {
      setEndMonthKey(getDefaultEndKey(newStartKey));
    }
  };

  // End month change handler
  const handleEndMonthChange = (newEndKey: string) => {
    const startIdx = MASTER_MONTH_OPTIONS.findIndex(
      (m) => m.key === startMonthKey,
    );
    const endIdx = MASTER_MONTH_OPTIONS.findIndex((m) => m.key === newEndKey);
    if (endIdx < startIdx) {
      showToast("End month cannot be earlier than start month.", "warning");
      return;
    }
    setSelectedDuration("custom");
    setEndMonthKey(newEndKey);
  };

  const timelineMonths = useMemo(
    () => generateTimelineMonthsRange(startMonthKey, endMonthKey),
    [startMonthKey, endMonthKey],
  );

  // Live Queries
  const staffMembers = useLiveQuery(() => db.staff.toArray()) || [];
  const projects = useLiveQuery(() => db.projects.toArray()) || [];
  const assignments = useLiveQuery(() => db.assignments.toArray()) || [];
  const roles = useLiveQuery(() => db.roles.toArray()) || [];

  const maxDynamicCols = Math.max(projects.length, staffMembers.length);

  // Role Category Actions
  const handleAddRole = async (code: string, name: string) => {
    try {
      await db.roles.add({ code, name });
      showToast(`Role "${name}" (${code}) added successfully.`, "success");
    } catch (error: any) {
      showToast(error?.message || "Failed to add role category.", "error");
    }
  };

  const handleDeleteRole = async (id: number) => {
    try {
      await db.roles.delete(id);
      showToast("Role category deleted.", "info");
    } catch (error: any) {
      showToast(error?.message || "Failed to delete role category.", "error");
    }
  };

  // Staff Actions
  const handleAddStaff = async (
    name: string,
    designation: string,
    fte: number,
  ) => {
    try {
      await db.staff.add({ name, designation, fte });
      showToast(`Staff member "${name}" added successfully.`, "success");
    } catch (error: any) {
      showToast(error?.message || "Failed to add staff member.", "error");
    }
  };

  const handleUpdateStaff = async (
    id: number,
    name: string,
    designation: string,
    fte: number,
    assignedProjectIds: number[],
  ) => {
    try {
      await db.transaction("rw", db.staff, db.assignments, async () => {
        await db.staff.update(id, { name, designation, fte });
        const existingAssignments = await db.assignments
          .where("staffId")
          .equals(id)
          .toArray();
        const existingProjectIds = existingAssignments.map((a) => a.projectId);

        for (const a of existingAssignments) {
          if (!assignedProjectIds.includes(a.projectId))
            await db.assignments.delete(a.id!);
        }
        for (const projId of assignedProjectIds) {
          if (!existingProjectIds.includes(projId)) {
            await db.assignments.add({
              staffId: id,
              projectId: projId,
              role: "M",
            });
          }
        }
      });
      showToast(`Updated record for ${name}.`, "success");
    } catch (error: any) {
      showToast(error?.message || "Failed to update staff record.", "error");
    }
  };

  const handleSaveBulkCapacity = async (
    staffId: number,
    monthlyCapacity: Record<string, number>,
  ) => {
    try {
      await db.staff.update(staffId, { monthlyCapacity });
      showToast("Capacity allocation saved successfully.", "success");
    } catch (error: any) {
      showToast(error?.message || "Failed to save monthly capacity.", "error");
    }
  };

  const handleDeleteStaff = async (id: number) => {
    try {
      await db.transaction("rw", db.staff, db.assignments, async () => {
        await db.assignments.where("staffId").equals(id).delete();
        await db.staff.delete(id);
      });
      showToast("Staff record deleted successfully.", "info");
    } catch (error: any) {
      showToast(error?.message || "Failed to delete staff member.", "error");
    }
  };

  // Project Actions
  const handleAddProject = async (
    name: string,
    startMonth?: string,
    endMonth?: string,
  ) => {
    try {
      await db.projects.add({ name, startMonth, endMonth });
      showToast(`Project "${name}" created successfully.`, "success");
    } catch (error: any) {
      showToast(error?.message || "Failed to create project.", "error");
    }
  };

  const handleUpdateProject = async (
    id: number,
    name: string,
    plStaffId: number | null,
    teamAssignments: { staffId: number; role: "M" | "A" }[],
    startMonth?: string,
    endMonth?: string,
  ) => {
    try {
      await db.transaction("rw", db.projects, db.assignments, async () => {
        await db.projects.update(id, { name, startMonth, endMonth });
        await db.assignments.where("projectId").equals(id).delete();

        if (plStaffId) {
          await db.assignments.add({
            projectId: id,
            staffId: plStaffId,
            role: "PL",
          });
        }
        for (const team of teamAssignments) {
          if (team.staffId !== plStaffId) {
            await db.assignments.add({
              projectId: id,
              staffId: team.staffId,
              role: team.role,
            });
          }
        }
      });
      showToast(`Project "${name}" updated successfully.`, "success");
    } catch (error: any) {
      showToast(error?.message || "Failed to update project.", "error");
    }
  };

  const handleDeleteProject = async (id: number) => {
    try {
      await db.transaction("rw", db.projects, db.assignments, async () => {
        await db.assignments.where("projectId").equals(id).delete();
        await db.projects.delete(id);
      });
      showToast("Project deleted successfully.", "info");
    } catch (error: any) {
      showToast(error?.message || "Failed to delete project.", "error");
    }
  };

  const getRole = (staffId: number, projectId: number) => {
    return (
      assignments.find(
        (a) => a.staffId === staffId && a.projectId === projectId,
      )?.role || ""
    );
  };

  const handleClearAllData = async () => {
    try {
      await db.transaction(
        "rw",
        db.staff,
        db.projects,
        db.assignments,
        db.roles,
        async () => {
          await db.staff.clear();
          await db.projects.clear();
          await db.assignments.clear();
          await db.roles.clear();
        },
      );
      showToast("All database records have been cleared.", "success");
    } catch (error: any) {
      showToast(error?.message || "Failed to clear database.", "error");
    }
  };

  const importFromExcel = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseExcelFile(file);
      setPendingImportData(parsed);
    } catch (error: any) {
      showToast(
        error.message || "Failed to parse the selected Excel file.",
        "error",
      );
    } finally {
      e.target.value = "";
    }
  };

  const handleConfirmImport = async () => {
    if (!pendingImportData) return;

    try {
      await commitImportToDatabase(pendingImportData);
      showToast(
        `Imported ${pendingImportData.staff.length} staff, ${pendingImportData.projects.length} projects, and ${pendingImportData.assignments.length} assignments!`,
        "success",
      );
    } catch (error: any) {
      showToast(
        error.message || "An error occurred while importing data.",
        "error",
      );
    } finally {
      setPendingImportData(null);
    }
  };

  const handleExportToExcel = () => {
    try {
      exportToExcel(staffMembers, projects, assignments, roles);
      showToast("Export completed successfully.", "success");
    } catch (error: any) {
      showToast(error?.message || "Failed to export data.", "error");
    }
  };

  return (
    <div className="bg-slate-50 text-slate-800 px-4 sm:px-6 pb-8 font-sans min-h-screen relative antialiased">
      {/* Top Floating Navigation */}
      <div className="sticky top-3 z-50 flex justify-center pointer-events-none mb-3">
        <div className="pointer-events-auto inline-flex items-center p-1 bg-white/80 backdrop-blur-md rounded-full ring-1 ring-slate-900/5 shadow-md shadow-slate-900/5 transition-all">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab("manage")}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              activeTab === "manage"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Manage Data</span>
          </button>
        </div>
      </div>

      <div className="max-w-full mx-auto space-y-6">
        <Header />

        {activeTab === "dashboard" ? (
          <>
            {/* Timeline Control Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Active Timeline Range:
                </span>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Duration Presets Select */}
                <div className="inline-flex items-center bg-slate-100/80 border border-slate-200/80 rounded-xl p-1 text-xs">
                  <Clock className="w-3.5 h-3.5 text-slate-400 ml-2.5 mr-1" />
                  <span className="text-[11px] font-semibold text-slate-500 pr-1.5 select-none">
                    Duration:
                  </span>
                  <select
                    value={selectedDuration}
                    onChange={(e) => handleDurationChange(e.target.value)}
                    className="bg-white border border-slate-200/80 rounded-lg px-2.5 py-1 text-xs font-bold text-indigo-600 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                  >
                    {DURATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                    {selectedDuration === "custom" && (
                      <option value="custom">Custom Range</option>
                    )}
                  </select>
                </div>

                {/* Timeline Start/End Date Range Picker */}
                <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl p-1 text-xs">
                  <select
                    value={startMonthKey}
                    onChange={(e) => handleStartMonthChange(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    {MASTER_MONTH_OPTIONS.map((m) => (
                      <option key={`start-${m.key}`} value={m.key}>
                        {m.shortMonth} {m.year}
                      </option>
                    ))}
                  </select>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={endMonthKey}
                    onChange={(e) => handleEndMonthChange(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    {MASTER_MONTH_OPTIONS.map((m) => (
                      <option key={`end-${m.key}`} value={m.key}>
                        {m.shortMonth} {m.year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Dynamic Role Legend Bar */}
            <div className="flex items-center justify-end gap-2 flex-wrap">
              {roles.length > 0 ? (
                roles.map((r) => (
                  <div
                    key={r.id || r.code}
                    className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200/80 rounded-lg"
                  >
                    <RoleBadge role={r.code} title={r.name} />
                    <span className="text-xs font-medium text-slate-600">
                      {r.name}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">
                  No roles defined.
                </span>
              )}
            </div>

            <StaffMatrix
              ref={staffMatrixScrollRef}
              staffMembers={staffMembers}
              projects={projects}
              assignments={assignments}
              timelineMonths={timelineMonths}
              getRole={getRole}
              maxDynamicCols={maxDynamicCols}
            />

            <ProjectMatrix
              ref={projectMatrixScrollRef}
              staffMembers={staffMembers}
              projects={projects}
              assignments={assignments}
              timelineMonths={timelineMonths}
              getRole={getRole}
              maxDynamicCols={maxDynamicCols}
            />
          </>
        ) : (
          <ManageData
            staffMembers={staffMembers}
            projects={projects}
            assignments={assignments}
            roles={roles}
            timelineMonths={timelineMonths}
            onAddStaff={handleAddStaff}
            onUpdateStaff={handleUpdateStaff}
            onDeleteStaff={handleDeleteStaff}
            onAddProject={handleAddProject}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
            onClearAllData={handleClearAllData}
            onOpenBulkCapacityModal={(staff) => setBulkCapacityStaff(staff)}
            onOpenRoleModal={() => setIsRoleModalOpen(true)}
            onImportClick={() => fileInputRef.current?.click()}
            onExport={handleExportToExcel}
            fileInputRef={fileInputRef}
            onFileChange={importFromExcel}
            showToast={showToast}
          />
        )}
      </div>

      <BulkCapacityModal
        isOpen={!!bulkCapacityStaff}
        staff={bulkCapacityStaff}
        timelineMonths={timelineMonths}
        onClose={() => setBulkCapacityStaff(null)}
        onSave={handleSaveBulkCapacity}
        showToast={showToast}
      />

      <RoleCategoryModal
        isOpen={isRoleModalOpen}
        roles={roles}
        onClose={() => setIsRoleModalOpen(false)}
        onAddRole={handleAddRole}
        onDeleteRole={handleDeleteRole}
        showToast={showToast}
      />

      <ImportConfirmModal
        isOpen={!!pendingImportData}
        parsedData={pendingImportData}
        onClose={() => setPendingImportData(null)}
        onConfirm={handleConfirmImport}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
