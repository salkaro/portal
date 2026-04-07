"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

type SectionName = "features" | "pricing" | "faq" | "how_it_works" | "demo";

export function useSectionTracking(section: SectionName) {
  const ref = useRef<HTMLElement>(null);
  const tracked = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !tracked.current) {
          tracked.current = true;
          trackEvent("section_view", { section });
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [section]);

  return ref;
}
