import { useState, useRef, useMemo, useEffect, type ChangeEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowRight, Clock } from "lucide-react";

import { db, type Staff, type Project } from "./db";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { StaffMatrix } from "./components/StaffMatrix";
import { ProjectMatrix } from "./components/ProjectMatrix";
import { ManageData } from "./components/ManageData";
import { BulkCapacityModal } from "./components/BulkCapacityModal";
import { DesignationCategoryModal } from "./components/DesignationCategoryModal";
import { ImportConfirmModal } from "./components/ImportConfirmModal";
import { ThresholdSettingsModal } from "./components/ThresholdSettingsModal";
import { RoleBadge } from "./components/common/RoleBadge";
import { Toast, type ToastType } from "./components/common/Toast";
import { useScrollSync } from "./hooks/useScrollSync";

import {
  generateTimelineMonthsRange,
  getDefaultEndKey,
  getEndKeyForDuration,
  MASTER_MONTH_OPTIONS,
  DURATION_OPTIONS,
  PROJECT_ROLE_LEGEND,
} from "./constants";
import {
  exportToExcel,
  parseExcelFile,
  commitImportToDatabase,
  type ParsedImportData,
} from "./utils/excel";

const TAB_STORAGE_KEY = "sam_active_tab";

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
  const [isDesignationModalOpen, setIsDesignationModalOpen] = useState(false);
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);

  const [maxProjectsPerStaff, setMaxProjectsPerStaff] = useState<number>(() => {
    const saved = localStorage.getItem("sam_max_projects_per_staff");
    return saved ? parseInt(saved, 10) : 3;
  });

  const [maxStaffPerProject, setMaxStaffPerProject] = useState<number>(() => {
    const saved = localStorage.getItem("sam_max_staff_per_project");
    return saved ? parseInt(saved, 10) : 4;
  });

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

  const allStaffMembers = useLiveQuery(() => db.staff.toArray()) || [];
  const allProjects = useLiveQuery(() => db.projects.toArray()) || [];
  const assignments = useLiveQuery(() => db.assignments.toArray()) || [];
  const designations = useLiveQuery(() => db.designations.toArray()) || [];

  const activeStaffMembers = useMemo(
    () => allStaffMembers.filter((s) => s.isActive !== false),
    [allStaffMembers],
  );

  const activeProjects = useMemo(
    () => allProjects.filter((p) => p.isActive !== false),
    [allProjects],
  );

  const maxDynamicCols = Math.max(
    activeProjects.length,
    activeStaffMembers.length,
  );

  const handleSaveThresholds = (maxProjects: number, maxStaff: number) => {
    setMaxProjectsPerStaff(maxProjects);
    setMaxStaffPerProject(maxStaff);
    localStorage.setItem("sam_max_projects_per_staff", maxProjects.toString());
    localStorage.setItem("sam_max_staff_per_project", maxStaff.toString());
    showToast("Threshold limits updated successfully.", "success");
  };

  const handleAddDesignation = async (code: string, name: string) => {
    try {
      await db.designations.add({ code, name });
      showToast(
        `Designation "${name}" (${code}) added successfully.`,
        "success",
      );
    } catch (error: any) {
      showToast(error?.message || "Failed to add designation.", "error");
    }
  };

  const handleDeleteDesignation = async (id: number) => {
    try {
      await db.designations.delete(id);
      showToast("Designation deleted.", "info");
    } catch (error: any) {
      showToast(error?.message || "Failed to delete designation.", "error");
    }
  };

  const handleAddStaff = async (
    name: string,
    designation: string,
    fte: number,
  ) => {
    try {
      await db.staff.add({ name, designation, fte, isActive: true });
      showToast(`Staff member "${name}" added successfully.`, "success");
    } catch (error: any) {
      showToast(error?.message || "Failed to add staff member.", "error");
    }
  };

  const handleToggleStaffActive = async (staff: Staff) => {
    try {
      const nextStatus = staff.isActive === false;
      await db.staff.update(staff.id!, { isActive: nextStatus });
      showToast(
        `Staff member "${staff.name}" is now ${nextStatus ? "Active" : "Inactive"}.`,
        "info",
      );
    } catch (error: any) {
      showToast(error?.message || "Failed to change staff status.", "error");
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

  const handleAddProject = async (
    name: string,
    startMonth?: string,
    endMonth?: string,
  ) => {
    try {
      await db.projects.add({ name, startMonth, endMonth, isActive: true });
      showToast(`Project "${name}" created successfully.`, "success");
    } catch (error: any) {
      showToast(error?.message || "Failed to create project.", "error");
    }
  };

  const handleToggleProjectActive = async (project: Project) => {
    try {
      const nextStatus = project.isActive === false;
      await db.projects.update(project.id!, { isActive: nextStatus });
      showToast(
        `Project "${project.name}" is now ${nextStatus ? "Active" : "Inactive"}.`,
        "info",
      );
    } catch (error: any) {
      showToast(error?.message || "Failed to change project status.", "error");
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
        db.designations,
        async () => {
          await db.staff.clear();
          await db.projects.clear();
          await db.assignments.clear();
          await db.designations.clear();
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
      exportToExcel(allStaffMembers, allProjects, assignments, designations);
      showToast("Export completed successfully.", "success");
    } catch (error: any) {
      showToast(error?.message || "Failed to export data.", "error");
    }
  };

  return (
    <div className="bg-slate-50 text-slate-800 px-4 sm:px-6 pb-8 font-sans min-h-screen relative antialiased flex flex-col justify-between">
      <div className="space-y-6 max-w-full mx-auto w-full">
        {/* Header */}
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === "dashboard" ? (
          <div className="space-y-6">
            {/* Planning Horizon Control Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-slate-800 text-sm">
                  Planning Period
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                <div className="inline-flex items-center bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1 text-xs">
                  <Clock className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-500 pr-2 select-none hidden min-[400px]:inline">
                    Preset:
                  </span>
                  <select
                    value={selectedDuration}
                    onChange={(e) => handleDurationChange(e.target.value)}
                    className="bg-transparent font-semibold text-indigo-600 focus:outline-none cursor-pointer pr-1"
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

                <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl p-1 text-xs">
                  <select
                    value={startMonthKey}
                    onChange={(e) => handleStartMonthChange(e.target.value)}
                    className="bg-white border border-slate-200/80 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-indigo-500/30 cursor-pointer"
                  >
                    {MASTER_MONTH_OPTIONS.map((m) => (
                      <option key={`start-${m.key}`} value={m.key}>
                        {m.shortMonth} {m.year}
                      </option>
                    ))}
                  </select>

                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

                  <select
                    value={endMonthKey}
                    onChange={(e) => handleEndMonthChange(e.target.value)}
                    className="bg-white border border-slate-200/80 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-indigo-500/30 cursor-pointer"
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

            {/* Grouped Section: Role Legend + Staff Matrix */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-end gap-2 pr-1">
                {PROJECT_ROLE_LEGEND.map((r) => (
                  <div
                    key={r.code}
                    className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200/80 rounded-lg shadow-2xs"
                  >
                    <RoleBadge role={r.code} title={r.name} />
                    <span className="text-xs font-medium text-slate-600">
                      {r.name}
                    </span>
                  </div>
                ))}
              </div>

              <StaffMatrix
                ref={staffMatrixScrollRef}
                staffMembers={activeStaffMembers}
                projects={activeProjects}
                assignments={assignments}
                timelineMonths={timelineMonths}
                getRole={getRole}
                maxDynamicCols={maxDynamicCols}
                maxProjectsPerStaff={maxProjectsPerStaff}
              />
            </div>

            {/* Project Matrix */}
            <ProjectMatrix
              ref={projectMatrixScrollRef}
              staffMembers={activeStaffMembers}
              projects={activeProjects}
              assignments={assignments}
              timelineMonths={timelineMonths}
              getRole={getRole}
              maxDynamicCols={maxDynamicCols}
              maxStaffPerProject={maxStaffPerProject}
            />
          </div>
        ) : (
          <ManageData
            staffMembers={allStaffMembers}
            projects={allProjects}
            assignments={assignments}
            designations={designations}
            timelineMonths={timelineMonths}
            onAddStaff={handleAddStaff}
            onToggleStaffActive={handleToggleStaffActive}
            onUpdateStaff={handleUpdateStaff}
            onDeleteStaff={handleDeleteStaff}
            onAddProject={handleAddProject}
            onToggleProjectActive={handleToggleProjectActive}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
            onClearAllData={handleClearAllData}
            onOpenBulkCapacityModal={(staff) => setBulkCapacityStaff(staff)}
            onOpenDesignationModal={() => setIsDesignationModalOpen(true)}
            onOpenThresholdModal={() => setIsThresholdModalOpen(true)}
            onImportClick={() => fileInputRef.current?.click()}
            onExport={handleExportToExcel}
            fileInputRef={fileInputRef}
            onFileChange={importFromExcel}
            showToast={showToast}
          />
        )}
      </div>

      {/* Footer */}
      <Footer />

      {/* Modals & Toasts */}
      <BulkCapacityModal
        isOpen={!!bulkCapacityStaff}
        staff={bulkCapacityStaff}
        timelineMonths={timelineMonths}
        onClose={() => setBulkCapacityStaff(null)}
        onSave={handleSaveBulkCapacity}
        showToast={showToast}
      />

      <DesignationCategoryModal
        isOpen={isDesignationModalOpen}
        designations={designations}
        onClose={() => setIsDesignationModalOpen(false)}
        onAddDesignation={handleAddDesignation}
        onDeleteDesignation={handleDeleteDesignation}
        showToast={showToast}
      />

      <ThresholdSettingsModal
        isOpen={isThresholdModalOpen}
        maxProjectsPerStaff={maxProjectsPerStaff}
        maxStaffPerProject={maxStaffPerProject}
        onClose={() => setIsThresholdModalOpen(false)}
        onSave={handleSaveThresholds}
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
