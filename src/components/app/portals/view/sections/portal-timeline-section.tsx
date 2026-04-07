"use client";

import { PortalTimelineContent } from "@/components/app/portals/view/shared/portal-timeline-content";
import type { PortalItem } from "@/types/portal-view";

type PortalTimelineSectionProps = {
  items: PortalItem[];
};

export function PortalTimelineSection({ items }: PortalTimelineSectionProps) {
  return (
    <div className="space-y-4">
      <PortalTimelineContent items={items} />
    </div>
  );
}
