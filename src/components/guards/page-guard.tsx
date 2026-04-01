"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ROUTES, SETTINGS_ROUTES } from "@/constants/routes";
import { useOrganisation } from "@/hooks/use-organisation";
import { hasRequiredPlan, type PlanTier } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  NotAuthorisedNoOrganisation,
  NotAuthorisedUpgrade,
} from "@/components/ui/not-authorised";

type PageGuardProps = {
  requiredPlan: PlanTier;
  skeleton?: ReactNode;
  children: ReactNode;
};

export function PageGuard({
  requiredPlan,
  skeleton,
  children,
}: PageGuardProps) {
  const { organisation, loading } = useOrganisation();

  if (loading) {
    if (skeleton) {
      return <>{skeleton}</>;
    }

    return (
      <div className="flex items-center min-h-[40vh] justify-center gap-2 text-sm text-muted-foreground">
        <Spinner className="size-4" />
        Loading workspace...
      </div>
    );
  }

  if (!organisation) {
    return (
      <NotAuthorisedNoOrganisation
        action={
          <Button asChild size="sm" variant="outline">
            <Link href={ROUTES.GET_STARTED}>Get started</Link>
          </Button>
        }
      />
    );
  }

  if (!hasRequiredPlan(organisation.subscription, requiredPlan)) {
    return (
      <NotAuthorisedUpgrade
        action={
          <Button asChild size="sm">
            <Link href={SETTINGS_ROUTES.BILLING}>View plans</Link>
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
