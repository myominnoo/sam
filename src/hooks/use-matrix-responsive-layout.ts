import { useState, useRef, useEffect, useCallback } from "react"

interface UseMatrixResponsiveLayoutProps {
  monthCount: number
  metadataWidth?: number // Width of metadata & count columns combined (~232px)
  colWidth?: number // Width per month column (56px)
}

export function useMatrixResponsiveLayout({
  monthCount,
  metadataWidth = 232,
  colWidth = 56,
}: UseMatrixResponsiveLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  const checkOverflow = useCallback(() => {
    if (!containerRef.current) return
    const containerWidth = containerRef.current.clientWidth
    const requiredWidth = metadataWidth + monthCount * colWidth
    setIsOverflowing(requiredWidth > containerWidth)
  }, [monthCount, metadataWidth, colWidth])

  useEffect(() => {
    checkOverflow()
    const observer = new ResizeObserver(() => checkOverflow())
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }
    return () => observer.disconnect()
  }, [checkOverflow])

  const containerMaxWidthClass = isOverflowing ? "w-full max-w-none" : "w-full max-w-7xl mx-auto"
  const tableWidthClass = isOverflowing ? "w-max min-w-full table-auto" : "w-full table-fixed"

  return {
    containerRef,
    isOverflowing,
    containerMaxWidthClass,
    tableWidthClass,
  }
}