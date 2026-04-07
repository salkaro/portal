"use client";

import { useState } from "react";
import { MoreHorizontalIcon, PencilIcon, ShieldCheckIcon, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SalkaroTable, type SalkaroColumn } from "@/components/ui/salkaro-table";
import { formatDateTime } from "@/utils/format-dates";
import { PortalAccessDialog } from "@/components/app/portals/portal-access-dialog";
import { PortalEditDialog } from "@/components/app/portals/portal-edit-dialog";
import { PortalDeleteDialog } from "@/components/app/portals/portal-delete-dialog";
import type { Portal } from "@/types/portal";

type PortalsListProps = {
  organisationId: string;
  portals: Portal[];
  onChanged: () => Promise<void>;
};

export function PortalsList({ organisationId, portals, onChanged }: PortalsListProps) {
  const [editingPortal, setEditingPortal] = useState<Portal | null>(null);
  const [pendingDeletePortal, setPendingDeletePortal] = useState<Portal | null>(null);
  const [accessPortal, setAccessPortal] = useState<Portal | null>(null);

  const portalColumns: SalkaroColumn<Portal>[] = [
    {
      key: "name",
      label: "Portal",
      render: (p) => <span className="font-medium">{p.name}</span>,
      searchValue: (p) => p.name,
    },
    {
      key: "board",
      label: "Board",
      render: (p) => p.import_config.boardName,
      searchValue: (p) => p.import_config.boardName,
    },
    {
      key: "fields",
      label: "Fields",
      render: (p) => p.import_config.selectedColumnIds.length,
    },
    {
      key: "status",
      label: "Status",
      render: (p) => (
        <div className="flex items-center gap-2">
          {p.status === "active" ? (
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-green-500" />
            </span>
          ) : (
            <span className="size-2 rounded-full bg-blue-500" />
          )}
          <Badge
            variant="outline"
            className={`capitalize ${p.status === "active" ? "border-green-500/40 bg-green-500/10 text-green-600" : "border-blue-500/40 bg-blue-500/10 text-blue-600"}`}
          >
            {p.status === "active" ? "Live" : "Draft"}
          </Badge>
        </div>
      ),
      searchValue: (p) => (p.status === "active" ? "live" : "draft"),
    },
    {
      key: "created",
      label: "Created",
      render: (p) => <span className="text-muted-foreground">{formatDateTime(p.created_at)}</span>,
    },
    {
      key: "actions",
      label: "",
      className: "w-12 text-right",
      render: (p) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Portal actions">
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setAccessPortal(p)}>
              <ShieldCheckIcon />
              Access
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEditingPortal(p)}>
              <PencilIcon />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setPendingDeletePortal(p)}>
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <SalkaroTable
        rows={portals}
        columns={portalColumns}
        rowKey={(p) => p.id}
        searchable
        searchPlaceholder="Search portals..."
        filterBy={["name", "board", "status"]}
        emptyMessage="No portals found."
      />

      <PortalEditDialog
        portal={editingPortal}
        organisationId={organisationId}
        onClose={() => setEditingPortal(null)}
        onSaved={onChanged}
      />

      <PortalDeleteDialog
        portal={pendingDeletePortal}
        organisationId={organisationId}
        onClose={() => setPendingDeletePortal(null)}
        onDeleted={onChanged}
      />

      <PortalAccessDialog
        key={`${accessPortal?.id ?? "none"}-${accessPortal ? "open" : "closed"}`}
        open={accessPortal !== null}
        organisationId={organisationId}
        portal={accessPortal}
        onClose={() => setAccessPortal(null)}
        onUpdated={onChanged}
      />
    </>
  );
}
