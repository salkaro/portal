"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRightIcon } from "lucide-react";
import { Button } from "@salkaro/ui";
import type { IntegrationProvider } from "@/constants/integrations";

type IntegrationCardProps = {
  provider: IntegrationProvider;
  title: string;
  description: string;
  imageForLightTheme: string;
  imageForDarkTheme: string;
  enabled: boolean;
  connectedCount?: number;
};

export function IntegrationCard({
  provider,
  title,
  description,
  imageForLightTheme,
  imageForDarkTheme,
  enabled,
  connectedCount = 0,
}: IntegrationCardProps) {
  return (
    <article className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="flex h-full min-h-72 flex-col">
        <div className="flex flex-1 items-center justify-center px-6">
          <Image
            src={imageForLightTheme}
            alt={`${title} integration preview`}
            width={180}
            height={72}
            className="h-auto max-h-16 w-auto object-contain opacity-95 dark:hidden"
          />
          <Image
            src={imageForDarkTheme}
            alt={`${title} integration preview`}
            width={180}
            height={72}
            className="hidden h-auto max-h-16 w-auto object-contain opacity-95 dark:block"
          />
        </div>

        <div className="mt-8 space-y-4">
          <p className="leading-relaxed text-muted-foreground">{description}</p>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {connectedCount > 0
                ? `${connectedCount} connected`
                : "Not connected"}
            </p>

            {enabled ? (
              <Button asChild size="sm">
                <Link href={`/api/auth/${provider}`}>
                  {connectedCount > 0 ? "Connect another" : "Connect"}
                  <ArrowUpRightIcon />
                </Link>
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled>
                Coming soon
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
