import Link from "next/link";
import { ArrowRightIcon, MonitorIcon } from "lucide-react";
import { Badge, Button } from "@salkaro/ui";
import { PortalMockupTasks } from "@/components/marketing/portal-mockup-tasks";

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://portal.salkaro.com";

export function DemoSection() {
  return (
    <section id="demo" className="py-20 sm:py-28 bg-muted/30 border-y border-border overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Text */}
          <div className="lg:w-96 shrink-0 text-center lg:text-left space-y-5">
            <Badge variant="outline" className="gap-1.5">
              <MonitorIcon className="size-3" />
              Live demo
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              See exactly what your clients will see
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-md mx-auto lg:mx-0">
              Our demo portal is a real Salkaro Portal with sample project data. No signup. No credit card. Just click and explore.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button size="lg" className="gap-2" asChild>
                <Link href={`${PORTAL_URL}/demo`}>
                  Try the demo
                  <ArrowRightIcon className="size-4" />
                </Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Access code: <span className="font-mono font-medium">DEMO{new Date().getFullYear()}</span>
            </p>
          </div>

          {/* Portal mockup — fixed width, bleeds off the right edge */}
          <div className="shrink-0">
            <PortalMockupTasks />
          </div>
        </div>
      </div>
    </section>
  );
}
