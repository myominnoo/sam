import * as XLSX from "xlsx";
import { db } from "../db";
import type { Staff, Project } from "../db";

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

export const importFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (evt) => {
    const data = new Uint8Array(evt.target?.result as ArrayBuffer);
    const workbook = XLSX.read(data, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length > 0) {
      await db.transaction(
        "rw",
        db.staff,
        db.projects,
        db.assignments,
        async () => {
          await db.staff.clear();
          await db.projects.clear();
          await db.assignments.clear();

          const reservedKeys = ["Name", "Designation", "FTE", "Note"];
          const projectNames = Object.keys(jsonData[0]).filter(
            (k) => !reservedKeys.includes(k),
          );

          const projMap: Record<string, number> = {};
          for (const pName of projectNames) {
            const pid = await db.projects.add({
              name: pName,
              activeMonths: ["Aug", "Sep", "Oct"],
            });
            projMap[pName] = pid;
          }

          for (const row of jsonData) {
            const sid = await db.staff.add({
              name: row.Name || "Unknown",
              designation: row.Designation || "RA",
              fte: Number(row.FTE) || 1.0,
              capacity: 100,
            });

            for (const pName of projectNames) {
              const role = row[pName];
              if (role && ["PL", "M", "A"].includes(role)) {
                await db.assignments.add({
                  staffId: sid,
                  projectId: projMap[pName],
                  role: role as "PL" | "M" | "A",
                });
              }
            }
          }
        },
      );
    }
  };
  reader.readAsArrayBuffer(file);
};
