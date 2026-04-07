"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@salkaro/ui";
import { SalkaroTable, type SalkaroColumn } from "@/components/ui/salkaro-table";
import { formatDateTime } from "@/utils/format-dates";
import type { Portal } from "@/types/portal";

type PortalsListProps = {
  portals: Portal[];
};

export function PortalsList({ portals }: PortalsListProps) {
  const router = useRouter();

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
  ];

  return (
    <SalkaroTable
      rows={portals}
      columns={portalColumns}
      rowKey={(p) => p.id}
      searchable
      searchPlaceholder="Search portals..."
      filterBy={["name", "board", "status"]}
      emptyMessage="No portals found."
      onRowClick={(p) => router.push(`/portals/${p.id}`)}
    />
  );
}
