"use client";

import { PortalTimelineContent } from "@/components/app/portals/view/shared/portal-timeline-content";
import type { PortalItem } from "@/types/portal-view";

type PortalTimelineSectionProps = {
  items: PortalItem[];
};

export function PortalTimelineSection({ items }: PortalTimelineSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Timeline</h2>
        <p className="text-sm text-muted-foreground">Milestones and upcoming deadlines</p>
      </div>
      <PortalTimelineContent items={items} />
    </div>
  );
}
