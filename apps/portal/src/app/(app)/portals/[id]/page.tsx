import { pageMetadata } from "@/lib/metadata";
import { PortalDetailContent } from "@/components/app/portals/portal-detail-content";
import { PageGuard } from "@/components/guards/page-guard";
import { PortalsSkeleton } from "@/components/app/portals/portals-skeleton";

export const metadata = pageMetadata(
  "Portal",
  "Manage your client portal settings.",
);

export default async function PortalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  console.log(id)
  return (
    <PageGuard requiredPlan="free" skeleton={<PortalsSkeleton />}>
      <PortalDetailContent portalId={id} />
    </PageGuard>
  );
}
