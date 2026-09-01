import { useState } from "react"
import { db } from "@/db/schema"
import { toTitleCase } from "@/lib/string-utils"
import type { Staff } from "@/types/sam"

export function useAddStaff(staffList: Staff[]) {
  const [name, setName] = useState("")
  const [designation, setDesignation] = useState("RA")
  const [fte, setFte] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Enforce FTE between 0 and 1
  const isFormValid = name.trim().length > 0 && fte >= 0 && fte <= 1

  const handleNameChange = (val: string) => {
    setName(val)
    if (error) setError(null)
  }

  const handleFteChange = (val: number) => {
    setFte(val)
    if (error) setError(null)
  }

  const addStaff = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    if (!trimmedName) return

    if (fte < 0 || fte > 1) {
      setError("FTE must be between 0 and 1.")
      return
    }

    // Case-insensitive duplicate check
    const isDuplicate = staffList.some(
      (s) => s.name.trim().toLowerCase() === trimmedName.toLowerCase()
    )

    if (isDuplicate) {
      setError(`Staff member "${toTitleCase(trimmedName)}" already exists.`)
      return
    }

    setIsSubmitting(true)
    try {
      const maxId = staffList.reduce((max, s) => Math.max(max, Number(s.id) || 0), 0)
      const nextId = maxId > 0 ? maxId + 1 : Date.now()

      await db.staff.add({
        id: nextId,
        name: trimmedName,
        designation,
        fte,
        isActive: true,
      } as Staff)

      setName("")
      setError(null)
    } catch (err) {
      setError(`Failed to add staff member: ${(err as Error).message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    name,
    designation,
    fte,
    error,
    isFormValid,
    isSubmitting,
    setName: handleNameChange,
    setDesignation,
    setFte: handleFteChange,
    addStaff,
  }
}