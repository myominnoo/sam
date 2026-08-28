import * as XLSX from "xlsx";
import { db } from "../db";

export const processExcelImport = async (file: File): Promise<void> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

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

    // Extract monthly capacity columns (e.g. "2026-Jan", "2026-Feb")
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
    const endMonthRaw = row["End Month"] ? String(row["End Month"]).trim() : "";

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

  // 4. Atomic Transaction: Replace database content
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
};
