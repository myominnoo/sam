import { useState, useEffect, useMemo } from "react"
import { db } from "@/db/schema"
import type { Staff, Designation } from "@/types/sam"

export function useStaffTableState(
  staffList: Staff[],
  designationList: Designation[] = [],
  setDesignation: (code: string) => void
) {
  const [staffSearch, setStaffSearch] = useState("")
  const [selectedCapacityStaff, setSelectedCapacityStaff] = useState<Staff | null>(null)

  useEffect(() => {
    if (designationList.length > 0) {
      setDesignation(designationList[0].code)
    }
  }, [designationList, setDesignation])

  const handleToggleActive = async (s: Staff) => {
    try {
      await db.staff.update(s.id, {
        isActive: !(s.isActive ?? true),
      })
    } catch (err) {
      console.error("Failed to update staff status:", err)
    }
  }

  const filteredStaff = useMemo(() => {
    const query = staffSearch.trim().toLowerCase()
    if (!query) return staffList
    return staffList.filter((s) => s.name.toLowerCase().includes(query))
  }, [staffList, staffSearch])

  return {
    staffSearch,
    setStaffSearch,
    filteredStaff,
    selectedCapacityStaff,
    setSelectedCapacityStaff,
    handleToggleActive,
  }
}