import React, { useState, useRef, useEffect, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import { Header } from "./components/Header";
import { StaffMatrix } from "./components/StaffMatrix";
import { ProjectMatrix } from "./components/ProjectMatrix";
import { AssignmentModal } from "./components/AssignmentModal";
import { generateTimelineMonths } from "./constants";
import { exportToExcel, importFromExcel } from "./utils/excel";

export default function App() {
  const [visibleMonths, setVisibleMonths] = useState<number>(18); // Default 1.5 years
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<number | "">("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | "">("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll sync handles
  const staffMatrixScrollRef = useRef<HTMLDivElement>(null);
  const projectMatrixScrollRef = useRef<HTMLDivElement>(null);

  // Compute timeline from today's current date
  const timelineMonths = useMemo(
    () => generateTimelineMonths(visibleMonths, 0),
    [visibleMonths],
  );

  // DB Queries
  const staffMembers = useLiveQuery(() => db.staff.toArray()) || [];
  const projects = useLiveQuery(() => db.projects.toArray()) || [];
  const assignments = useLiveQuery(() => db.assignments.toArray()) || [];

  // Synchronize horizontal scrolling
  useEffect(() => {
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
  }, []);

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

  const handleSaveAssignment = async (e: React.FormEvent) => {
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
    <div className="bg-slate-50 text-slate-800 p-6 font-sans min-h-screen">
      <div className="max-w-full mx-auto space-y-8">
        <Header
          visibleMonths={visibleMonths}
          onVisibleMonthsChange={setVisibleMonths}
          onImportClick={() => fileInputRef.current?.click()}
          onExport={() => exportToExcel(staffMembers, projects, getRole)}
          onOpenAddStaffModal={() => {
            /* Add staff handler or modal trigger */
          }}
          onOpenAssignmentModal={handleOpenModal}
          fileInputRef={fileInputRef}
          onFileChange={importFromExcel}
        />

        <StaffMatrix
          ref={staffMatrixScrollRef}
          staffMembers={staffMembers}
          projects={projects}
          assignments={assignments}
          timelineMonths={timelineMonths}
          getRole={getRole}
        />

        <ProjectMatrix
          ref={projectMatrixScrollRef}
          staffMembers={staffMembers}
          projects={projects}
          assignments={assignments}
          timelineMonths={timelineMonths}
          getRole={getRole}
        />
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
