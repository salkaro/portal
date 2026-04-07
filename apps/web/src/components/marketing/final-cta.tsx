"use client";

import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@salkaro/ui";
import { trackEvent } from "@/lib/analytics";

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://portal.salkaro.com";

export function FinalCta() {
  return (
    <section className="py-20 sm:py-28 bg-primary">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center space-y-6">
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-primary-foreground max-w-2xl mx-auto">
          Ready to modernise how you update clients?
        </h2>
        <p className="text-primary-foreground/80 max-w-lg mx-auto">
          Join the waitlist and be first to access Salkaro Portal when early access opens.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            variant="secondary"
            className="w-full sm:w-auto gap-2"
            asChild
          >
            <Link href={`${PORTAL_URL}/waitlist`} onClick={() => trackEvent("waitlist_click", { location: "final_cta" })}>
              Join the waitlist
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
        </div>
        <p className="text-xs text-primary-foreground/60">
          No credit card required &middot; Free tier available at launch
        </p>
      </div>
    </section>
  );
}
