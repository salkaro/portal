import { pageMetadata } from "@/lib/metadata";
import { PageGuard } from "@/components/guards/page-guard";
import { IntegrationsContent } from "@/components/app/integrations/integrations-content";
import { IntegrationsSkeleton } from "@/components/app/integrations/integrations-skeleton";

export const metadata = pageMetadata(
  "Integrations",
  "Manage your connected integrations and their access permissions.",
);

export default function IntegrationsPage() {
  return (
    <div className="px-4">
      <PageGuard requiredPlan="free" skeleton={<IntegrationsSkeleton />}>
        <IntegrationsContent />
      </PageGuard>
    </div>
  );
}
