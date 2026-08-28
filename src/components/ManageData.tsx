import { useState, useMemo, type RefObject, type ChangeEvent } from "react";
import type { Staff, Project, Assignment, DesignationCategory } from "../db";
import type { TimelineMonth } from "../constants";
import type { ToastType } from "./common/Toast";

import { ManageDataToolbar } from "./manageData/ManageDataToolbar";
import { StaffDirectory } from "./manageData/StaffDirectory";
import { ProjectDirectory } from "./manageData/ProjectDirectory";
import { DeleteConfirmModal } from "./manageData/DeleteConfirmModal";

interface ManageDataProps {
  staffMembers: Staff[];
  projects: Project[];
  assignments: Assignment[];
  designations: DesignationCategory[];
  timelineMonths: TimelineMonth[];
  onAddStaff: (name: string, designation: string, fte: number) => Promise<void>;
  onToggleStaffActive: (staff: Staff) => Promise<void>;
  onUpdateStaff: (
    id: number,
    name: string,
    designation: string,
    fte: number,
    assignedProjectIds: number[],
  ) => Promise<void>;
  onDeleteStaff: (id: number) => Promise<void>;
  onAddProject: (
    name: string,
    startMonth?: string,
    endMonth?: string,
  ) => Promise<void>;
  onToggleProjectActive: (project: Project) => Promise<void>;
  onUpdateProject: (
    id: number,
    name: string,
    plStaffId: number | null,
    teamAssignments: { staffId: number; role: "M" | "A" }[],
    startMonth?: string,
    endMonth?: string,
  ) => Promise<void>;
  onDeleteProject: (id: number) => Promise<void>;
  onClearAllData: () => Promise<void>;
  onOpenBulkCapacityModal: (staff: Staff) => void;
  onOpenDesignationModal: () => void;
  onImportClick: () => void;
  onExport: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  showToast: (message: string, type?: ToastType) => void;
}

export const ManageData = ({
  staffMembers,
  projects,
  assignments,
  designations,
  onAddStaff,
  onToggleStaffActive,
  onUpdateStaff,
  onDeleteStaff,
  onAddProject,
  onToggleProjectActive,
  onUpdateProject,
  onDeleteProject,
  onClearAllData,
  onOpenBulkCapacityModal,
  onOpenDesignationModal,
  onImportClick,
  onExport,
  fileInputRef,
  onFileChange,
  showToast,
}: ManageDataProps) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const designationOptions = useMemo(
    () =>
      designations.length > 0
        ? designations.map((d) => ({ label: d.name, value: d.code }))
        : [
            { label: "Research Associate", value: "RA" },
            { label: "Senior Research Associate", value: "SRA" },
            { label: "Director of Research", value: "DOR" },
          ],
    [designations],
  );

  const handleConfirmClear = async () => {
    await onClearAllData();
    setShowClearConfirm(false);
    showToast("All data cleared successfully.", "info");
  };

  const handleConfirmDeleteStaff = async () => {
    if (!staffToDelete?.id) return;
    await onDeleteStaff(staffToDelete.id);
    showToast(`Staff member "${staffToDelete.name}" deleted.`, "info");
    setStaffToDelete(null);
  };

  const handleConfirmDeleteProject = async () => {
    if (!projectToDelete?.id) return;
    await onDeleteProject(projectToDelete.id);
    showToast(`Project "${projectToDelete.name}" deleted.`, "info");
    setProjectToDelete(null);
  };

  return (
    <div className="space-y-6 max-w-full mx-auto">
      <ManageDataToolbar
        fileInputRef={fileInputRef}
        onOpenDesignationModal={onOpenDesignationModal}
        onImportClick={onImportClick}
        onExport={onExport}
        onFileChange={onFileChange}
        onRequestClearAll={() => setShowClearConfirm(true)}
      />

      <div className="grid grid-cols-1 gap-6">
        <StaffDirectory
          staffMembers={staffMembers}
          projects={projects}
          assignments={assignments}
          designationOptions={designationOptions}
          onAddStaff={onAddStaff}
          onToggleStaffActive={onToggleStaffActive}
          onUpdateStaff={onUpdateStaff}
          onRequestDelete={(staff) => setStaffToDelete(staff)}
          onOpenBulkCapacityModal={onOpenBulkCapacityModal}
          showToast={showToast}
        />

        <ProjectDirectory
          projects={projects}
          staffMembers={staffMembers}
          assignments={assignments}
          onAddProject={onAddProject}
          onToggleProjectActive={onToggleProjectActive}
          onUpdateProject={onUpdateProject}
          onRequestDelete={(project) => setProjectToDelete(project)}
          showToast={showToast}
        />
      </div>

      <DeleteConfirmModal
        isOpen={showClearConfirm}
        title="Confirm Clear All Data"
        itemDescription="This action will permanently remove all staff members, projects, assignments, and designations from your local database."
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleConfirmClear}
      />

      <DeleteConfirmModal
        isOpen={!!staffToDelete}
        title="Confirm Staff Deletion"
        itemName={staffToDelete?.name}
        itemDescription="This will also remove all their project assignments and monthly capacity settings."
        onClose={() => setStaffToDelete(null)}
        onConfirm={handleConfirmDeleteStaff}
      />

      <DeleteConfirmModal
        isOpen={!!projectToDelete}
        title="Confirm Project Deletion"
        itemName={projectToDelete?.name}
        itemDescription="This will unassign all team members associated with this project."
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleConfirmDeleteProject}
      />
    </div>
  );
};
