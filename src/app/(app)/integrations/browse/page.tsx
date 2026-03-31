import { IntegrationsBrowseContent } from "@/components/app/integrations/integrations-browse-content";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Browse Integrations",
  "Discover and connect supported integrations for your organisation.",
);

export default function IntegrationsBrowsePage() {
  return (
    <div className="px-4">
      <IntegrationsBrowseContent />
    </div>
  );
}
