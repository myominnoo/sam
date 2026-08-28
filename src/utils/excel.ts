import * as XLSX from "xlsx";
import { db } from "../db";
import type { Staff, Project } from "../db";

/**
 * Exports current staff allocations and project roles to an Excel file.
 */
export const exportToExcel = (
  staffMembers: Staff[],
  projects: Project[],
  getRole: (staffId: number, projectId: number) => string,
) => {
  const dataToExport = staffMembers.map((s) => {
    const row: Record<string, any> = {
      Name: s.name,
      Designation: s.designation,
      FTE: s.fte,
    };
    projects.forEach((p) => {
      row[p.name] = getRole(s.id!, p.id!);
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Staff Allocations");
  XLSX.writeFile(workbook, "Staff_Allocation_Data.xlsx");
};

/**
 * Imports staff, project, and assignment data from staff_allocation_template.xlsx.
 */
export const processExcelImport = async (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const sheetNames = workbook.SheetNames;
        if (
          !sheetNames.includes("Staff") ||
          !sheetNames.includes("Projects") ||
          !sheetNames.includes("Assignments")
        ) {
          throw new Error(
            "Invalid template format. The Excel file must contain 'Staff', 'Projects', and 'Assignments' sheets.",
          );
        }

        // 1. Parse Staff Sheet
        const staffSheet = workbook.Sheets["Staff"];
        const rawStaffRows: Record<string, any>[] =
          XLSX.utils.sheet_to_json(staffSheet);

        const staffToInsert: {
          id: number;
          name: string;
          designation: string;
          fte: number;
          monthlyCapacity: Record<string, number>;
        }[] = [];

        for (const row of rawStaffRows) {
          const id = Number(row["ID"]);
          const name = String(row["Name"] || "").trim();
          const designation = String(row["Designation"] || "RA").trim();
          const fte = Number(row["FTE"]) || 1.0;

          if (!id || !name) continue;

          const monthlyCapacity: Record<string, number> = {};

          Object.keys(row).forEach((key) => {
            if (/^\d{4}-[A-Z][a-z]{2}$/.test(key)) {
              const value = Number(row[key]);
              if (!isNaN(value)) {
                monthlyCapacity[key] = value;
              }
            }
          });

          staffToInsert.push({
            id,
            name,
            designation,
            fte,
            monthlyCapacity,
          });
        }

        // 2. Parse Projects Sheet
        const projectsSheet = workbook.Sheets["Projects"];
        const rawProjectRows: Record<string, any>[] =
          XLSX.utils.sheet_to_json(projectsSheet);

        const projectsToInsert: {
          id: number;
          name: string;
          startMonth?: string;
          endMonth?: string;
        }[] = [];

        for (const row of rawProjectRows) {
          const id = Number(row["ID"]);
          const name = String(row["Name"] || "").trim();
          const startMonthRaw = row["Start Month"]
            ? String(row["Start Month"]).trim()
            : "";
          const endMonthRaw = row["End Month"]
            ? String(row["End Month"]).trim()
            : "";

          if (!id || !name) continue;

          projectsToInsert.push({
            id,
            name,
            startMonth: startMonthRaw || undefined,
            endMonth: endMonthRaw || undefined,
          });
        }

        // 3. Parse Assignments Sheet
        const assignmentsSheet = workbook.Sheets["Assignments"];
        const rawAssignmentRows: Record<string, any>[] =
          XLSX.utils.sheet_to_json(assignmentsSheet);

        const assignmentsToInsert: {
          staffId: number;
          projectId: number;
          role: "PL" | "M" | "A";
        }[] = [];

        for (const row of rawAssignmentRows) {
          const staffId = Number(row["Staff ID"]);
          const projectId = Number(row["Project ID"]);
          const roleRaw = String(row["Role"] || "M")
            .trim()
            .toUpperCase();

          if (!staffId || !projectId) continue;

          const role: "PL" | "M" | "A" =
            roleRaw === "PL" || roleRaw === "A" ? (roleRaw as "PL" | "A") : "M";

          assignmentsToInsert.push({
            staffId,
            projectId,
            role,
          });
        }

        // 4. Atomic Database Replacement
        await db.transaction(
          "rw",
          db.staff,
          db.projects,
          db.assignments,
          async () => {
            await db.staff.clear();
            await db.projects.clear();
            await db.assignments.clear();

            if (staffToInsert.length > 0) {
              await db.staff.bulkAdd(staffToInsert as any);
            }

            if (projectsToInsert.length > 0) {
              await db.projects.bulkAdd(projectsToInsert as any);
            }

            if (assignmentsToInsert.length > 0) {
              await db.assignments.bulkAdd(assignmentsToInsert as any);
            }
          },
        );

        resolve();
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
