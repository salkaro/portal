import { pageMetadata } from "@/lib/metadata";
import { IntegrationsContent } from "@/components/app/integrations/integrations-content";

export const metadata = pageMetadata(
  "Integrations",
  "Manage your connected integrations and their access permissions.",
);

export default function IntegrationsPage() {
  return (
    <div className="px-4">
      <IntegrationsContent />
    </div>
  );
}
