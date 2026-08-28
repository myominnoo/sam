import { useEffect, type RefObject } from "react";

export const useScrollSync = (
  ref1: RefObject<HTMLDivElement | null>,
  ref2: RefObject<HTMLDivElement | null>,
  enabled: boolean = true,
) => {
  useEffect(() => {
    if (!enabled) return;
    const el1 = ref1.current;
    const el2 = ref2.current;
    if (!el1 || !el2) return;

    let isSyncing1 = false;
    let isSyncing2 = false;

    const handleScroll1 = () => {
      if (!isSyncing1) {
        isSyncing2 = true;
        el2.scrollLeft = el1.scrollLeft;
      }
      isSyncing1 = false;
    };

    const handleScroll2 = () => {
      if (!isSyncing2) {
        isSyncing1 = true;
        el1.scrollLeft = el2.scrollLeft;
      }
      isSyncing2 = false;
    };

    el1.addEventListener("scroll", handleScroll1, { passive: true });
    el2.addEventListener("scroll", handleScroll2, { passive: true });

    return () => {
      el1.removeEventListener("scroll", handleScroll1);
      el2.removeEventListener("scroll", handleScroll2);
    };
  }, [ref1, ref2, enabled]);
};
