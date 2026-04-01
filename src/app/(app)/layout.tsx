import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/sidebar/app-sidebar";
import { AppHeader } from "@/components/app/sidebar/app-header";
import { OnboardingOrchestrator } from "@/components/app/onboarding/onboarding-orchestrator";
import { PendingApprovalDialog } from "@/components/app/organisation/pending-approval-dialog";
import { DowngradeEnforcer } from "@/components/app/downgrade-enforcer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
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
