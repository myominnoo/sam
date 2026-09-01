import { useRef, useCallback } from "react"

export function useSyncScroll() {
  const refs = useRef<(HTMLDivElement | null)[]>([])

  const register = useCallback((index: number) => (el: HTMLDivElement | null) => {
    refs.current[index] = el
  }, [])

  const handleScroll = useCallback((scrollingIndex: number) => {
    const source = refs.current[scrollingIndex]
    if (!source) return

    const scrollLeft = source.scrollLeft

    refs.current.forEach((target, idx) => {
      if (idx !== scrollingIndex && target) {
        target.scrollLeft = scrollLeft
      }
    })
  }, [])

  return { register, handleScroll }
}