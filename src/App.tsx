import { useState, useEffect, useCallback } from "react"
import { Header, type TabType } from "@/components/Header"
import { DashboardView } from "@/components/dashboard/dashboard-view"
import { ManageDataView } from "@/components/manage/manage-data-view"
import { SeedDialog } from "@/components/dashboard/seed-dialog"
import { Footer } from "@/components/layout/footer"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { initializeDatabase } from "@/db/schema"
import { useSamTour } from "@/hooks/use-sam-tour"

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = localStorage.getItem("sam_active_tab") as TabType
    return saved === "manage" ? "manage" : "dashboard"
  })
  const [isSeedDialogSettled, setIsSeedDialogSettled] = useState(
    () => localStorage.getItem("sam_onboarding_complete") === "true"
  )
  const [isTourPromptOpen, setIsTourPromptOpen] = useState(false)
  const startSamTour = useSamTour(setActiveTab)
  const handleSeedDialogComplete = useCallback(() => setIsSeedDialogSettled(true), [])

  // Ensure IndexedDB is initialized with seed data on boot
  useEffect(() => {
    initializeDatabase().catch((err) => {
      console.error("Failed to initialize database:", err)
    })
  }, [])

  useEffect(() => {
    localStorage.setItem("sam_active_tab", activeTab)
  }, [activeTab])

  useEffect(() => {
    if (!isSeedDialogSettled || localStorage.getItem("sam_tour_started") === "true") return

    setIsTourPromptOpen(true)
  }, [isSeedDialogSettled])

  const handleStartTour = () => {
    localStorage.setItem("sam_tour_started", "true")
    setIsTourPromptOpen(false)
    startSamTour()
  }

  const handleSkipTour = () => {
    localStorage.setItem("sam_tour_started", "true")
    setIsTourPromptOpen(false)
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-foreground p-3 sm:p-6 flex flex-col gap-5 w-full overflow-x-hidden relative">
      {/* Fixed Floating Header */}
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Compact mobile header needs only a small clearance; wider layouts retain the standard offset. */}
      <main className="w-full flex-1 pt-16 sm:pt-20 max-w-7xl mx-auto">
        {activeTab === "dashboard" ? <DashboardView /> : <ManageDataView />}
      </main>

      <Footer onStartOnboarding={startSamTour} />

      <SeedDialog onComplete={handleSeedDialogComplete} />
      <ConfirmDialog
        open={isTourPromptOpen}
        title="Take a quick tour?"
        description="Learn how to load data, manage your team and projects, assign roles, and read the capacity timeline."
        confirmLabel="Start Tour"
        cancelLabel="Not Now"
        variant="info"
        onConfirm={handleStartTour}
        onCancel={handleSkipTour}
      />
    </div>
  )
}
