"use client";

import { PortalStatCards } from "@/components/app/portals/view/shared/portal-stat-cards";
import { PortalStatusBreakdown } from "@/components/app/portals/view/shared/portal-status-breakdown";
import type { PortalItem } from "@/types/portal-view";
import { getCompletionStats } from "@/utils/portal-view";

type PortalOverviewSectionProps = {
  items: PortalItem[];
  showStatus: boolean;
};

function ProgressHero({
  donePercent,
  done,
  total,
}: {
  donePercent: number;
  done: number;
  total: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Project Progress
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{donePercent}%</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {done} of {total} task{total !== 1 ? "s" : ""} complete
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            donePercent === 100
              ? "bg-green-500/10 text-green-600"
              : donePercent >= 50
                ? "bg-blue-500/10 text-blue-600"
                : "bg-amber-500/10 text-amber-600"
          }`}
        >
          {donePercent === 100
            ? "Complete"
            : donePercent >= 50
              ? "On Track"
              : "In Progress"}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            donePercent === 100
              ? "bg-green-500"
              : donePercent >= 50
                ? "bg-blue-500"
                : "bg-amber-500"
          }`}
          style={{ width: `${donePercent}%` }}
        />
      </div>
    </div>
  );
}

export function PortalOverviewSection({ items, showStatus }: PortalOverviewSectionProps) {
  const { total, done, donePercent } = getCompletionStats(items);

  return (
    <div className="space-y-6">
      <ProgressHero donePercent={donePercent} done={done} total={total} />
      <PortalStatCards items={items} />
      {showStatus && <PortalStatusBreakdown items={items} />}
    </div>
  );
}
