import { pageMetadata } from "@/lib/metadata";
import { PortalsContent } from "@/components/app/portals/portals-content";
import { PortalsSkeleton } from "@/components/app/portals/portals-skeleton";
import { PageGuard } from "@/components/guards/page-guard";

export const metadata = pageMetadata(
  "Portals",
  "Create and manage client portal spaces for your agency.",
);

export default function PortalsPage() {
  return (
    <div className="px-4">
      <PageGuard requiredPlan="free" skeleton={<PortalsSkeleton />}>
        <PortalsContent />
      </PageGuard>
    </div>
  );
}
