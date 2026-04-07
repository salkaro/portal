"use client";

import { useCallback, useEffect, useState } from "react";
import { LayoutDashboard, ListTodo, GitBranch, Activity } from "lucide-react";
import { SidebarInset, SidebarProvider } from "@salkaro/ui";
import { fetchPortalBoardData, trackPortalPdfExport } from "@/services/portals";
import { exportPortalPdf } from "@/lib/export-portal-pdf";
import { PortalBoardSkeleton } from "@/components/app/portals/view/shared/portal-board-skeleton";
import { PortalSidebar } from "@/components/app/portals/view/layout/portal-sidebar";
import { PortalTopbar } from "@/components/app/portals/view/layout/portal-topbar";
import { PortalOverviewSection } from "@/components/app/portals/view/sections/portal-overview-section";
import { PortalTasksSection } from "@/components/app/portals/view/sections/portal-tasks-section";
import { PortalTimelineSection } from "@/components/app/portals/view/sections/portal-timeline-section";
import { PortalActivitySection } from "@/components/app/portals/view/sections/portal-activity-section";
import { Button } from "@salkaro/ui";
import { useOrganisation } from "@/hooks/use-organisation";
import { PLANS } from "@/constants/plans";
import type { PortalBoardData } from "@/types/portal-view";

export type NavSection = "overview" | "tasks" | "timeline" | "activity";

type PortalCustomization = {
  tagline: string | null;
  showStatusSection: boolean;
  showTimelineSection: boolean;
  showOwnersSection: boolean;
  projectOwner?: string | null;
  organisationName?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  foregroundColor?: string | null;
  hidePoweredBy?: boolean;
  hidePdfBranding?: boolean;
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
    const id = setInterval(() => setTick((v) => v + 1), 60_000);
    return () => clearInterval(id);
  }, [date]);
  void tick;
  return date ? timeAgo(date) : "";
}

export function PortalBoardView({
  portalId,
  portalName,
  customization,
}: PortalBoardViewProps) {
  const { organisation } = useOrganisation();
  const isPro = organisation?.subscription === PLANS.PRO;

  const [data, setData] = useState<PortalBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeSection, setActiveSection] = useState<NavSection>("overview");
  const lastUpdatedLabel = useTimeAgo(lastUpdated);

  const showTimeline = customization?.showTimelineSection ?? true;
  const showStatus = customization?.showStatusSection ?? true;

  const navItems: { id: NavSection; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "tasks", label: "Tasks", icon: ListTodo },
    ...(showTimeline ? [{ id: "timeline" as NavSection, label: "Timeline", icon: GitBranch }] : []),
    { id: "activity", label: "Activity", icon: Activity },
  ];

  const activeSectionLabel = navItems.find((n) => n.id === activeSection)?.label ?? "";

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
        setError(err instanceof Error ? err.message : "Unable to load portal data");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [portalId]
  );

  useEffect(() => {
    void load();
  }, [load]);

  async function handleExport() {
    if (!data) return;
    setExporting(true);
    try {
      await exportPortalPdf(portalName, customization ?? null, data, isPro);
      await trackPortalPdfExport(portalId);
    } finally {
      setExporting(false);
    }
  }

  if (loading) return <PortalBoardSkeleton />;

  if (error || !data) {
    return (
      <div className="space-y-3 py-6">
        <p className="text-sm text-destructive">{error ?? "No data available."}</p>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <PortalSidebar
        portalName={portalName}
        tagline={customization?.tagline}
        projectOwner={customization?.projectOwner}
        organisationName={customization?.organisationName}
        lastUpdatedLabel={lastUpdated ? lastUpdatedLabel : undefined}
        logoUrl={customization?.logoUrl}
        primaryColor={customization?.primaryColor}
        foregroundColor={customization?.foregroundColor}
        hidePoweredBy={customization?.hidePoweredBy}
        activeSection={activeSection}
        navItems={navItems}
        onSectionChange={setActiveSection}
      />

      <SidebarInset>
        <PortalTopbar
          activeSectionLabel={activeSectionLabel}
          refreshing={refreshing}
          exporting={exporting}
          canExport={isPro}
          onRefresh={() => void load(true)}
          onExport={() => void handleExport()}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {activeSection === "overview" && (
            <PortalOverviewSection items={data.items} showStatus={showStatus} />
          )}
          {activeSection === "tasks" && (
            <PortalTasksSection columns={data.columns} items={data.items} primaryColor={customization?.primaryColor ?? "#0d9488"} />
          )}
          {activeSection === "timeline" && showTimeline && (
            <PortalTimelineSection items={data.items} />
          )}
          {activeSection === "activity" && (
            <PortalActivitySection items={data.items} />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
