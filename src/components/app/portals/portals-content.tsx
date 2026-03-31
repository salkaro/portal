"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useConnections } from "@/hooks/use-connections";
import { useOrganisation } from "@/hooks/use-organisation";
import { usePortals } from "@/hooks/use-portals";
import { PortalsEmptyState } from "@/components/app/portals/portals-empty-state";
import { PortalsList } from "@/components/app/portals/portals-list";
import { PortalCreateDialog } from "@/components/app/portals/portal-create-dialog";

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

  async function handleRefetchAfterCreate() {
    await Promise.all([refetchPortals(), refetchConnections()]);
  }

  if (connectionsLoading || portalsLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Spinner className="size-4" />
        Loading portals...
      </div>
    );
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
          <Button onClick={() => setCreateDialogOpen(true)}>Create portal</Button>
        </div>
      )}
      {portals.length === 0 ? (
        <PortalsEmptyState
          hasMondayConnections={mondayConnections.length > 0}
          onCreatePortal={() => setCreateDialogOpen(true)}
        />
      ) : (
        <PortalsList
          organisationId={organisation?.id ?? ""}
          portals={portals}
          onChanged={handleRefetchAfterCreate}
        />
      )}
      {organisation ? (
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
