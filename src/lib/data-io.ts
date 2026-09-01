import * as XLSX from "xlsx"
import { db } from "@/db/schema"
import type { Staff, Project, Assignment, Allocation, Designation } from "@/types/sam"

export interface ExportDataPayload {
  version: number
  exportedAt: string
  staff: Staff[]
  projects: Project[]
  assignments: Assignment[]
  allocations?: Allocation[]
  designations?: Designation[]
}

/**
 * Exports database content as JSON file
 */
export async function exportToJSON() {
  const payload = await getAllData()
  const jsonString = JSON.stringify(payload, null, 2)
  const blob = new Blob([jsonString], { type: "application/json" })
  downloadBlob(blob, `sam-data-${formatDate()}.json`)
}

/**
 * Exports database content as XLSX workbook with tabs for each table
 */
export async function exportToXLSX() {
  const data = await getAllData()
  const wb = XLSX.utils.book_new()

  // Add sheets for each table
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.staff), "Staff")
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.projects), "Projects")
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.assignments), "Assignments")
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.allocations || []), "Allocations")
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.designations || []), "Designations")

  // Generate binary output and download
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
  const blob = new Blob([wbout], { type: "application/octet-stream" })
  downloadBlob(blob, `sam-data-${formatDate()}.xlsx`)
}

/**
 * Imports file (autodetects JSON vs XLSX) into Dexie IndexedDB
 */
export async function importDataFile(file: File): Promise<{ count: number }> {
  const filename = file.name.toLowerCase()
  let payload: Partial<ExportDataPayload> = {}

  if (filename.endsWith(".json")) {
    const text = await file.text()
    payload = JSON.parse(text)
  } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: "array" })

    payload = {
      staff: parseSheet<Staff>(wb, "Staff"),
      projects: parseSheet<Project>(wb, "Projects"),
      assignments: parseSheet<Assignment>(wb, "Assignments"),
      allocations: parseSheet<Allocation>(wb, "Allocations"),
      designations: parseSheet<Designation>(wb, "Designations"),
    }
  } else {
    throw new Error("Unsupported file format. Please upload a .json or .xlsx file.")
  }

  // Save parsed items to IndexedDB in a single transaction
  let totalRecords = 0
  await db.transaction(
    "rw",
    [db.staff, db.projects, db.assignments, db.allocations, db.designations],
    async () => {
      if (payload.staff?.length) {
        await db.staff.clear()
        await db.staff.bulkAdd(payload.staff as Staff[])
        totalRecords += payload.staff.length
      }
      if (payload.projects?.length) {
        await db.projects.clear()
        await db.projects.bulkAdd(payload.projects as Project[])
        totalRecords += payload.projects.length
      }
      if (payload.assignments?.length) {
        await db.assignments.clear()
        await db.assignments.bulkAdd(payload.assignments as Assignment[])
        totalRecords += payload.assignments.length
      }
      if (payload.allocations?.length) {
        await db.allocations.clear()
        await db.allocations.bulkAdd(payload.allocations as Allocation[])
        totalRecords += payload.allocations.length
      }
      if (payload.designations?.length) {
        await db.designations.clear()
        await db.designations.bulkAdd(payload.designations as Designation[])
        totalRecords += payload.designations.length
      }
    }
  )

  return { count: totalRecords }
}

// Internal Helpers
async function getAllData(): Promise<ExportDataPayload> {
  const [staff, projects, assignments, allocations, designations] = await Promise.all([
    db.staff.toArray(),
    db.projects.toArray(),
    db.assignments.toArray(),
    db.allocations.toArray(),
    db.designations.toArray(),
  ])

  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    staff,
    projects,
    assignments,
    allocations,
    designations,
  }
}

function parseSheet<T>(wb: XLSX.WorkBook, sheetName: string): T[] {
  const sheet = wb.Sheets[sheetName]
  if (!sheet) return []
  return XLSX.utils.sheet_to_json<T>(sheet)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function formatDate() {
  return new Date().toISOString().split("T")[0]
}