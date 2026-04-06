"use client";

import { useState } from "react";
import { FlaskConicalIcon, DownloadIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortalStatCards } from "@/components/app/portals/view/portal-stat-cards";
import { PortalStatusBreakdown } from "@/components/app/portals/view/portal-status-breakdown";
import { PortalTimelineSection } from "@/components/app/portals/view/portal-timeline-section";
import { PortalOwnersSection } from "@/components/app/portals/view/portal-owners-section";
import { PortalItemsTable } from "@/components/app/portals/view/monday/portal-items-table";
import { PortalActivityFeed } from "@/components/app/portals/view/portal-activity-feed";
import { getCompletionStats } from "@/utils/portal-view";
import { exportPortalPdf } from "@/lib/export-portal-pdf";
import {
  DEMO_BOARD_DATA,
  DEMO_CUSTOMIZATION,
  DEMO_PORTAL_NAME,
} from "@/constants/demo-data";
import { Building2, Clock, User } from "lucide-react";
import Link from "next/link";

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

export function DemoBoardView() {
  const [exporting, setExporting] = useState(false);

  const data = DEMO_BOARD_DATA;
  const { total, done, donePercent } = getCompletionStats(data.items);

  async function handleExport() {
    setExporting(true);
    try {
      await exportPortalPdf(DEMO_PORTAL_NAME, DEMO_CUSTOMIZATION, data);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Demo banner */}
      <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
        <FlaskConicalIcon className="size-4 shrink-0" />
        <span>
          This is a <span className="font-semibold">demo portal</span> with
          sample data. <Link className="underline" href="/get-started">Sign up</Link> to create your own.
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {DEMO_PORTAL_NAME}
            </h1>
            <p className="mt-1.5 text-base text-muted-foreground">
              {DEMO_CUSTOMIZATION.tagline}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <User className="size-3.5 shrink-0" />
              <span>
                <span className="text-muted-foreground/60">Project Owner:</span>{" "}
                <span className="font-medium text-foreground">
                  {DEMO_CUSTOMIZATION.projectOwner}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="size-3.5 shrink-0" />
              <span>
                <span className="text-muted-foreground/60">Last Updated:</span>{" "}
                <span className="font-medium text-foreground">just now</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="size-3.5 shrink-0" />
              <span>
                <span className="text-muted-foreground/60">Agency:</span>{" "}
                <span className="font-medium text-foreground">
                  {DEMO_CUSTOMIZATION.organisationName}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleExport()}
            disabled={exporting}
          >
            <DownloadIcon
              className={`size-3.5 ${exporting ? "animate-pulse" : ""}`}
            />
            {exporting ? "Exporting..." : "Export PDF"}
          </Button>
          <Button variant="outline" size="sm" disabled>
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      <ProgressHero donePercent={donePercent} done={done} total={total} />
      <PortalStatCards items={data.items} />
      <PortalStatusBreakdown items={data.items} />
      <PortalTimelineSection items={data.items} />
      <PortalOwnersSection items={data.items} />
      <PortalItemsTable columns={data.columns} items={data.items} />
      <PortalActivityFeed items={data.items} />
    </div>
  );
}
