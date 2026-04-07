"use client";

import {
  RefreshCwIcon,
  UserXIcon,
  PaletteIcon,
  LockIcon,
  FileTextIcon,
  LayoutGridIcon,
  ZapIcon,
  EyeIcon,
  type LucideIcon,
} from "lucide-react";
import { useSectionTracking } from "@/hooks/use-section-tracking";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const HERO_FEATURE: Feature = {
  icon: RefreshCwIcon,
  title: "Always live, never stale",
  description:
    "Your portal syncs directly from your PM tool. When you update a task, clients see it instantly — no manual exports, no copy-paste.",
};

const MEDIUM_FEATURES: Feature[] = [
  {
    icon: UserXIcon,
    title: "No client login needed",
    description:
      "Clients access their portal via a shareable link or access code. Zero friction, zero setup on their end.",
  },
  {
    icon: PaletteIcon,
    title: "Your brand, not ours",
    description:
      "Add your logo, set brand colours, and hide the 'Powered by' badge. It looks like you built it.",
  },
];

const SMALL_FEATURES: Feature[] = [
  {
    icon: LockIcon,
    title: "Flexible access control",
    description: "Public link, access code, or email OTP. You decide who can see what.",
  },
  {
    icon: FileTextIcon,
    title: "PDF export",
    description: "Clients can download a branded PDF snapshot of their portal at any time.",
  },
  {
    icon: LayoutGridIcon,
    title: "Multiple portals",
    description: "One portal per client. Manage them all from a single dashboard.",
  },
  {
    icon: ZapIcon,
    title: "5-minute setup",
    description: "Connect your tool, create a portal, share the link. Done before your next meeting.",
  },
  {
    icon: EyeIcon,
    title: "Client-friendly view",
    description:
      "Task names, statuses, owners, timelines — shown clearly without overwhelming project management UI.",
  },
];

export function FeaturesSection() {
  const ref = useSectionTracking("features");
  const HeroIcon = HERO_FEATURE.icon;

  return (
    <section ref={ref} id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Everything your clients need. Nothing they don&apos;t.
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Built specifically for agency-client relationships — not repurposed project management software.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Large hero feature — spans 2 cols, 2 rows */}
          <div className="sm:col-span-2 lg:row-span-2 rounded-xl border border-border bg-card p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <HeroIcon className="size-5 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-base">{HERO_FEATURE.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{HERO_FEATURE.description}</p>
            </div>
            {/* Live sync illustration */}
            <div className="mt-auto rounded-lg border border-border bg-muted/40 p-4 space-y-2">
              {[
                { label: "Homepage redesign", synced: "2m ago", pct: 65 },
                { label: "Brand guidelines", synced: "Just now", pct: 100 },
                { label: "Mobile pass", synced: "1h ago", pct: 40 },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{item.label}</div>
                    <div className="mt-0.5 h-1 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{item.synced}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Medium features */}
          {MEDIUM_FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="size-4 text-primary" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </div>
          ))}

          {/* Small features */}
          {SMALL_FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card p-4 flex gap-3 items-start hover:shadow-md transition-shadow"
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted shrink-0">
                <Icon className="size-3.5 text-muted-foreground" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h3 className="font-semibold text-xs">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
