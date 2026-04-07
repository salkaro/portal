"use client";

import { useCallback, useMemo, useState } from "react";
import { RefreshCcwIcon } from "lucide-react";
import { Button } from "@salkaro/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@salkaro/ui";
import { useConnections } from "@/hooks/use-connections";
import { useOrganisation } from "@/hooks/use-organisation";
import { usePortals } from "@/hooks/use-portals";
import { useRefreshCooldown } from "@/hooks/use-refresh-cooldown";
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

  const handleRefresh = useCallback(async (silent: boolean) => {
    await Promise.all([refetchPortals(silent), refetchConnections(silent)]);
  }, [refetchPortals, refetchConnections]);
  const { refresh, refreshing, disabled: refreshDisabled } = useRefreshCooldown(handleRefresh);

  const enabledConnections = useMemo(() => {
    return connections.filter((connection) =>
      ["monday", "linear"].includes(connection.provider)
    );
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
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Refresh portals"
            disabled={refreshDisabled}
            onClick={() => void refresh()}
          >
            <RefreshCcwIcon className={`size-3 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
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
          hasConnections={enabledConnections.length > 0}
          onCreatePortal={() => setCreateDialogOpen(true)}
          atLimit={atLimit}
          limitLabel={limitLabel}
        />
      ) : (
        <PortalsList
          portals={portals}
        />
      )}
      {organisation && !atLimit ? (
        <PortalCreateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          organisationId={organisation.id}
          connections={enabledConnections}
          onCreated={handleRefetchAfterCreate}
        />
      ) : null}
    </section>
  );
}
