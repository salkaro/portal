"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ROUTES, SETTINGS_ROUTES } from "@/constants/routes";
import { useOrganisation } from "@/hooks/use-organisation";
import { hasRequiredPlan, type PlanTier } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type PageGuardProps = {
  requiredPlan: PlanTier;
  children: ReactNode;
};

export function PageGuard({ requiredPlan, children }: PageGuardProps) {
  const { organisation, loading } = useOrganisation();

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Spinner className="size-4" />
        Loading workspace...
      </div>
    );
  }

  if (!organisation) {
    return (
      <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
        You need an organisation to access this page.
        <div className="mt-3">
          <Button asChild size="sm" variant="outline">
            <Link href={ROUTES.GET_STARTED}>Create organisation</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!hasRequiredPlan(organisation.subscription, requiredPlan)) {
    return (
      <div className="rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-foreground">
          Upgrade required
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your current plan does not include this feature.
        </p>
        <div className="mt-3">
          <Button asChild size="sm">
            <Link href={SETTINGS_ROUTES.BILLING}>View plans</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
