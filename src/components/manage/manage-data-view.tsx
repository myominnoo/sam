import { useState, useRef } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/db/schema"
import {
  IdCard,
  AlertTriangle,
  Download,
  Upload,
  Trash2,
  FileJson,
  FileSpreadsheet,
} from "lucide-react"
import { useSyncScroll } from "@/hooks/use-sync-scroll"
import { StaffDirectorySection } from "./staff-directory-section"
import { ProjectsDirectorySection } from "./projects-directory-section"
import { ActionButton } from "@/components/ui/action-button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ManageDesignationsDialog } from "./manage-designations-dialog"
import {
  ManageThresholdsDialog,
  DEFAULT_THRESHOLDS,
  type ThresholdSettings,
} from "./manage-thresholds-dialog"
import { exportToJSON, exportToXLSX, importDataFile } from "@/lib/data-io"

export function ManageDataView() {
  const staffList = useLiveQuery(() => db.staff.toArray(), []) ?? []
  const projectList = useLiveQuery(() => db.projects.toArray(), []) ?? []
  const assignmentList = useLiveQuery(() => db.assignments.toArray(), []) ?? []
  const designationList = useLiveQuery(() => db.designations.toArray(), []) ?? []

  // Dialog & Menu states
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false)
  const [showDesignationsDialog, setShowDesignationsDialog] = useState(false)
  const [showThresholdsDialog, setShowThresholdsDialog] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showImportMenu, setShowImportMenu] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isTransferring, setIsTransferring] = useState(false)
  const [dataMessage, setDataMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Synchronized horizontal scroll hook
  const { register, handleScroll } = useSyncScroll()

  // Threshold state (persisted to localStorage)
  const [thresholds, setThresholds] = useState<ThresholdSettings>(() => {
    const saved = localStorage.getItem("sam_flagging_thresholds")
    return saved ? JSON.parse(saved) : DEFAULT_THRESHOLDS
  })

  const handleSaveThresholds = (newThresholds: ThresholdSettings) => {
    setThresholds(newThresholds)
    localStorage.setItem(
      "sam_flagging_thresholds",
      JSON.stringify(newThresholds)
    )
  }

  const handleClearData = async () => {
    setIsClearing(true)
    try {
      await db.transaction(
        "rw",
        [db.staff, db.projects, db.assignments, db.allocations, db.designations],
        async () => {
          await db.staff.clear()
          await db.projects.clear()
          await db.assignments.clear()
          await db.allocations.clear()
          await db.designations.clear()
        }
      )
      setDataMessage({ type: "success", text: "All workspace data has been cleared." })
    } catch (error) {
      console.error("Failed to clear database:", error)
      setDataMessage({ type: "error", text: "Unable to clear workspace data. Please try again." })
    } finally {
      setIsClearing(false)
      setShowClearDataConfirm(false)
    }
  }

  const triggerFileInput = (acceptType: string) => {
    setShowImportMenu(false)
    if (fileInputRef.current) {
      fileInputRef.current.accept = acceptType
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsTransferring(true)
      setDataMessage(null)
      try {
        const { count } = await importDataFile(file)
        setDataMessage({ type: "success", text: `Imported ${count} records from ${file.name}.` })
      } catch (error) {
        console.error("Import failed:", error)
        setDataMessage({ type: "error", text: (error as Error).message })
      } finally {
        setIsTransferring(false)
      }
    }
    e.target.value = ""
  }

  const handleExport = async (format: "json" | "xlsx") => {
    setIsTransferring(true)
    setDataMessage(null)
    setShowExportMenu(false)
    try {
      await (format === "json" ? exportToJSON() : exportToXLSX())
      setDataMessage({ type: "success", text: `Your ${format.toUpperCase()} export is ready.` })
    } catch (error) {
      console.error("Export failed:", error)
      setDataMessage({ type: "error", text: `Unable to export ${format.toUpperCase()} data. Please try again.` })
    } finally {
      setIsTransferring(false)
    }
  }

  return (
    <>
      {/* Hidden File Input for Imports */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".json,.xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-col gap-6 w-full animate-in fade-in-50 duration-300 max-w-7xl mx-auto pb-12 px-1">
        {/* Action Bar - Single Row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Left: Configuration Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <ActionButton
              icon={IdCard}
              label="Designations"
              color="primary"
              onClick={() => setShowDesignationsDialog(true)}
            />
            <ActionButton
              icon={AlertTriangle}
              label="Thresholds"
              color="amber"
              onClick={() => setShowThresholdsDialog(true)}
            />
          </div>

          {/* Right: Data Management & Danger Zone */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* IMPORT DROPDOWN */}
            <div className="relative">
              <ActionButton
                icon={Upload}
                label="Import"
                color="sky"
              onClick={() => {
                  setShowImportMenu((prev) => !prev)
                  setShowExportMenu(false)
              }}
              disabled={isTransferring || isClearing}
              />

              {showImportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowImportMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-border/60 bg-card text-card-foreground shadow-xl z-50 p-1.5 flex flex-col gap-1 animate-in fade-in-50 zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => triggerFileInput(".json")}
                      className="flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 transition-colors w-full cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <FileJson className="h-4 w-4 shrink-0 text-sky-500" />
                        <span>JSON</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/80 font-normal">
                        Default
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerFileInput(".xlsx, .xls")}
                      className="flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors w-full cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span>XLSX</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/80 font-normal">
                        Excel
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* EXPORT DROPDOWN */}
            <div className="relative">
              <ActionButton
                icon={Download}
                label="Export"
                color="purple"
                onClick={() => {
                  setShowExportMenu((prev) => !prev)
                  setShowImportMenu(false)
                }}
              />

              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-border/60 bg-card text-card-foreground shadow-xl z-50 p-1.5 flex flex-col gap-1 animate-in fade-in-50 zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => handleExport("json")}
                      className="flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 transition-colors w-full cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <FileJson className="h-4 w-4 shrink-0 text-purple-500" />
                        <span>JSON</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/80 font-normal">
                        Default
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExport("xlsx")}
                      className="flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors w-full cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span>XLSX</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/80 font-normal">
                        Excel
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* CLEAR DATA BUTTON */}
            <ActionButton
              icon={Trash2}
              label="Clear Data"
              color="rose"
              onClick={() => setShowClearDataConfirm(true)}
              destructive
              disabled={isTransferring || isClearing}
            />
          </div>
        </div>

        {dataMessage && (
          <div className={`rounded-2xl border px-3.5 py-2.5 text-xs font-medium ${dataMessage.type === "success" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"}`}>
            {dataMessage.text}
          </div>
        )}

        {/* Directory Sections with Synchronized Scroll */}
        <div className="flex flex-col gap-6">
          <StaffDirectorySection
            staffList={staffList}
            projectList={projectList}
            assignmentList={assignmentList}
            designationList={designationList}
            scrollRef={register(0)}
            onScroll={() => handleScroll(0)}
          />

          <ProjectsDirectorySection
            projectList={projectList}
            staffList={staffList}
            assignmentList={assignmentList}
            scrollRef={register(1)}
            onScroll={() => handleScroll(1)}
          />
        </div>
      </div>

      {/* Designations Dialog */}
      <ManageDesignationsDialog
        open={showDesignationsDialog}
        onClose={() => setShowDesignationsDialog(false)}
      />

      {/* Thresholds Dialog */}
      <ManageThresholdsDialog
        open={showThresholdsDialog}
        onClose={() => setShowThresholdsDialog(false)}
        thresholds={thresholds}
        onSave={handleSaveThresholds}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={showClearDataConfirm}
        title="Clear All Data?"
        description="This will permanently delete all staff members, projects, assignments, allocations, and custom designations. This action cannot be undone."
        confirmLabel="Clear Data"
        cancelLabel="Cancel"
        isDestructive
        isLoading={isClearing}
        onConfirm={handleClearData}
        onCancel={() => setShowClearDataConfirm(false)}
      />
    </>
  )
}
