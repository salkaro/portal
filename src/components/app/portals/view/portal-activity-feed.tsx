"use client";

import { CheckCircle2, PlusCircle, Settings, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PortalItem } from "@/types/portal-view";

type PortalActivityFeedProps = {
  items: PortalItem[];
};

type ActivityEvent = {
  id: string;
  type: "completed" | "in_progress" | "added" | "overdue";
  label: string;
  itemName: string;
  dateText: string;
  sortDate: Date;
};

const STATUS_DONE_LABELS = ["done", "complete", "completed", "closed", "finished"];
const STATUS_IN_PROGRESS_LABELS = ["in progress", "working on it", "in review"];

function isStatusDone(label: string): boolean {
  return STATUS_DONE_LABELS.includes(label.toLowerCase().trim());
}

function isStatusInProgress(label: string): boolean {
  return STATUS_IN_PROGRESS_LABELS.includes(label.toLowerCase().trim());
}

function getItemDate(item: PortalItem): Date | null {
  const dateCol = item.columnValues.find((cv) => cv.type === "date" || cv.type === "timeline");
  if (!dateCol?.text) return null;
  const dateStr = dateCol.text.includes(" - ")
    ? dateCol.text.split(" - ")[0]
    : dateCol.text;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function formatEventDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function deriveEvents(items: PortalItem[]): ActivityEvent[] {
  const now = new Date();
  const events: ActivityEvent[] = [];

  for (const item of items) {
    const statusText = item.columnValues.find((cv) => cv.type === "status")?.text?.trim() ?? "";
    const date = getItemDate(item);
    const sortDate = date ?? now;

    if (isStatusDone(statusText)) {
      events.push({
        id: `done-${item.id}`,
        type: "completed",
        label: "Completed",
        itemName: item.name,
        dateText: date ? formatEventDate(date) : "Recently",
        sortDate,
      });
    } else if (isStatusInProgress(statusText)) {
      events.push({
        id: `progress-${item.id}`,
        type: "in_progress",
        label: "In Progress",
        itemName: item.name,
        dateText: date ? formatEventDate(date) : "Active",
        sortDate,
      });
    } else if (date && date < now) {
      events.push({
        id: `overdue-${item.id}`,
        type: "overdue",
        label: "Needs Attention",
        itemName: item.name,
        dateText: formatEventDate(date),
        sortDate,
      });
    } else {
      events.push({
        id: `added-${item.id}`,
        type: "added",
        label: "Scheduled",
        itemName: item.name,
        dateText: date ? formatEventDate(date) : "Planned",
        sortDate,
      });
    }
  }

  // Sort: completed first (by date desc), then in-progress, then rest
  const typeOrder: Record<ActivityEvent["type"], number> = {
    completed: 0,
    in_progress: 1,
    overdue: 2,
    added: 3,
  };

  return events
    .sort((a, b) => typeOrder[a.type] - typeOrder[b.type] || b.sortDate.getTime() - a.sortDate.getTime())
    .slice(0, 10);
}

const eventConfig: Record<
  ActivityEvent["type"],
  { Icon: React.ElementType; iconClass: string; labelClass: string }
> = {
  completed: { Icon: CheckCircle2, iconClass: "text-green-500", labelClass: "text-green-600" },
  in_progress: { Icon: Settings, iconClass: "text-blue-500", labelClass: "text-blue-600" },
  overdue: { Icon: Clock, iconClass: "text-destructive", labelClass: "text-destructive" },
  added: { Icon: PlusCircle, iconClass: "text-muted-foreground", labelClass: "text-muted-foreground" },
};

export function PortalActivityFeed({ items }: PortalActivityFeedProps) {
  const events = deriveEvents(items);

  if (events.length === 0) return null;

  // Group by dateText for the feed layout
  const grouped: { date: string; events: ActivityEvent[] }[] = [];
  for (const event of events) {
    const last = grouped[grouped.length - 1];
    if (last && last.date === event.dateText) {
      last.events.push(event);
    } else {
      grouped.push({ date: event.dateText, events: [event] });
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Recent Updates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {grouped.map((group) => (
          <div key={group.date}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.date}
            </p>
            <div className="space-y-2">
              {group.events.map((event) => {
                const { Icon, iconClass, labelClass } = eventConfig[event.type];
                return (
                  <div key={event.id} className="flex items-start gap-2.5">
                    <Icon className={`mt-0.5 size-4 shrink-0 ${iconClass}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug">
                        <span className={`font-medium ${labelClass}`}>{event.label}:</span>{" "}
                        <span className="text-foreground">{event.itemName}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
