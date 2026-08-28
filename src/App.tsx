import { useState, useRef, useMemo, useEffect, type ChangeEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  LayoutDashboard,
  SlidersHorizontal,
  Calendar,
  ArrowRight,
} from "lucide-react";

import { db, type Staff } from "./db";
import { Header } from "./components/Header";
import { StaffMatrix } from "./components/StaffMatrix";
import { ProjectMatrix } from "./components/ProjectMatrix";
import { ManageData } from "./components/ManageData";
import { BulkCapacityModal } from "./components/BulkCapacityModal";
import { RoleCategoryModal } from "./components/RoleCategoryModal";
import { ImportConfirmModal } from "./components/ImportConfirmModal";
import { Toast } from "./components/common/Toast";
import { useScrollSync } from "./hooks/useScrollSync";

import {
  generateTimelineMonthsRange,
  getDefaultEndKey,
  MASTER_MONTH_OPTIONS,
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
  const [endMonthKey, setEndMonthKey] = useState<string>(() =>
    getDefaultEndKey(initialStartKey),
  );
  const [bulkCapacityStaff, setBulkCapacityStaff] = useState<Staff | null>(
    null,
  );
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const [pendingImportData, setPendingImportData] =
    useState<ParsedImportData | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const staffMatrixScrollRef = useRef<HTMLDivElement>(null);
  const projectMatrixScrollRef = useRef<HTMLDivElement>(null);

  useScrollSync(
    staffMatrixScrollRef,
    projectMatrixScrollRef,
    activeTab === "dashboard",
  );

  const handleStartMonthChange = (newStartKey: string) => {
    setStartMonthKey(newStartKey);
    setEndMonthKey(getDefaultEndKey(newStartKey));
  };

  const handleEndMonthChange = (newEndKey: string) => {
    const startIdx = MASTER_MONTH_OPTIONS.findIndex(
      (m) => m.key === startMonthKey,
    );
    const endIdx = MASTER_MONTH_OPTIONS.findIndex((m) => m.key === newEndKey);
    if (endIdx >= startIdx) setEndMonthKey(newEndKey);
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

  // Role Category CRUD Actions
  const handleAddRole = async (code: string, name: string) => {
    await db.roles.add({ code, name });
  };

  const handleDeleteRole = async (id: number) => {
    await db.roles.delete(id);
  };

  // Staff Database Actions
  const handleAddStaff = async (
    name: string,
    designation: string,
    fte: number,
  ) => {
    await db.staff.add({ name, designation, fte });
  };

  const handleUpdateStaff = async (
    id: number,
    name: string,
    designation: string,
    fte: number,
    assignedProjectIds: number[],
  ) => {
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
  };

  const handleSaveBulkCapacity = async (
    staffId: number,
    monthlyCapacity: Record<string, number>,
  ) => {
    await db.staff.update(staffId, { monthlyCapacity });
  };

  const handleDeleteStaff = async (id: number) => {
    await db.transaction("rw", db.staff, db.assignments, async () => {
      await db.assignments.where("staffId").equals(id).delete();
      await db.staff.delete(id);
    });
  };

  // Project Database Actions
  const handleAddProject = async (
    name: string,
    startMonth?: string,
    endMonth?: string,
  ) => {
    await db.projects.add({ name, startMonth, endMonth });
  };

  const handleUpdateProject = async (
    id: number,
    name: string,
    plStaffId: number | null,
    teamAssignments: { staffId: number; role: "M" | "A" }[],
    startMonth?: string,
    endMonth?: string,
  ) => {
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
  };

  const handleDeleteProject = async (id: number) => {
    await db.transaction("rw", db.projects, db.assignments, async () => {
      await db.assignments.where("projectId").equals(id).delete();
      await db.projects.delete(id);
    });
  };

  const getRole = (staffId: number, projectId: number) => {
    return (
      assignments.find(
        (a) => a.staffId === staffId && a.projectId === projectId,
      )?.role || ""
    );
  };

  const handleClearAllData = async () => {
    await db.transaction(
      "rw",
      db.staff,
      db.projects,
      db.assignments,
      async () => {
        await db.staff.clear();
        await db.projects.clear();
        await db.assignments.clear();
      },
    );
    setToast({
      message: "All database records have been cleared.",
      type: "success",
    });
  };

  const importFromExcel = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseExcelFile(file);
      setPendingImportData(parsed);
    } catch (error: any) {
      console.error("Failed to parse Excel file:", error);
      setToast({
        message: error.message || "Failed to parse the selected Excel file.",
        type: "error",
      });
    } finally {
      e.target.value = "";
    }
  };

  const handleConfirmImport = async () => {
    if (!pendingImportData) return;

    try {
      await commitImportToDatabase(pendingImportData);
      setToast({
        message: `Imported ${pendingImportData.staff.length} staff, ${pendingImportData.projects.length} projects, and ${pendingImportData.assignments.length} assignments!`,
        type: "success",
      });
    } catch (error: any) {
      console.error("Failed to import into database:", error);
      setToast({
        message: error.message || "An error occurred while importing data.",
        type: "error",
      });
    } finally {
      setPendingImportData(null);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-800 px-4 sm:px-6 pb-8 font-sans min-h-screen relative">
      <div className="sticky top-3 z-50 flex justify-center pointer-events-none mb-3">
        <div className="pointer-events-auto inline-flex items-center p-1 bg-white/70 backdrop-blur-md rounded-full ring-1 ring-slate-900/5 shadow-md shadow-slate-900/5 transition-all">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-slate-900 text-white shadow-sm"
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
                ? "bg-slate-900 text-white shadow-sm"
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
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Active Timeline Range:
                </span>
              </div>
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
            onExport={() =>
              exportToExcel(staffMembers, projects, assignments, roles)
            }
            fileInputRef={fileInputRef}
            onFileChange={importFromExcel}
          />
        )}
      </div>

      <BulkCapacityModal
        isOpen={!!bulkCapacityStaff}
        staff={bulkCapacityStaff}
        timelineMonths={timelineMonths}
        onClose={() => setBulkCapacityStaff(null)}
        onSave={handleSaveBulkCapacity}
      />

      <RoleCategoryModal
        isOpen={isRoleModalOpen}
        roles={roles}
        onClose={() => setIsRoleModalOpen(false)}
        onAddRole={handleAddRole}
        onDeleteRole={handleDeleteRole}
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
