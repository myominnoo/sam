import * as XLSX from "xlsx";
import { db } from "../db";
import type { Staff, Project } from "../db";

export interface ParsedImportData {
  staff: {
    id: number;
    name: string;
    designation: string;
    fte: number;
    monthlyCapacity: Record<string, number>;
  }[];
  projects: {
    id: number;
    name: string;
    startMonth?: string;
    endMonth?: string;
  }[];
  assignments: {
    staffId: number;
    projectId: number;
    role: "PL" | "M" | "A";
  }[];
}

const MONTH_SHORT_TO_FULL: Record<string, string> = {
  Jan: "January",
  Feb: "February",
  Mar: "March",
  Apr: "April",
  May: "May",
  Jun: "June",
  Jul: "July",
  Aug: "August",
  Sep: "September",
  Oct: "October",
  Nov: "November",
  Dec: "December",
};

/**
 * Parses staff, project, and assignment sheets from an uploaded template file.
 */
export const parseExcelFile = async (file: File): Promise<ParsedImportData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
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
            "Invalid template format. File must contain 'Staff', 'Projects', and 'Assignments' sheets.",
          );
        }

        // 1. Staff Sheet
        const rawStaffRows: Record<string, any>[] = XLSX.utils.sheet_to_json(
          workbook.Sheets["Staff"],
        );
        const staffToInsert: ParsedImportData["staff"] = [];

        for (const row of rawStaffRows) {
          const id = Number(row["ID"]);
          const name = String(row["Name"] || "").trim();
          const designation = String(row["Designation"] || "RA").trim();
          const fte = Number(row["FTE"]) || 1.0;

          if (!id || !name) continue;

          const monthlyCapacity: Record<string, number> = {};

          // Updated Regex: Matches both short ("2026-Aug") & full month names ("2026-August")
          Object.keys(row).forEach((key) => {
            const match = key.match(/^(\d{4})-([A-Za-z]+)$/);
            if (match) {
              const year = match[1];
              const monthRaw = match[2];
              const fullMonth = MONTH_SHORT_TO_FULL[monthRaw] || monthRaw;
              const formattedKey = `${year}-${fullMonth}`;

              const val = Number(row[key]);
              if (!isNaN(val)) {
                monthlyCapacity[formattedKey] = val;
              }
            }
          });

          staffToInsert.push({ id, name, designation, fte, monthlyCapacity });
        }

        // 2. Projects Sheet
        const rawProjectRows: Record<string, any>[] = XLSX.utils.sheet_to_json(
          workbook.Sheets["Projects"],
        );
        const projectsToInsert: ParsedImportData["projects"] = [];

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

        // 3. Assignments Sheet
        const rawAssignmentRows: Record<string, any>[] =
          XLSX.utils.sheet_to_json(workbook.Sheets["Assignments"]);
        const assignmentsToInsert: ParsedImportData["assignments"] = [];

        for (const row of rawAssignmentRows) {
          const staffId = Number(row["Staff ID"]);
          const projectId = Number(row["Project ID"]);
          const roleRaw = String(row["Role"] || "M")
            .trim()
            .toUpperCase();

          if (!staffId || !projectId) continue;

          const role: "PL" | "M" | "A" =
            roleRaw === "PL" || roleRaw === "A" ? (roleRaw as "PL" | "A") : "M";

          assignmentsToInsert.push({ staffId, projectId, role });
        }

        resolve({
          staff: staffToInsert,
          projects: projectsToInsert,
          assignments: assignmentsToInsert,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Replaces IndexedDB contents atomically with parsed data.
 */
export const commitImportToDatabase = async (
  parsedData: ParsedImportData,
): Promise<void> => {
  await db.transaction(
    "rw",
    db.staff,
    db.projects,
    db.assignments,
    async () => {
      await db.staff.clear();
      await db.projects.clear();
      await db.assignments.clear();

      if (parsedData.staff.length > 0) {
        await db.staff.bulkAdd(parsedData.staff as any);
      }
      if (parsedData.projects.length > 0) {
        await db.projects.bulkAdd(parsedData.projects as any);
      }
      if (parsedData.assignments.length > 0) {
        await db.assignments.bulkAdd(parsedData.assignments as any);
      }
    },
  );
};

/**
 * Exports current staff allocations to Excel file.
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
