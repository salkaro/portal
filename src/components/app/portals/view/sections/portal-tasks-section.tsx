"use client";

import { PortalItemsTable } from "@/components/app/portals/view/shared/portal-items-table";
import type { PortalColumn, PortalItem } from "@/types/portal-view";


type PortalTasksSectionProps = {
  columns: PortalColumn[];
  items: PortalItem[];
  primaryColor?: string;
};

export function PortalTasksSection({ columns, items, primaryColor }: PortalTasksSectionProps) {
  return (
    <div className="space-y-4">
      <PortalItemsTable columns={columns} items={items} primaryColor={primaryColor} />
    </div>
  );
}
