"use client";

import { useState } from "react";
import { ListTodo } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SalkaroTable,
  type SalkaroColumn,
} from "@/components/ui/salkaro-table";
import type { PortalColumn, PortalItem } from "@/types/portal-view";
import { getCompletionStats } from "@/utils/portal-view";
import { PortalItemDrawer } from "@/components/app/portals/view/shared/portal-item-drawer";

type PortalItemsTableProps = {
  columns: PortalColumn[];
  items: PortalItem[];
  primaryColor?: string;
};

const STATUS_DONE = ["done", "complete", "completed", "closed", "finished"];

function isSubitemDone(status: string | null): boolean {
  return STATUS_DONE.includes(status?.toLowerCase().trim() ?? "");
}

function formatDate(text: string): string {
  if (!text) return "—";
  const dateStr = text.includes(" - ") ? text.split(" - ")[1] : text;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return text;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ label }: { label: string }) {
  if (!label) return <span className="text-xs text-muted-foreground">—</span>;

  const lower = label.toLowerCase().trim();
  const colorClass =
    lower === "done" || lower === "complete" || lower === "completed"
      ? "border-green-500/40 bg-green-500/10 text-green-600"
      : lower === "in progress" || lower === "working on it"
        ? "border-blue-500/40 bg-blue-500/10 text-blue-600"
        : lower === "stuck" || lower === "blocked"
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-border bg-muted/50 text-muted-foreground";

  return (
    <Badge variant="outline" className={`text-[0.625rem] ${colorClass}`}>
      {label}
    </Badge>
  );
}

function SubitemProgress({ item }: { item: PortalItem }) {
  const { subitems } = item;
  if (subitems.length === 0) return null;

  const done = subitems.filter((s) => isSubitemDone(s.status)).length;
  const percent = Math.round((done / subitems.length) * 100);

  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-green-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="shrink-0 text-[0.625rem] tabular-nums text-muted-foreground">
        {done}/{subitems.length}
      </span>
    </div>
  );
}

type GroupTableProps = {
  groupTitle: string;
  items: PortalItem[];
  columns: PortalColumn[];
  onSelectItem: (item: PortalItem) => void;
  showTitle?: boolean;
};

function GroupTable({
  groupTitle,
  items,
  columns,
  onSelectItem,
  showTitle = true,
}: GroupTableProps) {
  const statusCol = columns.find((c) => c.type === "status");
  const dateCol = columns.find(
    (c) => c.type === "date" || c.type === "timeline",
  );
  const ownerCol = columns.find((c) => c.type === "people");
  const labelsCol = columns.find((c) => c.type === "labels");

  const tableColumns: SalkaroColumn<PortalItem>[] = [
    {
      key: "name",
      label: "Task",
      className: "min-w-[200px]",
      render: (item) => (
        <div className="font-medium text-xs">
          <span className="block max-w-sm truncate" title={item.name}>
            {item.name}
          </span>
          <SubitemProgress item={item} />
        </div>
      ),
      searchValue: (item) => item.name,
    },
    ...(statusCol
      ? [
          {
            key: statusCol.id,
            label: "Status",
            className: "w-36",
            render: (item: PortalItem) => {
              const cv = item.columnValues.find(
                (v) => v.columnId === statusCol.id,
              );
              return <StatusBadge label={cv?.text ?? ""} />;
            },
            searchValue: (item: PortalItem) => {
              const cv = item.columnValues.find(
                (v) => v.columnId === statusCol.id,
              );
              return cv?.text ?? "";
            },
          },
        ]
      : []),
    ...(dateCol
      ? [
          {
            key: dateCol.id,
            label: "Due",
            className: "w-36",
            render: (item: PortalItem) => {
              const cv = item.columnValues.find(
                (v) => v.columnId === dateCol.id,
              );
              return (
                <span className="text-xs text-muted-foreground">
                  {cv?.text ? formatDate(cv.text) : "—"}
                </span>
              );
            },
            searchValue: (item: PortalItem) => {
              const cv = item.columnValues.find(
                (v) => v.columnId === dateCol.id,
              );
              return cv?.text ?? "";
            },
          },
        ]
      : []),
    ...(ownerCol
      ? [
          {
            key: ownerCol.id,
            label: "Owner",
            className: "w-40",
            render: (item: PortalItem) => {
              const cv = item.columnValues.find(
                (v) => v.columnId === ownerCol.id,
              );
              if (!cv?.text)
                return <span className="text-xs text-muted-foreground">—</span>;
              const names = cv.text
                .split(",")
                .map((n) => n.trim())
                .filter(Boolean);
              return (
                <div className="flex flex-wrap gap-1">
                  {names.map((name) => (
                    <Badge
                      key={name}
                      variant="outline"
                      className="text-[0.625rem]"
                    >
                      {name}
                    </Badge>
                  ))}
                </div>
              );
            },
            searchValue: (item: PortalItem) => {
              const cv = item.columnValues.find(
                (v) => v.columnId === ownerCol.id,
              );
              return cv?.text ?? "";
            },
          },
        ]
      : []),
    ...(labelsCol
      ? [
          {
            key: labelsCol.id,
            label: "Labels",
            className: "w-40",
            render: (item: PortalItem) => {
              const cv = item.columnValues.find(
                (v) => v.columnId === labelsCol.id,
              );
              if (!cv?.text)
                return <span className="text-xs text-muted-foreground">—</span>;
              const labels = cv.text
                .split(",")
                .map((l) => l.trim())
                .filter(Boolean);
              return (
                <div className="flex flex-wrap gap-1">
                  {labels.map((label) => (
                    <Badge
                      key={label}
                      variant="outline"
                      className="text-[0.625rem]"
                    >
                      {label}
                    </Badge>
                  ))}
                </div>
              );
            },
            searchValue: (item: PortalItem) => {
              const cv = item.columnValues.find(
                (v) => v.columnId === labelsCol.id,
              );
              return cv?.text ?? "";
            },
          },
        ]
      : []),
  ];

  return (
    <SalkaroTable
      rows={items}
      columns={tableColumns}
      rowKey={(item) => item.id}
      title={showTitle ? groupTitle : undefined}
      collapsable
      searchable
      searchPlaceholder="Search tasks..."
      pageSize={10}
      onRowClick={(item) => {
        const hasText = item.columnValues.some(
          (cv) =>
            (cv.type === "text" || cv.type === "long_text") && cv.text?.trim(),
        );
        if (item.subitems.length > 0 || hasText) onSelectItem(item);
      }}
      rowClassName={(item) => {
        const hasText = item.columnValues.some(
          (cv) =>
            (cv.type === "text" || cv.type === "long_text") && cv.text?.trim(),
        );
        return item.subitems.length === 0 && !hasText
          ? "cursor-default"
          : undefined;
      }}
      emptyMessage="No tasks in this group."
    />
  );
}

