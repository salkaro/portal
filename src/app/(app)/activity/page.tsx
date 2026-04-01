import { pageMetadata } from "@/lib/metadata";
import { PageGuard } from "@/components/guards/page-guard";

export const metadata = pageMetadata(
  "Activity",
  "Track recent updates and events across your portals.",
);

export default function ActivityPage() {
  return (
    <div className="px-4">
      <PageGuard requiredPlan="free">
        <div />
      </PageGuard>
    </div>
  );
}
