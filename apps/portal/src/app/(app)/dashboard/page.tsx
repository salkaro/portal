import { pageMetadata } from "@/lib/metadata";
import { PageGuard } from "@/components/guards/page-guard";
import { DashboardSkeleton } from "@/components/app/dashboard/dashboard-skeleton";

export const metadata = pageMetadata(
  "Dashboard",
  "Overview of your agency portal activity and key metrics.",
);

export default function DashboardPage() {
  return (
    <div className="px-4">
      <PageGuard requiredPlan="free" skeleton={<DashboardSkeleton />}>
        <div />
      </PageGuard>
    </div>
  );
}
