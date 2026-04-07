"use client";

import { useState } from "react";
import { FlaskConicalIcon, LayoutDashboard, ListTodo, GitBranch, Activity } from "lucide-react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PortalSidebar } from "@/components/app/portals/view/layout/portal-sidebar";
import { PortalTopbar } from "@/components/app/portals/view/layout/portal-topbar";
import { PortalOverviewSection } from "@/components/app/portals/view/sections/portal-overview-section";
import { PortalTasksSection } from "@/components/app/portals/view/sections/portal-tasks-section";
import { PortalTimelineSection } from "@/components/app/portals/view/sections/portal-timeline-section";
import { PortalActivitySection } from "@/components/app/portals/view/sections/portal-activity-section";
import { exportPortalPdf } from "@/lib/export-portal-pdf";
import {
  DEMO_BOARD_DATA,
  DEMO_CUSTOMIZATION,
  DEMO_PORTAL_NAME,
} from "@/constants/demo-data";
import type { NavSection } from "@/components/app/portals/view/portal-board-view";
import Link from "next/link";

const navItems: { id: NavSection; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "timeline", label: "Timeline", icon: GitBranch },
  { id: "activity", label: "Activity", icon: Activity },
];

export function DemoBoardView() {
  const [activeSection, setActiveSection] = useState<NavSection>("overview");
  const [exporting, setExporting] = useState(false);

  const data = DEMO_BOARD_DATA;
  const activeSectionLabel = navItems.find((n) => n.id === activeSection)?.label ?? "";

  async function handleExport() {
    setExporting(true);
    try {
      await exportPortalPdf(DEMO_PORTAL_NAME, DEMO_CUSTOMIZATION, data);
    } finally {
      setExporting(false);
    }
  }

  return (
    <SidebarProvider>
      <PortalSidebar
        portalName={DEMO_PORTAL_NAME}
        tagline={DEMO_CUSTOMIZATION.tagline}
        projectOwner={DEMO_CUSTOMIZATION.projectOwner}
        organisationName={DEMO_CUSTOMIZATION.organisationName}
        activeSection={activeSection}
        navItems={navItems}
        onSectionChange={setActiveSection}
      />

      <SidebarInset>
        <PortalTopbar
          activeSectionLabel={activeSectionLabel}
          refreshing={false}
          exporting={exporting}
          canExport={true}
          onRefresh={() => {}}
          onExport={() => void handleExport()}
        />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Demo banner */}
          <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
            <FlaskConicalIcon className="size-4 shrink-0" />
            <span>
              This is a <span className="font-semibold">demo portal</span> with sample data.{" "}
              <Link className="underline" href="/get-started">Sign up</Link> to create your own.
            </span>
          </div>

          {activeSection === "overview" && (
            <PortalOverviewSection
              items={data.items}
              showStatus={DEMO_CUSTOMIZATION.showStatusSection}
            />
          )}
          {activeSection === "tasks" && (
            <PortalTasksSection columns={data.columns} items={data.items} primaryColor="#0d9488" />
          )}
          {activeSection === "timeline" && DEMO_CUSTOMIZATION.showTimelineSection && (
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
