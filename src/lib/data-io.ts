import type * as XLSX from "xlsx"
import { db } from "@/db/schema"
import type { Staff, Project, Assignment, Allocation, Designation } from "@/types/sam"
import { validateWorkspaceData } from "@/lib/workspace-validation"

export interface ExportDataPayload {
  version: number
  exportedAt: string
  staff: Staff[]
  projects: Project[]
  assignments: Assignment[]
  allocations?: Allocation[]
  designations?: Designation[]
}

export interface ImportPreview {
  payload: Required<Pick<ExportDataPayload, "staff" | "projects" | "assignments" | "allocations" | "designations">>
  count: number
}

const EXPORT_FOLDER_KEY = "default" as const
type WritableDirectoryHandle = FileSystemDirectoryHandle & {
  queryPermission: (descriptor: { mode: "readwrite" }) => Promise<PermissionState>
  requestPermission: (descriptor: { mode: "readwrite" }) => Promise<PermissionState>
}
type DirectoryPickerWindow = Window & typeof globalThis & {
  showDirectoryPicker: (options: { mode: "readwrite" }) => Promise<WritableDirectoryHandle>
}

export const supportsExportFolder = () => "showDirectoryPicker" in window

export async function getExportFolderName() {
  return (await db.exportSettings.get(EXPORT_FOLDER_KEY))?.name ?? null
}

export async function setExportFolder() {
  if (!supportsExportFolder()) throw new Error("This browser does not support choosing an export folder. Use Chrome, Edge, or another Chromium-based browser.")
  const handle = await (window as DirectoryPickerWindow).showDirectoryPicker({ mode: "readwrite" })
  await db.exportSettings.put({ id: EXPORT_FOLDER_KEY, handle, name: handle.name })
  return handle.name
}

export async function clearExportFolder() {
  await db.exportSettings.delete(EXPORT_FOLDER_KEY)
}

/**
 * Exports database content as JSON file
 */
export async function exportToJSON() {
  const payload = await getAllData()
  const jsonString = JSON.stringify(payload, null, 2)
  const blob = new Blob([jsonString], { type: "application/json" })
  const filename = `sam-data-${formatDate()}.json`
  return saveExport(blob, filename)
}

/**
 * Exports database content as XLSX workbook with tabs for each table
 */
export async function exportToXLSX() {
  const XLSX = await import("xlsx")
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
  const filename = `sam-data-${formatDate()}.xlsx`
  return saveExport(blob, filename)
}

/**
 * Imports file (autodetects JSON vs XLSX) into Dexie IndexedDB
 */
export async function previewImportDataFile(file: File): Promise<ImportPreview> {
  const filename = file.name.toLowerCase()
  let payload: Partial<ExportDataPayload> = {}

  if (filename.endsWith(".json")) {
    const text = await file.text()
    payload = JSON.parse(text)
  } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
    const XLSX = await import("xlsx")
    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: "array" })

    payload = {
      staff: parseSheet<Staff>(XLSX, wb, "Staff"),
      projects: parseSheet<Project>(XLSX, wb, "Projects"),
      assignments: parseSheet<Assignment>(XLSX, wb, "Assignments"),
      allocations: parseSheet<Allocation>(XLSX, wb, "Allocations"),
      designations: parseSheet<Designation>(XLSX, wb, "Designations"),
    }
  } else {
    throw new Error("Unsupported file format. Please upload a .json or .xlsx file.")
  }

  validateImportPayload(payload)
  validateWorkspaceData(payload)
  return {
    payload,
    count: payload.staff.length + payload.projects.length + payload.assignments.length + payload.allocations.length + payload.designations.length,
  }
}

/** Replaces the local workspace only after a validated preview is confirmed. */
export async function importDataFile(preview: ImportPreview): Promise<{ count: number }> {
  const { payload, count } = preview

  // Save parsed items to IndexedDB in a single transaction
  await db.transaction(
    "rw",
    [db.staff, db.projects, db.assignments, db.allocations, db.designations],
    async () => {
      await db.staff.clear()
      await db.projects.clear()
      await db.assignments.clear()
      await db.allocations.clear()
      await db.designations.clear()

      await db.staff.bulkAdd(payload.staff as Staff[])
      await db.projects.bulkAdd(payload.projects as Project[])
      await db.assignments.bulkAdd(payload.assignments as Assignment[])
      await db.allocations.bulkAdd(payload.allocations as Allocation[])
      await db.designations.bulkAdd(payload.designations as Designation[])
    }
  )

  return { count }
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

function parseSheet<T>(xlsx: typeof XLSX, wb: XLSX.WorkBook, sheetName: string): T[] {
  const sheet = wb.Sheets[sheetName]
  if (!sheet) return []
  return xlsx.utils.sheet_to_json<T>(sheet)
}

function validateImportPayload(payload: Partial<ExportDataPayload>): asserts payload is Required<Pick<ExportDataPayload, "staff" | "projects" | "assignments" | "allocations" | "designations">> {
  const requiredTables = ["staff", "projects", "assignments", "allocations", "designations"] as const
  for (const table of requiredTables) {
    if (!Array.isArray(payload[table])) {
      throw new Error(`Invalid import: the ${table} table is missing or malformed.`)
    }
  }
}

async function saveExport(blob: Blob, filename: string) {
  const folder = await db.exportSettings.get(EXPORT_FOLDER_KEY)
  if (folder) {
    const handle = folder.handle as WritableDirectoryHandle
    const permission = await handle.queryPermission({ mode: "readwrite" })
    const granted = permission === "granted" || await handle.requestPermission({ mode: "readwrite" }) === "granted"
    if (!granted) throw new Error(`SAM needs permission to write to ${folder.name}. Choose the export folder again or use browser downloads.`)
    const file = await handle.getFileHandle(filename, { create: true })
    const writable = await file.createWritable()
    await writable.write(blob)
    await writable.close()
    return { filename, destination: "folder" as const, folderName: folder.name }
  }
  downloadBlob(blob, filename)
  return { filename, destination: "downloads" as const }
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
