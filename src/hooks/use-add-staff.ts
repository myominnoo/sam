import { useState } from "react"
import { localSamRepository } from "@/infrastructure/local/sam-repository"
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

  const addStaff = async (e?: React.FormEvent): Promise<{ success: boolean; name?: string; error?: string }> => {
    if (e) e.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    if (!trimmedName) return { success: false, error: "Enter a staff name." }

    if (fte < 0 || fte > 1) {
      setError("FTE must be between 0 and 1.")
      return { success: false, error: "FTE must be between 0 and 1." }
    }

    // Case-insensitive duplicate check
    const isDuplicate = staffList.some(
      (s) => s.name.trim().toLowerCase() === trimmedName.toLowerCase()
    )

    if (isDuplicate) {
      setError(`Staff member "${toTitleCase(trimmedName)}" already exists.`)
      return { success: false, error: `Staff member "${toTitleCase(trimmedName)}" already exists.` }
    }

    setIsSubmitting(true)
    try {
      const maxId = staffList.reduce((max, s) => Math.max(max, Number(s.id) || 0), 0)
      const nextId = maxId > 0 ? maxId + 1 : Date.now()

      await localSamRepository.saveStaff({
        id: nextId,
        name: trimmedName,
        designation,
        fte,
        isActive: true,
      } as Staff)

      setName("")
      setError(null)
      return { success: true, name: toTitleCase(trimmedName) }
    } catch (err) {
      setError(`Failed to add staff member: ${(err as Error).message}`)
      return { success: false, error: `Failed to add staff member: ${(err as Error).message}` }
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
