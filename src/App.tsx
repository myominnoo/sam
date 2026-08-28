import { useState, useRef, useEffect, useMemo } from "react";
import type { FormEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { LayoutDashboard, SlidersHorizontal } from "lucide-react";

import { db } from "./db";
import { Header } from "./components/Header";
import { StaffMatrix } from "./components/StaffMatrix";
import { ProjectMatrix } from "./components/ProjectMatrix";
import { ManageData } from "./components/ManageData";
import { AssignmentModal } from "./components/AssignmentModal";

import {
  generateTimelineMonthsRange,
  getDefaultEndKey,
  MASTER_MONTH_OPTIONS,
} from "./constants";
import { exportToExcel, importFromExcel } from "./utils/excel";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "manage">(
    "dashboard",
  );

  // Initial Timeline Range Setup (Current month -> 1.5 years out)
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

  // Assignment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<number | "">("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | "">("");
  const [selectedRole, setSelectedRole] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll Sync Handles
  const staffMatrixScrollRef = useRef<HTMLDivElement>(null);
  const projectMatrixScrollRef = useRef<HTMLDivElement>(null);

  // Timeline Range Event Handlers
  const handleStartMonthChange = (newStartKey: string) => {
    setStartMonthKey(newStartKey);
    const newEndKey = getDefaultEndKey(newStartKey);
    setEndMonthKey(newEndKey);
  };

  const handleEndMonthChange = (newEndKey: string) => {
    const startIdx = MASTER_MONTH_OPTIONS.findIndex(
      (m) => m.key === startMonthKey,
    );
    const endIdx = MASTER_MONTH_OPTIONS.findIndex((m) => m.key === newEndKey);
    if (endIdx >= startIdx) {
      setEndMonthKey(newEndKey);
    }
  };

  // Compute Current Dashboard Range
  const timelineMonths = useMemo(
    () => generateTimelineMonthsRange(startMonthKey, endMonthKey),
    [startMonthKey, endMonthKey],
  );

  // Live Database Queries
  const staffMembers = useLiveQuery(() => db.staff.toArray()) || [];
  const projects = useLiveQuery(() => db.projects.toArray()) || [];
  const assignments = useLiveQuery(() => db.assignments.toArray()) || [];

  // --- DYNAMIC MATRIX ALIGNMENT COMPUTATION ---
  // Staff Matrix Left Width: Name(170) + Designation(60) + FTE(50) + Projects(projects.length * 90) + # Proj(65)
  const staffLeftWidth = 345 + projects.length * 90;

  // Project Matrix Left Width: Project Name(280) + Staff(staffMembers.length * 90) + # Staff(65)
  const projectLeftWidth = 345 + staffMembers.length * 90;

  // Compute maximum width so timelines align 1-to-1
  const sharedLeftWidth = Math.max(staffLeftWidth, projectLeftWidth);

  // --- STAFF DATABASE OPERATIONS ---
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
        if (!assignedProjectIds.includes(a.projectId)) {
          await db.assignments.delete(a.id!);
        }
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

  const handleDeleteStaff = async (id: number) => {
    await db.transaction("rw", db.staff, db.assignments, async () => {
      await db.assignments.where("staffId").equals(id).delete();
      await db.staff.delete(id);
    });
  };

  // --- PROJECT DATABASE OPERATIONS ---
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
    assignedStaffIds: number[],
    startMonth?: string,
    endMonth?: string,
  ) => {
    await db.transaction("rw", db.projects, db.assignments, async () => {
      await db.projects.update(id, { name, startMonth, endMonth });

      const existingAssignments = await db.assignments
        .where("projectId")
        .equals(id)
        .toArray();
      const existingStaffIds = existingAssignments.map((a) => a.staffId);

      for (const a of existingAssignments) {
        if (!assignedStaffIds.includes(a.staffId)) {
          await db.assignments.delete(a.id!);
        }
      }

      for (const staffId of assignedStaffIds) {
        if (!existingStaffIds.includes(staffId)) {
          await db.assignments.add({ staffId, projectId: id, role: "M" });
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

  // --- SCROLL SYNCHRONIZATION ---
  useEffect(() => {
    if (activeTab !== "dashboard") return;
    const staffEl = staffMatrixScrollRef.current;
    const projectEl = projectMatrixScrollRef.current;
    if (!staffEl || !projectEl) return;

    let isSyncingStaff = false;
    let isSyncingProject = false;

    const handleStaffScroll = () => {
      if (!isSyncingStaff) {
        isSyncingProject = true;
        projectEl.scrollLeft = staffEl.scrollLeft;
      }
      isSyncingStaff = false;
    };

    const handleProjectScroll = () => {
      if (!isSyncingProject) {
        isSyncingStaff = true;
        staffEl.scrollLeft = projectEl.scrollLeft;
      }
      isSyncingProject = false;
    };

    staffEl.addEventListener("scroll", handleStaffScroll, { passive: true });
    projectEl.addEventListener("scroll", handleProjectScroll, {
      passive: true,
    });

    return () => {
      staffEl.removeEventListener("scroll", handleStaffScroll);
      projectEl.removeEventListener("scroll", handleProjectScroll);
    };
  }, [activeTab]);

  const getRole = (staffId: number, projectId: number) => {
    return (
      assignments.find(
        (a) => a.staffId === staffId && a.projectId === projectId,
      )?.role || ""
    );
  };

  const handleOpenModal = () => {
    if (staffMembers.length > 0) setSelectedStaffId(staffMembers[0].id!);
    if (projects.length > 0) setSelectedProjectId(projects[0].id!);
    setSelectedRole("");
    setIsModalOpen(true);
  };

  const handleSaveAssignment = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId || !selectedProjectId) return;

    const existing = assignments.find(
      (a) =>
        a.staffId === Number(selectedStaffId) &&
        a.projectId === Number(selectedProjectId),
    );

    if (!selectedRole) {
      if (existing?.id) await db.assignments.delete(existing.id);
    } else {
      const role = selectedRole as "PL" | "M" | "A";
      if (existing?.id) {
        await db.assignments.update(existing.id, { role });
      } else {
        await db.assignments.add({
          staffId: Number(selectedStaffId),
          projectId: Number(selectedProjectId),
          role,
        });
      }
    }
    setIsModalOpen(false);
  };

  return (
    <div className="bg-slate-50 text-slate-800 px-4 sm:px-6 pb-8 font-sans min-h-screen relative">
      {/* FLOATING TRANSLUCENT TAB BAR */}
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
        <Header
          activeTab={activeTab}
          startMonthKey={startMonthKey}
          endMonthKey={endMonthKey}
          onStartMonthChange={handleStartMonthChange}
          onEndMonthChange={handleEndMonthChange}
          onImportClick={() => fileInputRef.current?.click()}
          onExport={() => exportToExcel(staffMembers, projects, getRole)}
          onOpenAssignmentModal={handleOpenModal}
          fileInputRef={fileInputRef}
          onFileChange={importFromExcel}
        />

        {activeTab === "dashboard" ? (
          <>
            <StaffMatrix
              ref={staffMatrixScrollRef}
              staffMembers={staffMembers}
              projects={projects}
              assignments={assignments}
              timelineMonths={timelineMonths}
              getRole={getRole}
              leftSideWidth={sharedLeftWidth}
            />

            <ProjectMatrix
              ref={projectMatrixScrollRef}
              staffMembers={staffMembers}
              projects={projects}
              assignments={assignments}
              timelineMonths={timelineMonths}
              getRole={getRole}
              leftSideWidth={sharedLeftWidth}
            />
          </>
        ) : (
          <ManageData
            staffMembers={staffMembers}
            projects={projects}
            assignments={assignments}
            timelineMonths={timelineMonths}
            onAddStaff={handleAddStaff}
            onUpdateStaff={handleUpdateStaff}
            onDeleteStaff={handleDeleteStaff}
            onAddProject={handleAddProject}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
          />
        )}
      </div>

      <AssignmentModal
        isOpen={isModalOpen}
        staffMembers={staffMembers}
        projects={projects}
        selectedStaffId={selectedStaffId}
        selectedProjectId={selectedProjectId}
        selectedRole={selectedRole}
        onStaffChange={setSelectedStaffId}
        onProjectChange={setSelectedProjectId}
        onRoleChange={setSelectedRole}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAssignment}
      />
    </div>
  );
}
