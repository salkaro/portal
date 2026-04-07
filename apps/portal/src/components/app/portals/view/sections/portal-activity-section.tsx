"use client";

import { PortalActivityFeed } from "@/components/app/portals/view/shared/portal-activity-feed";
import type { PortalItem } from "@/types/portal-view";

type PortalActivitySectionProps = {
  items: PortalItem[];
};

export function PortalActivitySection({ items }: PortalActivitySectionProps) {
  return (
    <div className="space-y-4">
      <PortalActivityFeed items={items} />
    </div>
  );
}
