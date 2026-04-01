import { pageMetadata } from "@/lib/metadata";
import { PageGuard } from "@/components/guards/page-guard";

export const metadata = pageMetadata(
  "Dashboard",
  "Overview of your agency portal activity and key metrics.",
);

export default function DashboardPage() {
  return (
    <div className="px-4">
      <PageGuard requiredPlan="free">
        <div />
      </PageGuard>
    </div>
  );
}
