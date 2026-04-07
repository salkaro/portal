import { pageMetadata } from "@/lib/metadata";
import { ActivityContent } from "../../../components/app/activity/activity-content";
import { ActivitySkeleton } from "@/components/app/activity/activity-skeleton";
import { PageGuard } from "@/components/guards/page-guard";

export const metadata = pageMetadata(
  "Activity",
  "Track recent updates and events across your portals.",
);

export default function ActivityPage() {
  return (
    <div className="px-4">
      <PageGuard requiredPlan="free" skeleton={<ActivitySkeleton />}>
        <ActivityContent />
      </PageGuard>
    </div>
  );
}
