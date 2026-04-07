"use client";

import { PortalItemsTable } from "@/components/app/portals/view/shared/portal-items-table";
import type { PortalColumn, PortalItem } from "@/types/portal-view";
import { getCompletionStats } from "@/utils/portal-view";

type PortalTasksSectionProps = {
  columns: PortalColumn[];
  items: PortalItem[];
};

export function PortalTasksSection({ columns, items }: PortalTasksSectionProps) {
  const { total, donePercent } = getCompletionStats(items);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Tasks</h2>
        <p className="text-sm text-muted-foreground">
          {total} task{total !== 1 ? "s" : ""} · {donePercent}% complete
        </p>
      </div>
      <PortalItemsTable columns={columns} items={items} />
    </div>
  );
}
