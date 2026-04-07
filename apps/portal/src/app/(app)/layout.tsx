import { cookies } from "next/headers";
import { SidebarProvider, SidebarInset } from "@salkaro/ui";
import { AppSidebar } from "@/components/app/sidebar/app-sidebar";
import { AppHeader } from "@/components/app/sidebar/app-header";
import { OnboardingOrchestrator } from "@/components/app/onboarding/onboarding-orchestrator";
import { PendingApprovalDialog } from "@/components/app/organisation/pending-approval-dialog";
import { DowngradeEnforcer } from "@/components/app/downgrade-enforcer";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sidebarState = cookieStore.get("sidebar_state")?.value;
  const defaultOpen = sidebarState !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <OnboardingOrchestrator />
      <PendingApprovalDialog />
      <DowngradeEnforcer />
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
