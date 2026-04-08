"use client";

import Link from "next/link";
import { CheckIcon, XIcon } from "lucide-react";
import { Button } from "@salkaro/ui";
import { trackEvent } from "@/lib/analytics";
import { useSectionTracking } from "@/hooks/use-section-tracking";

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://portal.salkaro.com";

type Row = { label: string; free: string | false; pro: string | true };

const ROWS: Row[] = [
  { label: "Portals",              free: "1",          pro: "Unlimited" },
  { label: "Team members",         free: "1",          pro: "Up to 10" },
  { label: "Integrations",         free: "1",          pro: "Unlimited" },
  { label: "Client invites",       free: "3",          pro: "25" },
  { label: "Activity log",         free: false,        pro: "100 events" },
  { label: "PDF export",           free: "Standard",   pro: "Branded" },
  { label: "Custom branding",      free: false,        pro: true },
  { label: "Remove 'Powered by'",  free: false,        pro: true },
  { label: "All access controls",  free: "✓",          pro: true },
  { label: "Unlimited client views", free: "✓",        pro: true },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === false) return <XIcon className="size-3.5 text-muted-foreground/40 mx-auto" />;
  if (value === true) return <CheckIcon className="size-3.5 text-primary mx-auto" />;
  if (value === "✓")  return <CheckIcon className="size-3.5 text-primary mx-auto" />;
  return <span className="text-xs text-foreground">{value}</span>;
}

export function PricingTeaser() {
  const ref = useSectionTracking("pricing");
  return (
    <section ref={ref} id="pricing" className="py-20 sm:py-28 bg-muted/30 border-y border-border">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">
            Start free. Upgrade when you need more portals or want your own branding.
          </p>
        </div>


        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          {/* Header row */}
          <div className="grid grid-cols-3 border-b border-border">
            <div className="p-5" />
            <div className="p-5 border-l border-border text-center">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Free</div>
              <div className="text-2xl font-bold">$0</div>
              <div className="text-xs text-muted-foreground mt-0.5">Forever free</div>
            </div>
            <div className="p-5 border-l border-border text-center bg-primary/5">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Pro</div>
              <div className="text-2xl font-bold">Coming soon</div>
              <div className="text-xs text-muted-foreground mt-0.5">Early pricing for waitlist</div>
            </div>
          </div>

          {/* Feature rows */}
          {ROWS.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-3 ${i !== ROWS.length - 1 ? "border-b border-border" : ""}`}
            >
              <div className="px-5 py-3 text-xs text-muted-foreground flex items-center">{row.label}</div>
              <div className="px-5 py-3 border-l border-border flex items-center justify-center">
                <Cell value={row.free} />
              </div>
              <div className="px-5 py-3 border-l border-border flex items-center justify-center bg-primary/5">
                <Cell value={row.pro} />
              </div>
            </div>
          ))}

          {/* CTA row */}
          <div className="grid grid-cols-3 border-t border-border">
            <div className="p-5" />
            <div className="p-4 border-l border-border flex items-center justify-center">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={`${PORTAL_URL}/waitlist`} onClick={() => trackEvent("waitlist_click", { location: "pricing" })}>Join waitlist</Link>
              </Button>
            </div>
            <div className="p-4 border-l border-border flex items-center justify-center bg-primary/5">
              <Button size="sm" className="w-full" asChild>
                <Link href={`${PORTAL_URL}/waitlist`} onClick={() => trackEvent("waitlist_click", { location: "pricing" })}>Join waitlist</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
