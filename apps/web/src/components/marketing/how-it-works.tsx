"use client";

import { PlugIcon, LayoutDashboardIcon, ShareIcon } from "lucide-react";
import { useSectionTracking } from "@/hooks/use-section-tracking";

const STEPS = [
  {
    number: "01",
    icon: PlugIcon,
    title: "Connect your PM tool",
    description:
      "Link your Monday.com or Linear workspace with one OAuth connection. Your boards and projects are instantly available.",
  },
  {
    number: "02",
    icon: LayoutDashboardIcon,
    title: "Create your portal",
    description:
      "Choose which fields and sections to show, add your branding, and customise the client view — all in a few minutes.",
  },
  {
    number: "03",
    icon: ShareIcon,
    title: "Share with your client",
    description:
      "Send a link. Your client sees a live, always up-to-date view of their project. No login, no confusion, no more status emails.",
  },
];

export function HowItWorks() {
  const ref = useSectionTracking("how_it_works");
  return (
    <section ref={ref} id="how-it-works" className="py-20 sm:py-28 bg-muted/30 border-y border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Up and running in minutes
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            No complex setup. No training your clients. Just a clean portal they&apos;ll actually use.
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Connector line desktop */}
          <div className="hidden md:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-border" />

          {STEPS.map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center gap-4">
              <div className="relative flex size-16 items-center justify-center rounded-full border-2 border-border bg-background shadow-sm shrink-0">
                <step.icon className="size-6 text-primary" />
                <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {step.number.replace("0", "")}
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