export function PortalItemsTable({ columns, items, primaryColor = "#0d9488" }: PortalItemsTableProps) {
  const [selectedItem, setSelectedItem] = useState<PortalItem | null>(null);

  const groupOrder: string[] = [];
  const groupMap = new Map<string, { title: string; items: PortalItem[] }>();
  for (const item of items) {
    if (!groupMap.has(item.groupId)) {
      groupOrder.push(item.groupId);
      groupMap.set(item.groupId, { title: item.groupTitle, items: [] });
    }
    groupMap.get(item.groupId)!.items.push(item);
  }

  const firstGroupId = groupOrder[0] ?? "";
  const [activeGroupId, setActiveGroupId] = useState(firstGroupId);
  const activeGroup = groupMap.get(activeGroupId);
  const { total } = activeGroup
    ? getCompletionStats(activeGroup.items)
    : { total: 0 };

  return (
    <>
      {groupOrder.length <= 1 ? (
        <div>
          {groupOrder.map((groupId) => {
            const group = groupMap.get(groupId)!;
            return (
              <GroupTable
                key={groupId}
                groupTitle={group.title}
                items={group.items}
                columns={columns}
                onSelectItem={setSelectedItem}
              />
            );
          })}
        </div>
      ) : (
        <Tabs value={activeGroupId} onValueChange={setActiveGroupId}>
          <div className="flex items-center justify-between gap-4">
            <TabsList>
              {groupOrder.map((groupId) => {
                const group = groupMap.get(groupId)!;
                return (
                  <TabsTrigger key={groupId} value={groupId}>
                    {group.title}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 shadow-sm">
              <div
                className="flex size-8 items-center justify-center rounded-lg"
                style={{ background: `color-mix(in srgb, ${primaryColor} 15%, transparent)` }}
              >
                <ListTodo
                  className="size-4"
                  style={{ color: primaryColor }}
                />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Total tasks</p>
                <p className="text-sm font-semibold tabular-nums">{total}</p>
              </div>
            </div>
          </div>
          {groupOrder.map((groupId) => {
            const group = groupMap.get(groupId)!;
            return (
              <TabsContent key={groupId} value={groupId} className="mt-2">
                <GroupTable
                  groupTitle={group.title}
                  items={group.items}
                  columns={columns}
                  onSelectItem={setSelectedItem}
                  showTitle={false}
                />
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      <PortalItemDrawer
        item={selectedItem}
        open={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
}
