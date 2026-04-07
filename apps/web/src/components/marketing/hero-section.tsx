import Link from "next/link";
import { ArrowRightIcon, PlayIcon } from "lucide-react";
import { Button } from "@salkaro/ui";
import { Badge } from "@salkaro/ui";
import { PortalMockup } from "@/components/marketing/portal-mockup";

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://portal.salkaro.com";

export function HeroSection() {
  return (
    <section className="relative pb-0" style={{ overflowX: "clip" }}>
      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Radial glow */}
      <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
        <div className="h-[600px] w-[900px] rounded-full bg-primary/10 blur-3xl -translate-y-1/2" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-24 sm:pt-36 pb-0 flex flex-col items-center text-center">
        <Badge variant="secondary" className="mb-6 gap-1.5">
          <span className="size-1.5 rounded-full bg-primary inline-block animate-pulse" />
          Early access open — join the waitlist
        </Badge>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground max-w-3xl leading-[1.1]">
          The client portal built{" "}
          <span className="text-primary">for agencies</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          Connect your Monday.com or Linear board and give clients a
          live, branded view of their project — no login required. Stop sending
          status update emails.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
          <Button size="lg" className="w-full sm:w-auto gap-2" asChild>
            <Link href={`${PORTAL_URL}/waitlist`}>
              Join the waitlist
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2" asChild>
            <Link href={`${PORTAL_URL}/demo`}>
              <PlayIcon className="size-4" />
              View demo
            </Link>
          </Button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          No credit card required &middot; Free tier available
        </p>

      </div>

      {/* Portal mockup — overflows right, clipped by section overflow-x: clip */}
      <div className="mt-12 pb-24 sm:pb-36 flex justify-center">
        <PortalMockup />
      </div>
    </section>
  );
}
