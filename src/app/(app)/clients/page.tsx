import { pageMetadata } from "@/lib/metadata";
import { PageGuard } from "@/components/guards/page-guard";

export const metadata = pageMetadata(
  "Clients",
  "Manage your clients and their access to portal workspaces.",
);

export default function ClientsPage() {
  return (
    <div className="px-4">
      <PageGuard requiredPlan="free">
        <div />
      </PageGuard>
    </div>
  );
}
