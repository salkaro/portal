"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, DownloadIcon, Building2, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchPortalBoardData, trackPortalPdfExport } from "@/services/portals";
import { exportPortalPdf } from "@/lib/export-portal-pdf";
import { PortalBoardSkeleton } from "@/components/app/portals/view/portal-board-skeleton";
import { PortalStatCards } from "@/components/app/portals/view/portal-stat-cards";
import { PortalStatusBreakdown } from "@/components/app/portals/view/portal-status-breakdown";
import { PortalTimelineSection } from "@/components/app/portals/view/portal-timeline-section";
import { PortalOwnersSection } from "@/components/app/portals/view/portal-owners-section";
import { PortalItemsTable } from "@/components/app/portals/view/monday/portal-items-table";
import { PortalActivityFeed } from "@/components/app/portals/view/portal-activity-feed";
import { getCompletionStats } from "@/utils/portal-view";
import type { PortalBoardData } from "@/types/portal-view";

type PortalCustomization = {
  tagline: string | null;
  showStatusSection: boolean;
  showTimelineSection: boolean;
  showOwnersSection: boolean;
  projectOwner?: string | null;
  organisationName?: string | null;
};

type PortalBoardViewProps = {
  portalId: string;
  portalName: string;
  customization: PortalCustomization | null;
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

function useTimeAgo(date: Date | null): string {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!date) return;
    const id = setInterval(() => setTick((value) => value + 1), 60_000);
    return () => clearInterval(id);
  }, [date]);

  void tick;
  return date ? timeAgo(date) : "";
}

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

export function PortalBoardView({
  portalId,
  portalName,
  customization,
}: PortalBoardViewProps) {
  const [data, setData] = useState<PortalBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const lastUpdatedLabel = useTimeAgo(lastUpdated);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const boardData = await fetchPortalBoardData(portalId);
        setData(boardData);
        setLastUpdated(new Date());
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load portal data",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [portalId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  async function handleExport() {
    if (!data) return;
    setExporting(true);

    try {
      await exportPortalPdf(portalName, customization ?? null, data);
      await trackPortalPdfExport(portalId);
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return <PortalBoardSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="space-y-3 py-6">
        <p className="text-sm text-destructive">
          {error ?? "No data available."}
        </p>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          Try again
        </Button>
      </div>
    );
  }

  const showStatus = customization?.showStatusSection ?? true;
  const showTimeline = customization?.showTimelineSection ?? true;
  const showOwners = customization?.showOwnersSection ?? false;

  const { total, done, donePercent } = getCompletionStats(data.items);
  const projectOwner = customization?.projectOwner;
  const organisationName = customization?.organisationName;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{portalName}</h1>
            {customization?.tagline && (
              <p className="mt-1.5 text-base text-muted-foreground">
                {customization.tagline}
              </p>
            )}
          </div>

          {/* Metadata row */}
          {(projectOwner || organisationName || lastUpdated) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {projectOwner && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <User className="size-3.5 shrink-0" />
                  <span>
                    <span className="text-muted-foreground/60">
                      Project Owner:
                    </span>{" "}
                    <span className="font-medium text-foreground">
                      {projectOwner}
                    </span>
                  </span>
                </div>
              )}
              {lastUpdated && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="size-3.5 shrink-0" />
                  <span>
                    <span className="text-muted-foreground/60">
                      Last Updated:
                    </span>{" "}
                    <span className="font-medium text-foreground">
                      {lastUpdatedLabel}
                    </span>
                  </span>
                </div>
              )}
              {organisationName && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Building2 className="size-3.5 shrink-0" />
                  <span>
                    <span className="text-muted-foreground/60">Agency:</span>{" "}
                    <span className="font-medium text-foreground">
                      {organisationName}
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleExport()}
            disabled={exporting || refreshing}
          >
            <DownloadIcon
              className={`size-3.5 ${exporting ? "animate-pulse" : ""}`}
            />
            {exporting ? "Exporting..." : "Export PDF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={`size-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Progress hero */}
      <ProgressHero donePercent={donePercent} done={done} total={total} />

      {/* Stat cards — always shown */}
      <PortalStatCards items={data.items} />

      {/* Conditional sections */}
      {showStatus && <PortalStatusBreakdown items={data.items} />}

      {showTimeline && <PortalTimelineSection items={data.items} />}

      {showOwners && <PortalOwnersSection items={data.items} />}

      {/* Items table — always shown */}
      <PortalItemsTable columns={data.columns} items={data.items} />

      {/* Activity feed */}
      <PortalActivityFeed items={data.items} />
    </div>
  );
}
