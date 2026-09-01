import { useEffect, useState } from "react"

export function useMatrixExpansion(allIds: number[] = [], storageKey?: string) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => {
    if (!storageKey) return new Set()

    try {
      const savedIds = JSON.parse(localStorage.getItem(storageKey) ?? "[]")
      return new Set(Array.isArray(savedIds) ? savedIds.filter(Number.isInteger) : [])
    } catch {
      return new Set()
    }
  })

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify([...expandedIds]))
    }
  }, [expandedIds, storageKey])

  const activeExpandedIds = new Set([...expandedIds].filter((id) => allIds.includes(id)))

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (activeExpandedIds.size === allIds.length) {
      setExpandedIds(new Set())
    } else {
      setExpandedIds(new Set(allIds))
    }
  }

  return {
    expandedIds,
    toggleExpand,
    toggleAll,
    isExpanded: (id: number) => activeExpandedIds.has(id),
    isAllExpanded: allIds.length > 0 && activeExpandedIds.size === allIds.length,
  }
}
