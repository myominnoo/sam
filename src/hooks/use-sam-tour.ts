import { useCallback } from "react"
import { driver } from "driver.js"
import type { TabType } from "@/components/Header"

const TOUR_STEPS: { element: string; title: string; description: string; tab: TabType }[] = [
  { element: "#sam-import", title: "Load sample data", description: "Open Import and choose Load Sample Data to explore SAM with a ready-made workspace.", tab: "manage" },
  { element: "#sam-designations", title: "Set up designations", description: "Add or update the staff positions used by your team.", tab: "manage" },
  { element: "#sam-add-staff", title: "Add staff", description: "Add team members, choose their designation, and set their FTE capacity.", tab: "manage" },
  { element: "#sam-add-project", title: "Add projects", description: "Create projects and define their planned start and end months.", tab: "manage" },
  { element: "#sam-project-directory", title: "Assign project roles", description: "Edit a staff member or project to assign people and choose their roles.", tab: "manage" },
  { element: "#sam-timeline-filter", title: "Filter the timeline", description: "Use Timeline Window to focus the matrices on the months you need.", tab: "dashboard" },
  { element: "#sam-staff-capacity-matrix", title: "You’re ready", description: "Use the staff capacity and project timeline matrices to keep workloads visible.", tab: "dashboard" },
]

export function useSamTour(setActiveTab: (tab: TabType) => void) {
  return useCallback(() => {
  const showStep = (index: number, continueTour: () => void) => {
    const nextStep = TOUR_STEPS[index]
    setActiveTab(nextStep.tab)
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("sam:tour-target", { detail: nextStep.element }))
      window.setTimeout(continueTour, 100)
    }, 150)
  }

    const tour = driver({
      animate: true,
      smoothScroll: true,
      allowClose: true,
      overlayColor: "#000000",
      overlayOpacity: 0.45,
      stagePadding: 8,
      stageRadius: 14,
      popoverClass: "sam-driver-popover",
      showProgress: true,
      progressText: "{{current}} of {{total}}",
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Finish",
      steps: TOUR_STEPS.map((step) => ({
        element: step.element,
        popover: { title: step.title, description: step.description },
      })),
      onNextClick: (_element, _step, options) => {
        const nextIndex = (options.index ?? 0) + 1
        if (nextIndex >= TOUR_STEPS.length) {
          options.driver.destroy()
          return
        }
        showStep(nextIndex, () => options.driver.moveNext())
      },
      onPrevClick: (_element, _step, options) => {
        const previousIndex = Math.max(0, (options.index ?? 0) - 1)
        showStep(previousIndex, () => options.driver.movePrevious())
      },
    })

    showStep(0, () => tour.drive())
  }, [setActiveTab])
}
