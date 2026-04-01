"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConnections } from "@/hooks/use-connections";
import { useOrganisation } from "@/hooks/use-organisation";
import { usePortals } from "@/hooks/use-portals";
import { PLAN_LIMITS } from "@/constants/plans";
import { PortalsEmptyState } from "@/components/app/portals/portals-empty-state";
import { PortalsList } from "@/components/app/portals/portals-list";
import { PortalCreateDialog } from "@/components/app/portals/portal-create-dialog";
import { PortalsSkeleton } from "@/components/app/portals/portals-skeleton";
import type { PlanTier } from "@/lib/plans";

export function PortalsContent() {
  const { organisation } = useOrganisation();
  const {
    connections,
    loading: connectionsLoading,
    error: connectionsError,
    refetch: refetchConnections,
  } = useConnections();
  const {
    portals,
    loading: portalsLoading,
    error: portalsError,
    refetch: refetchPortals,
  } = usePortals();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const mondayConnections = useMemo(() => {
    return connections.filter((connection) => connection.provider === "monday");
  }, [connections]);

  const portalLimit = organisation
    ? PLAN_LIMITS[organisation.subscription as PlanTier].PORTALS
    : Infinity;
  const atLimit = Number.isFinite(portalLimit) && portals.length >= portalLimit;
  const limitLabel = `Your ${organisation?.subscription ?? "current"} plan allows ${portalLimit} portal${portalLimit !== 1 ? "s" : ""}.`;

  async function handleRefetchAfterCreate() {
    await Promise.all([refetchPortals(), refetchConnections()]);
  }

  if (connectionsLoading || portalsLoading) {
    return <PortalsSkeleton />;
  }

  if (connectionsError) {
    return (
      <div className="py-6 text-sm text-destructive">
        Failed to load connections: {connectionsError.message}
      </div>
    );
  }

  if (portalsError) {
    return (
      <div className="py-6 text-sm text-destructive">
        Failed to load portals: {portalsError.message}
      </div>
    );
  }

  return (
    <section className="space-y-4 py-6">
      {portals.length > 0 && (
        <div className="flex items-start justify-end gap-3">
          {atLimit ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button disabled>Create portal</Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {limitLabel} Upgrade to create more.
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button onClick={() => setCreateDialogOpen(true)}>
              Create portal
            </Button>
          )}
        </div>
      )}
      {portals.length === 0 ? (
        <PortalsEmptyState
          hasMondayConnections={mondayConnections.length > 0}
          onCreatePortal={() => setCreateDialogOpen(true)}
          atLimit={atLimit}
          limitLabel={limitLabel}
        />
      ) : (
        <PortalsList
          organisationId={organisation?.id ?? ""}
          portals={portals}
          onChanged={handleRefetchAfterCreate}
        />
      )}
      {organisation && !atLimit ? (
        <PortalCreateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          organisationId={organisation.id}
          mondayConnections={mondayConnections}
          onCreated={handleRefetchAfterCreate}
        />
      ) : null}
    </section>
  );
}
