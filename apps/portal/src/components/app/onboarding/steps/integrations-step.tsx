import Image from "next/image";
import { Badge } from "@salkaro/ui";
import type { IntegrationCardDefinition } from "@/constants/integrations";

type IntegrationsStepProps = {
  integrations: IntegrationCardDefinition[];
};

export function IntegrationsStep({ integrations }: IntegrationsStepProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-foreground">
          Integration options
        </p>
        <Badge variant="outline" className="text-[10px]">
          Live + upcoming
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {integrations.map((integration) => (
          <div
            key={integration.provider}
            className="rounded-md bg-muted/35 p-2"
          >
            <div className="mb-1 flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5">
                <Image
                  src={integration.iconForLightTheme}
                  alt={integration.title}
                  width={16}
                  height={16}
                  className="dark:hidden"
                />
                <Image
                  src={integration.iconForDarkTheme}
                  alt={integration.title}
                  width={16}
                  height={16}
                  className="hidden dark:block"
                />
                <p className="text-[11px] font-medium text-foreground">
                  {integration.title}
                </p>
              </div>

              <Badge
                variant={integration.enabled ? "default" : "outline"}
                className="h-4 px-1.5 text-[9px]"
              >
                {integration.enabled ? "Live" : "Soon"}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
