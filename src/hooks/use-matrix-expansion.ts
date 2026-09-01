import { useState } from "react"

export function useMatrixExpansion(allIds: number[] = []) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

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
    if (expandedIds.size === allIds.length) {
      setExpandedIds(new Set())
    } else {
      setExpandedIds(new Set(allIds))
    }
  }

  return {
    expandedIds,
    toggleExpand,
    toggleAll,
    isExpanded: (id: number) => expandedIds.has(id),
    isAllExpanded: allIds.length > 0 && expandedIds.size === allIds.length,
  }
}