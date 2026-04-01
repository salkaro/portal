"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import {
  LinkIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { INTEGRATION_CARD_DEFINITIONS } from "@/constants/integrations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { IntegrationsSkeleton } from "@/components/app/integrations/integrations-skeleton";
import {
  SalkaroTable,
  type SalkaroColumn,
} from "@/components/ui/salkaro-table";
import { useConnections } from "@/hooks/use-connections";
import { useOrganisation } from "@/hooks/use-organisation";
import { formatDateTime } from "@/utils/format-dates";
import {
  deleteConnectedAccount,
  updateConnectedAccountDisplayName,
} from "@/services/supabase/connections";
import type { ConnectedAccount } from "@/services/supabase/connections";
import { getConnectionDisplayName } from "@/utils/connections";

export function IntegrationsContent() {
  const { connections, loading, error, refetch } = useConnections();
  const { organisation } = useOrganisation();
  const { resolvedTheme } = useTheme();
  const [deletingConnectionId, setDeletingConnectionId] = useState<
    string | null
  >(null);
  const [renamingConnectionId, setRenamingConnectionId] = useState<
    string | null
  >(null);
  const [pendingDisconnect, setPendingDisconnect] =
    useState<ConnectedAccount | null>(null);
  const [pendingRename, setPendingRename] = useState<ConnectedAccount | null>(
    null,
  );
  const [renameValue, setRenameValue] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);

  async function handleDisconnect(connection: ConnectedAccount) {
    if (!organisation?.id) {
      setDeleteError("No organisation selected.");
      return;
    }

    setDeleteError(null);
    setDeletingConnectionId(connection.id);

    const result = await deleteConnectedAccount({
      organisationId: organisation.id,
      connectionId: connection.id,
    });

    if (result.error) {
      setDeleteError(result.error.message);
      setDeletingConnectionId(null);
      return;
    }

    await refetch();
    setDeletingConnectionId(null);
    setPendingDisconnect(null);
  }

  async function handleRename() {
    if (!organisation?.id || !pendingRename) {
      setRenameError("Unable to rename this connection.");
      return;
    }

    const nextName = renameValue.trim();
    if (!nextName) {
      setRenameError("Please enter a name.");
      return;
    }

    setRenameError(null);
    setRenamingConnectionId(pendingRename.id);

    const result = await updateConnectedAccountDisplayName({
      organisationId: organisation.id,
      connectionId: pendingRename.id,
      displayName: nextName,
      existingMetadata: pendingRename.metadata,
    });

    if (result.error) {
      setRenameError(result.error.message);
      setRenamingConnectionId(null);
      return;
    }

    await refetch();
    setRenamingConnectionId(null);
    setPendingRename(null);
    setRenameValue("");
  }

  const connectedIntegrations = connections
    .map((connection) => {
      const definition = INTEGRATION_CARD_DEFINITIONS.find(
        (integration) => integration.provider === connection.provider,
      );

      if (!definition) {
        return null;
      }

      return {
        ...connection,
        definition,
      };
    })
    .filter(Boolean);

  function getConnectionIcon(connection: {
    definition: {
      iconForLightTheme: string;
      iconForDarkTheme: string;
    };
  }): string {
    return resolvedTheme === "dark"
      ? connection.definition.iconForDarkTheme
      : connection.definition.iconForLightTheme;
  }

  return (
    <section className={`space-y-4 ${loading ? 'py-6': ''}`}>
      {connectedIntegrations.length > 0 && (
        <div className="flex items-start justify-end gap-3">
          <Button asChild size="sm" variant="outline">
            <Link href="/integrations/browse">Browse integrations</Link>
          </Button>
        </div>
      )}

      {loading ? (
        <IntegrationsSkeleton />
      ) : error ? (
        <p className="text-sm text-destructive">
          Failed to load connected integrations: {error.message}
        </p>
      ) : connectedIntegrations.length === 0 ? (
        <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-border p-6 text-center">
          <div className="mb-2 flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <LinkIcon className="size-4" />
          </div>
          <p className="text-sm font-medium text-foreground">
            There are no connections.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse the integration library to connect your first workspace.
          </p>
          <div className="mt-4">
            <Button asChild size="sm">
              <Link href="/integrations/browse">Browse integrations</Link>
            </Button>
          </div>
        </div>
      ) : (
        <SalkaroTable
          rows={
            connectedIntegrations.filter(Boolean) as NonNullable<
              (typeof connectedIntegrations)[number]
            >[]
          }
          columns={
            [
              {
                key: "integration",
                label: "Integration",
                render: (c) => (
                  <div className="flex items-center gap-2">
                    <Image
                      src={getConnectionIcon(c)}
                      alt={`${c.definition.title} icon`}
                      width={18}
                      height={18}
                      className="h-4.5 w-4.5 shrink-0 object-contain"
                    />
                    <span className="font-medium">{c.definition.title}</span>
                  </div>
                ),
                searchValue: (c) => c.definition.title,
              },
              {
                key: "connection",
                label: "Connection",
                render: (c) => (
                  <span className="font-semibold">
                    {getConnectionDisplayName(c)}
                  </span>
                ),
                searchValue: (c) => getConnectionDisplayName(c),
              },
              {
                key: "connected",
                label: "Connected",
                render: (c) => (
                  <span className="text-muted-foreground">
                    {formatDateTime(c.created_at)}
                  </span>
                ),
              },
              {
                key: "actions",
                label: "",
                className: "w-12 text-right",
                render: (c) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Connection actions"
                      >
                        <MoreHorizontalIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setRenameError(null);
                          setPendingRename(c);
                          setRenameValue(getConnectionDisplayName(c));
                        }}
                      >
                        <PencilIcon />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setDeleteError(null);
                          setPendingDisconnect(c);
                        }}
                      >
                        <Trash2Icon />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ),
              },
            ] satisfies SalkaroColumn<
              NonNullable<(typeof connectedIntegrations)[number]>
            >[]
          }
          rowKey={(c) => c.id}
          searchable
          searchPlaceholder="Search integrations..."
          filterBy={["integration", "connection"]}
          emptyMessage="No integrations found."
        />
      )}

      {deleteError ? (
        <p className="text-sm text-destructive">
          Failed to disconnect integration: {deleteError}
        </p>
      ) : null}

      <AlertDialog
        open={pendingDisconnect !== null}
        onOpenChange={(open) => {
          if (!open && deletingConnectionId === null) {
            setPendingDisconnect(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect integration?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDisconnect
                ? `This will remove ${getConnectionDisplayName(pendingDisconnect)} from connected integrations.`
                : "This will remove this connected integration."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingConnectionId !== null}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={!pendingDisconnect || deletingConnectionId !== null}
              onClick={() => {
                if (!pendingDisconnect) {
                  return;
                }

                void handleDisconnect(pendingDisconnect);
              }}
            >
              {deletingConnectionId !== null
                ? "Disconnecting..."
                : "Disconnect"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={pendingRename !== null}
        onOpenChange={(open) => {
          if (!open && renamingConnectionId === null) {
            setPendingRename(null);
            setRenameValue("");
            setRenameError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename connection</DialogTitle>
            <DialogDescription>
              Set a human-readable label so your team can identify this
              integration.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Input
              value={renameValue}
              onChange={(event) => {
                setRenameValue(event.target.value);
                if (renameError) {
                  setRenameError(null);
                }
              }}
              placeholder="Workspace name"
              disabled={renamingConnectionId !== null}
            />
            {renameError ? (
              <p className="text-xs text-destructive">{renameError}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={renamingConnectionId !== null}
              onClick={() => {
                setPendingRename(null);
                setRenameValue("");
                setRenameError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                void handleRename();
              }}
              disabled={renamingConnectionId !== null}
            >
              {renamingConnectionId !== null ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
