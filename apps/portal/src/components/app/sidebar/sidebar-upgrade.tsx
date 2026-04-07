import Link from "next/link";
import { ArrowUpRightIcon, SparklesIcon } from "lucide-react";
import { Button } from "@salkaro/ui";
import { SETTINGS_ROUTES } from "@/constants/routes";

export function SidebarUpgrade() {
  return (
    <div className="group-data-[collapsible=icon]:hidden rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3 mb-1">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
        <SparklesIcon className="size-3.5" />
        Upgrade to Pro
      </div>
      <p className="mb-3 text-[11px] leading-relaxed text-sidebar-foreground/80">
        Unlock more portals and unlimited team members.
      </p>
      <Button asChild size="sm" className="w-full">
        <Link href={`${SETTINGS_ROUTES.BILLING}`}>
          Upgrade now
          <ArrowUpRightIcon />
        </Link>
      </Button>
    </div>
  );
}

export default SidebarUpgrade;
