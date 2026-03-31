"use client";

import Link from "next/link";
import { INTEGRATION_CARD_DEFINITIONS } from "@/constants/integrations";
import { IntegrationCard } from "@/components/app/integrations/integration-card";
import { Button } from "@/components/ui/button";
import { useConnections } from "@/hooks/use-connections";

export function IntegrationsBrowseContent() {
  const { connections } = useConnections();

  return (
    <section className="space-y-4 py-6">
      <div className="flex items-start gap-3">
        <Button asChild size="sm" variant="outline">
          <Link href="/integrations">Back to connected</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {INTEGRATION_CARD_DEFINITIONS.map((integration) => (
          <IntegrationCard
            key={integration.provider}
            provider={integration.provider}
            title={integration.title}
            description={integration.description}
            imageForLightTheme={integration.imageForLightTheme}
            imageForDarkTheme={integration.imageForDarkTheme}
            enabled={integration.enabled}
            connectedCount={
              connections.filter((c) => c.provider === integration.provider)
                .length
            }
          />
        ))}
      </div>
    </section>
  );
}
