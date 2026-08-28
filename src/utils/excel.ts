import * as XLSX from "xlsx";
import {
  type Staff,
  type Project,
  type Assignment,
  type RoleCategory,
  db,
} from "../db";

export interface ParsedImportData {
  staff: Staff[];
  projects: Project[];
  assignments: Assignment[];
  roles: RoleCategory[];
}

/**
 * Helper to transform YYYY-Month text (e.g. "2026-August") to standard key format ("2026-08")
 */
const monthNameToKeyMap: Record<string, string> = {
  January: "01",
  February: "02",
  March: "03",
  April: "04",
  May: "05",
  June: "06",
  July: "07",
  August: "08",
  September: "09",
  October: "10",
  November: "11",
  December: "12",
};

export const parseExcelFile = async (file: File): Promise<ParsedImportData> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });

  const result: ParsedImportData = {
    staff: [],
    projects: [],
    assignments: [],
    roles: [],
  };

  // 1. Parse Roles Sheet
  if (workbook.SheetNames.includes("Roles")) {
    const rawRoles = XLSX.utils.sheet_to_json<any>(workbook.Sheets["Roles"]);
    result.roles = rawRoles
      .map((r) => ({
        code: String(r["Role Code"] || r["code"] || "").trim(),
        name: String(r["Role Name"] || r["name"] || "").trim(),
      }))
      .filter((r) => r.code || r.name);
  }

  // 2. Parse Staff Sheet (including monthly capacity columns)
  if (workbook.SheetNames.includes("Staff")) {
    const rawStaff = XLSX.utils.sheet_to_json<any>(workbook.Sheets["Staff"]);
    result.staff = rawStaff.map((s) => {
      const id = Number(s["ID"] || s["id"]);
      const name = String(s["Name"] || s["name"] || "");
      const designation = String(s["Designation"] || s["designation"] || "");
      const fte = Number(s["FTE"] || s["fte"] || 1.0);

      // Extract capacity columns (e.g., "2026-August")
      const monthlyCapacity: Record<string, number> = {};
      Object.keys(s).forEach((key) => {
        if (key.includes("-")) {
          const [year, monthName] = key.split("-");
          const monthCode = monthNameToKeyMap[monthName] || monthName;
          const formattedKey = `${year}-${monthCode}`;
          monthlyCapacity[formattedKey] = Number(s[key]);
        }
      });

      return { id, name, designation, fte, monthlyCapacity };
    });
  }

  // 3. Parse Projects Sheet
  if (workbook.SheetNames.includes("Projects")) {
    const rawProjects = XLSX.utils.sheet_to_json<any>(
      workbook.Sheets["Projects"],
    );
    result.projects = rawProjects.map((p) => ({
      id: Number(p["ID"] || p["id"]),
      name: String(p["Name"] || p["name"] || ""),
      startMonth: p["Start Month"] ? String(p["Start Month"]) : undefined,
      endMonth: p["End Month"] ? String(p["End Month"]) : undefined,
    }));
  }

  // 4. Parse Assignments Sheet
  if (workbook.SheetNames.includes("Assignments")) {
    const rawAssignments = XLSX.utils.sheet_to_json<any>(
      workbook.Sheets["Assignments"],
    );
    result.assignments = rawAssignments.map((a) => ({
      staffId: Number(a["Staff ID"] || a["staffId"]),
      projectId: Number(a["Project ID"] || a["projectId"]),
      role: String(a["Role"] || a["role"] || "M").trim(),
    }));
  }

  return result;
};

export const exportToExcel = (
  staff: Staff[],
  projects: Project[],
  assignments: Assignment[],
  roles: RoleCategory[],
) => {
  const wb = XLSX.utils.book_new();

  // 1. Export Staff Sheet
  const staffRows = staff.map((s) => {
    const row: Record<string, any> = {
      ID: s.id,
      Name: s.name,
      Designation: s.designation,
      FTE: s.fte,
    };
    if (s.monthlyCapacity) {
      Object.entries(s.monthlyCapacity).forEach(([mKey, cap]) => {
        row[mKey] = cap;
      });
    }
    return row;
  });
  const staffWS = XLSX.utils.json_to_sheet(staffRows);
  XLSX.utils.book_append_sheet(wb, staffWS, "Staff");

  // 2. Export Projects Sheet
  const projectRows = projects.map((p) => ({
    ID: p.id,
    Name: p.name,
    "Start Month": p.startMonth || "",
    "End Month": p.endMonth || "",
  }));
  const projectsWS = XLSX.utils.json_to_sheet(projectRows);
  XLSX.utils.book_append_sheet(wb, projectsWS, "Projects");

  // 3. Export Assignments Sheet
  const assignmentRows = assignments.map((a) => {
    const s = staff.find((st) => st.id === a.staffId);
    const p = projects.find((pr) => pr.id === a.projectId);
    return {
      "Staff ID": a.staffId,
      "Staff Name": s ? s.name : "",
      "Project ID": a.projectId,
      "Project Name": p ? p.name : "",
      Role: a.role,
    };
  });
  const assignmentsWS = XLSX.utils.json_to_sheet(assignmentRows);
  XLSX.utils.book_append_sheet(wb, assignmentsWS, "Assignments");

  // 4. Export Roles Sheet
  const roleRows = roles.map((r) => ({
    "Role Code": r.code,
    "Role Name": r.name,
  }));
  const rolesWS = XLSX.utils.json_to_sheet(roleRows);
  XLSX.utils.book_append_sheet(wb, rolesWS, "Roles");

  // Generate date-stamped filename
  const timestamp = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `staff_allocation_export_${timestamp}.xlsx`);
};

// Add to excel.ts

export const commitImportToDatabase = async (data: ParsedImportData) => {
  await db.transaction(
    "rw",
    [db.staff, db.projects, db.assignments, db.roles],
    async () => {
      if (data.roles.length > 0) {
        await db.roles.clear();
        await db.roles.bulkAdd(data.roles);
      }
      if (data.staff.length > 0) {
        await db.staff.clear();
        await db.staff.bulkAdd(data.staff);
      }
      if (data.projects.length > 0) {
        await db.projects.clear();
        await db.projects.bulkAdd(data.projects);
      }
      if (data.assignments.length > 0) {
        await db.assignments.clear();
        await db.assignments.bulkAdd(data.assignments);
      }
    },
  );
};
