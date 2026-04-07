declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

type WaitlistLocation = "hero" | "pricing" | "nav" | "footer" | "final_cta";
type SectionName = "features" | "pricing" | "faq" | "how_it_works" | "demo";

type EventMap = {
  waitlist_click: { location: WaitlistLocation };
  demo_click: { location: "hero" | "demo_section" };
  signin_click: { location: "nav" | "footer" };
  faq_open: { question: string };
  section_view: { section: SectionName };
};

export function trackEvent<T extends keyof EventMap>(
  event: T,
  params: EventMap[T],
): void {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", event, params);
}
