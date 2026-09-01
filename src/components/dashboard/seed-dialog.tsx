import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/db/schema"
import seedData from "@/db/seed.json"
import type { Assignment, RoleType } from "@/types/sam"
import { Sparkles, Database, ArrowRight } from "lucide-react"

export function SeedDialog() {
  const staffCount = useLiveQuery(() => db.staff.count(), [])
  const [isDismissed, setIsDismissed] = useState(() =>
    localStorage.getItem("sam_onboarding_complete") === "true"
  )
  const [isSeeding, setIsSeeding] = useState(false)
  const isOpen = !isDismissed && staffCount === 0

  const handlePopulateSeedData = async () => {
    setIsSeeding(true)
    try {
      // Cast seed data assignments to match the Assignment interface
      const typedAssignments: Assignment[] = seedData.assignments.map((a) => ({
        ...a,
        role: a.role as RoleType,
      }))

      await db.transaction("rw", [db.staff, db.projects, db.assignments, db.allocations, db.designations], async () => {
        await db.staff.bulkAdd(seedData.staff)
        await db.projects.bulkAdd(seedData.projects)
        await db.assignments.bulkAdd(typedAssignments)
        await db.allocations.bulkAdd(seedData.allocations)
        await db.designations.bulkAdd(seedData.designations)
      })
      localStorage.setItem("sam_onboarding_complete", "true")
      setIsDismissed(true)
    } catch (error) {
      console.error("Failed to seed database:", error)
    } finally {
      setIsSeeding(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in-50 duration-200">
      <div className="relative w-full max-w-md p-6 rounded-3xl border border-white/40 dark:border-white/15 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl shadow-2xl text-foreground text-left transition-all">
        <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-4 shadow-2xs">
          <Sparkles className="h-6 w-6" />
        </div>

        <h3 className="text-base font-bold tracking-tight text-foreground">
          Looks like your workspace is empty!
        </h3>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          Would you like to populate sample data to test out the capacity planning matrices, roles, and timeline sliders right away?
        </p>

        <div className="flex items-center justify-end gap-2.5 mt-6">
          <button
            type="button"
            onClick={() => {
              localStorage.setItem("sam_onboarding_complete", "true")
              setIsDismissed(true)
            }}
            className="px-3.5 h-9 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Start with Blank Slate
          </button>

          <button
            type="button"
            disabled={isSeeding}
            onClick={handlePopulateSeedData}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-md hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-50"
          >
            <Database className="h-3.5 w-3.5" />
            <span>{isSeeding ? "Loading Sample Data..." : "Load Sample Sandbox"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
