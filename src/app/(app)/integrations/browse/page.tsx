import { pageMetadata } from "@/lib/metadata";
import { PageGuard } from "@/components/guards/page-guard";
import { IntegrationsBrowseContent } from "@/components/app/integrations/integrations-browse-content";

export const metadata = pageMetadata(
  "Browse Integrations",
  "Discover and connect supported integrations for your organisation.",
);

export default function IntegrationsBrowsePage() {
  return (
    <div className="px-4">
      <PageGuard requiredPlan="free">
        <IntegrationsBrowseContent />
      </PageGuard>
    </div>
  );
}
