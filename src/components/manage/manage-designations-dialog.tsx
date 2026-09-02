import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { BadgeCheck, Plus, Trash2, X, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { db } from "@/db/schema"
import seedData from "@/db/seed.json"

interface ManageDesignationsDialogProps {
  open: boolean
  onClose: () => void
}

export function ManageDesignationsDialog({
  open,
  onClose,
}: ManageDesignationsDialogProps) {
  // Query IndexedDB table
  const dbDesignations = useLiveQuery(() => db.designations.toArray(), [])

  // Fallback to seedData if DB is empty or loading
  const designationList =
    dbDesignations && dbDesignations.length > 0
      ? dbDesignations
      : seedData.designations.map((d) => ({
          id: d.id,
          code: d.code,
          name: d.name,
        }))

  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    setCode("")
    setName("")
    setError(null)
    onClose()
  }

  const handleAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)

    const trimmedCode = code.trim().toUpperCase()
    const trimmedName = name.trim()

    if (!trimmedCode || !trimmedName) return

    const isDuplicate = designationList.some(
      (item) => item.code.toUpperCase() === trimmedCode
    )

    if (isDuplicate) {
      setError(`Designation code "${trimmedCode}" already exists.`)
      return
    }

    try {
      const currentDbCount = await db.designations.count()
      if (currentDbCount === 0 && seedData.designations) {
        await db.designations.bulkAdd(seedData.designations)
      }

      await db.designations.add({
        code: trimmedCode,
        name: trimmedName,
      })
      setCode("")
      setName("")
    } catch (err) {
      setError(`Failed to save designation: ${(err as Error).message}`)
    }
  }

  const handleDelete = async (id?: number) => {
    if (!id) return
    setError(null)
    try {
      const currentDbCount = await db.designations.count()
      if (currentDbCount === 0 && seedData.designations) {
        await db.designations.bulkAdd(seedData.designations)
      }

      await db.designations.delete(id)
    } catch {
      setError("Failed to delete designation.")
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={(e) => e.key === "Escape" && handleClose()}
    >
      {/* Backdrop */}
      <div
        className="sam-dialog-backdrop"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="designations-dialog-title"
        className={cn(
          "sam-dialog relative z-10 w-full max-w-lg overflow-hidden"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sam-dialog-header flex items-center justify-between p-5 px-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-xs">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <h2
              id="designations-dialog-title"
              className="text-base font-bold text-foreground tracking-tight"
            >
              Manage Staff Designations
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="sam-dialog-close"
            title="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col gap-5">
          {/* Add New Designation Form Row */}
          <div className="flex flex-col gap-2">
            <form
              onSubmit={handleAdd}
              className={cn(
                "p-3 rounded-2xl border flex items-center gap-3 flex-wrap sm:flex-nowrap transition-colors shadow-2xs",
                error ? "border-rose-500/60 bg-rose-500/5" : "border-border/70 bg-muted/10"
              )}
            >
              <input
                type="text"
                placeholder="CODE (E.G. SRA)"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value)
                  if (error) setError(null)
                }}
                className="w-full sm:w-36 h-9 px-3.5 rounded-xl text-xs uppercase font-mono font-bold bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <input
                type="text"
                placeholder="Designation Name (e.g. Senior...)"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (error) setError(null)
                }}
                className="w-full flex-1 h-9 px-3.5 rounded-xl text-xs font-medium bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <button
                type="submit"
                disabled={!code.trim() || !name.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 h-9 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </form>

            {/* Error Message Feedback */}
            {error && (
              <div className="flex items-center gap-1.5 px-3 py-2 text-xs text-rose-600 bg-rose-500/10 border border-rose-500/20 rounded-xl animate-in fade-in-50 duration-150">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}
          </div>

          {/* List of Designations */}
          <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
            {designationList.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-background hover:border-border transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-3.5">
                  <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-primary/10 text-primary border border-primary/20 min-w-[44px] text-center">
                    {item.code}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {item.name}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 transition-colors cursor-pointer"
                  title="Delete designation"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            {designationList.length === 0 && (
              <div className="py-10 px-6 flex items-center justify-center text-sm text-muted-foreground italic border border-dashed border-border/80 rounded-2xl bg-muted/5">
                No designations configured in database.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
