import { useEffect, useState, useRef } from "react"
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
  Database,
  FolderSync,
} from "lucide-react"
import seedData from "@/db/seed.json"
import type { Assignment, RoleType } from "@/types/sam"
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
import { exportToJSON, exportToXLSX, exportToSyncFolder, importDataFile, previewImportDataFile, previewImportFromSyncFolder, type ImportPreview } from "@/lib/data-io"
import { toast } from "sonner"

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
  const [pendingImport, setPendingImport] = useState<ImportPreview | null>(null)
  const [pendingImportName, setPendingImportName] = useState("")
  const [pendingSyncFolderAction, setPendingSyncFolderAction] = useState<"import" | "export" | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const openImportForTour = (event: Event) => {
      if ((event as CustomEvent<string>).detail === "#sam-import") setShowImportMenu(true)
    }
    window.addEventListener("sam:tour-target", openImportForTour)
    return () => window.removeEventListener("sam:tour-target", openImportForTour)
  }, [])

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
    window.dispatchEvent(new Event("sam:thresholds-changed"))
  }

  const handleClearData = async () => {
    setIsClearing(true)
    try {
      await db.delete()
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith("sam_") || key === "vite-ui-theme") {
          localStorage.removeItem(key)
        }
      }
      toast.success("Local workspace cleared", { description: "Restarting SAM with a clean workspace." })
      window.setTimeout(() => window.location.reload(), 600)
    } catch (error) {
      console.error("Failed to clear database:", error)
      toast.error("Could not clear workspace data", { description: "Please try again." })
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
      try {
        const preview = await previewImportDataFile(file)
        setPendingImport(preview)
        setPendingImportName(file.name)
        toast.success("Import file validated", { description: `${preview.count} records are ready to review.` })
      } catch (error) {
        console.error("Import failed:", error)
        toast.error("Could not read import file", { description: (error as Error).message })
      } finally {
        setIsTransferring(false)
      }
    }
    e.target.value = ""
  }

  const confirmImport = async () => {
    if (!pendingImport) return
    setIsTransferring(true)
    try {
      const { count } = await importDataFile(pendingImport)
      toast.success("Data imported", { description: `${count} records from ${pendingImportName} are now available.` })
      setPendingImport(null)
    } catch (error) {
      toast.error("Could not import data", { description: (error as Error).message })
    } finally {
      setIsTransferring(false)
    }
  }

  const handleImportFromSyncFolder = async () => {
    setShowImportMenu(false)
    setIsTransferring(true)
    try {
      const { file, preview } = await previewImportFromSyncFolder()
      setPendingImport(preview)
      setPendingImportName(file.name)
      toast.success("Sync snapshot validated", { description: `${preview.count} records are ready to review.` })
    } catch (error) {
      if ((error as Error).name !== "AbortError") toast.error("Could not read sync folder", { description: (error as Error).message })
    } finally {
      setIsTransferring(false)
    }
  }

  const handleLoadSampleData = async () => {
    setShowImportMenu(false)
    if (staffList.length > 0 || projectList.length > 0 || assignmentList.length > 0) {
      toast.error("Sample data needs an empty workspace", { description: "Clear local data first if you want to replace it." })
      return
    }

    setIsTransferring(true)
    try {
      const assignments: Assignment[] = seedData.assignments.map((assignment) => ({
        ...assignment,
        role: assignment.role as RoleType,
      }))
      await db.transaction("rw", [db.staff, db.projects, db.assignments, db.allocations, db.designations], async () => {
        await db.staff.bulkAdd(seedData.staff)
        await db.projects.bulkAdd(seedData.projects)
        await db.assignments.bulkAdd(assignments)
        await db.allocations.bulkAdd(seedData.allocations)
        await db.designations.bulkPut(seedData.designations)
      })
      localStorage.setItem("sam_onboarding_complete", "true")
      const count = seedData.staff.length + seedData.projects.length + seedData.assignments.length + seedData.allocations.length + seedData.designations.length
      toast.success("Sample data loaded", { description: `${count} records are ready to explore.` })
    } catch (error) {
      console.error("Failed to load sample data:", error)
      toast.error("Could not load sample data", { description: "Please try again." })
    } finally {
      setIsTransferring(false)
    }
  }

  const handleExport = async (format: "json" | "xlsx") => {
    setIsTransferring(true)
    setShowExportMenu(false)
    try {
      await (format === "json" ? exportToJSON() : exportToXLSX())
      toast.success("Export ready", { description: `Your ${format.toUpperCase()} file has been downloaded.` })
    } catch (error) {
      console.error("Export failed:", error)
      toast.error("Could not export data", { description: `Unable to create the ${format.toUpperCase()} file. Please try again.` })
    } finally {
      setIsTransferring(false)
    }
  }

  const handleExportToSyncFolder = async () => {
    setShowExportMenu(false)
    setIsTransferring(true)
    try {
      const filename = await exportToSyncFolder()
      toast.success("Sync snapshot saved", { description: `${filename} was saved to the selected folder.` })
    } catch (error) {
      if ((error as Error).name !== "AbortError") toast.error("Could not save sync snapshot", { description: (error as Error).message })
    } finally {
      setIsTransferring(false)
    }
  }

  const confirmSyncFolderAction = () => {
    const action = pendingSyncFolderAction
    setPendingSyncFolderAction(null)
    if (action === "import") void handleImportFromSyncFolder()
    if (action === "export") void handleExportToSyncFolder()
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

      <div className="flex flex-col gap-6 w-full animate-in fade-in-50 duration-300 max-w-7xl mx-auto pb-2 px-1">
        {/* Action Bar - Single Row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Left: Configuration Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <ActionButton
              id="sam-designations"
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
            <div id="sam-import" className="relative">
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
                      className="flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl hover:bg-muted transition-colors w-full cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <FileJson className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span>JSON</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/80 font-normal">
                        Default
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerFileInput(".xlsx, .xls")}
                      className="flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl hover:bg-muted transition-colors w-full cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span>XLSX</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/80 font-normal">
                        Excel
                      </span>
                    </button>
                    <div className="my-0.5 border-t border-border/60" />
                    <button type="button" onClick={() => { setShowImportMenu(false); setPendingSyncFolderAction("import") }} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl hover:bg-muted transition-colors w-full cursor-pointer">
                      <FolderSync className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>From Sync Folder</span>
                    </button>
                    <div className="my-0.5 border-t border-border/60" />
                    <button
                      type="button"
                      onClick={() => void handleLoadSampleData()}
                      disabled={isTransferring || isClearing}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-primary hover:bg-primary/10 transition-colors w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Database className="h-4 w-4 shrink-0 text-primary" />
                      <span>Load Sample Data</span>
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
                      className="flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl hover:bg-muted transition-colors w-full cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <FileJson className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span>JSON</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/80 font-normal">
                        Default
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExport("xlsx")}
                      className="flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl hover:bg-muted transition-colors w-full cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span>XLSX</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/80 font-normal">
                        Excel
                      </span>
                    </button>
                    <div className="my-0.5 border-t border-border/60" />
                    <button type="button" onClick={() => { setShowExportMenu(false); setPendingSyncFolderAction("export") }} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl hover:bg-muted transition-colors w-full cursor-pointer">
                      <FolderSync className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>To Sync Folder</span>
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
        open={pendingSyncFolderAction !== null}
        title={pendingSyncFolderAction === "export" ? "Allow folder access?" : "Open a sync folder?"}
        description={pendingSyncFolderAction === "export"
          ? "SAM will ask your browser to allow writing sam-workspace.json in a folder you choose. Choose a OneDrive or Google Drive desktop-sync folder to keep a portable local backup."
          : "SAM will ask your browser to let you select a folder containing sam-workspace.json. The snapshot will be validated before it can replace your local workspace."}
        confirmLabel={pendingSyncFolderAction === "export" ? "Choose folder" : "Open folder"}
        cancelLabel="Cancel"
        variant="info"
        onConfirm={confirmSyncFolderAction}
        onCancel={() => setPendingSyncFolderAction(null)}
      />
      <ConfirmDialog
        open={Boolean(pendingImport)}
        title="Replace workspace data?"
        description={pendingImport ? `${pendingImportName} passed validation and contains ${pendingImport.count} records. Importing replaces the current local workspace.` : ""}
        confirmLabel="Import data"
        isDestructive
        isLoading={isTransferring}
        onConfirm={confirmImport}
        onCancel={() => setPendingImport(null)}
      />
      <ConfirmDialog
        open={showClearDataConfirm}
        title="Clear All Data?"
        description="This will permanently delete the workspace IndexedDB database and reset saved app preferences, including all staff, projects, assignments, allocations, custom designations, and saved matrix views. This action cannot be undone."
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
