import { useState, useEffect } from "react"
import { Header, type TabType } from "@/components/Header"
import { DashboardView } from "@/components/dashboard/dashboard-view"
import { ManageDataView } from "@/components/manage/manage-data-view"
import { SeedDialog } from "@/components/dashboard/seed-dialog"
import { Footer } from "@/components/layout/footer"
import { initializeDatabase } from "@/db/schema"
import { useSamTour } from "@/hooks/use-sam-tour"

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = localStorage.getItem("sam_active_tab") as TabType
    return saved === "manage" ? "manage" : "dashboard"
  })
  const startSamTour = useSamTour(setActiveTab)

  // Ensure IndexedDB is initialized with seed data on boot
  useEffect(() => {
    initializeDatabase().catch((err) => {
      console.error("Failed to initialize database:", err)
    })
  }, [])

  useEffect(() => {
    localStorage.setItem("sam_active_tab", activeTab)
  }, [activeTab])

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-foreground p-3 sm:p-6 flex flex-col gap-5 w-full overflow-x-hidden relative">
      {/* Fixed Floating Header */}
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Canvas with Responsive Top Padding to Offset Wrapped Header */}
      <main className="w-full flex-1 pt-28 sm:pt-20 max-w-7xl mx-auto">
        {activeTab === "dashboard" ? <DashboardView /> : <ManageDataView />}
      </main>

      <Footer onStartOnboarding={startSamTour} />

      <SeedDialog />
    </div>
  )
}
