"use client";

import { PortalActivityFeed } from "@/components/app/portals/view/shared/portal-activity-feed";
import type { PortalItem } from "@/types/portal-view";

type PortalActivitySectionProps = {
  items: PortalItem[];
};

export function PortalActivitySection({ items }: PortalActivitySectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Activity</h2>
        <p className="text-sm text-muted-foreground">Recent updates and events</p>
      </div>
      <PortalActivityFeed items={items} />
    </div>
  );
}
