import { pageMetadata } from "@/lib/metadata";
import { PageGuard } from "@/components/guards/page-guard";
import { ClientsSkeleton } from "@/components/app/clients/clients-skeleton";

export const metadata = pageMetadata(
  "Clients",
  "Manage your clients and their access to portal workspaces.",
);

export default function ClientsPage() {
  return (
    <div className="px-4">
      <PageGuard requiredPlan="free" skeleton={<ClientsSkeleton />}>
        <div />
      </PageGuard>
    </div>
  );
}
