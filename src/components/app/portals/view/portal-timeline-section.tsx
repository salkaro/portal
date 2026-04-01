"use client";

import { AlertTriangle, CheckCircle2, Circle, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PortalItem } from "@/types/portal-view";
import { getOverdueItems, getUpcomingItems } from "@/utils/portal-view";

type PortalTimelineSectionProps = {
  items: PortalItem[];
};

const STATUS_DONE_LABELS = ["done", "complete", "completed", "closed", "finished"];
const STATUS_IN_PROGRESS_LABELS = ["in progress", "working on it", "in review"];
const STATUS_BLOCKED_LABELS = ["stuck", "blocked", "on hold"];

function getMilestoneState(item: PortalItem): "done" | "in_progress" | "delayed" | "pending" {
  const statusText = item.columnValues.find((cv) => cv.type === "status")?.text?.trim().toLowerCase() ?? "";
  if (STATUS_DONE_LABELS.includes(statusText)) return "done";
  if (STATUS_BLOCKED_LABELS.includes(statusText)) return "delayed";
  if (STATUS_IN_PROGRESS_LABELS.includes(statusText)) return "in_progress";
  return "pending";
}

function formatDateDisplay(text: string): string {
  if (!text) return "";
  if (text.includes(" - ")) {
    const [, end] = text.split(" - ");
    const d = new Date(end);
    if (isNaN(d.getTime())) return text;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }
  const d = new Date(text);
  if (isNaN(d.getTime())) return text;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function getItemDateText(item: PortalItem): string {
  const dateCol = item.columnValues.find((cv) => cv.type === "date" || cv.type === "timeline");
  return dateCol?.text ? formatDateDisplay(dateCol.text) : "";
}

type MilestoneRowProps = {
  item: PortalItem;
  isOverdue: boolean;
};

function MilestoneRow({ item, isOverdue }: MilestoneRowProps) {
  const state = isOverdue ? "delayed" : getMilestoneState(item);
  const dateText = getItemDateText(item);

  const iconProps = {
    done: { Icon: CheckCircle2, className: "text-green-500" },
    in_progress: { Icon: Settings, className: "text-blue-500 animate-spin" },
    delayed: { Icon: AlertTriangle, className: "text-destructive" },
    pending: { Icon: Circle, className: "text-muted-foreground" },
  }[state];

  const labelColor = {
    done: "text-green-600",
    in_progress: "text-blue-600",
    delayed: "text-destructive",
    pending: "text-muted-foreground",
  }[state];

  const stateLabel = {
    done: "Done",
    in_progress: "In Progress",
    delayed: "Delayed",
    pending: "Not Started",
  }[state];

  return (
    <div className="flex items-start gap-3 py-2.5">
      <iconProps.Icon className={`mt-0.5 size-4 shrink-0 ${iconProps.className}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${state === "done" ? "text-muted-foreground line-through" : "text-foreground"}`}>
          {item.name}
        </p>
        {dateText && (
          <p className="mt-0.5 text-xs text-muted-foreground">Due {dateText}</p>
        )}
      </div>
      <span className={`shrink-0 text-xs font-medium ${labelColor}`}>{stateLabel}</span>
    </div>
  );
}

export function PortalTimelineSection({ items }: PortalTimelineSectionProps) {
  const overdueItems = getOverdueItems(items);
  const overdueIds = new Set(overdueItems.map((i) => i.id));
  const upcomingItems = getUpcomingItems(items);

  const milestones = [
    ...overdueItems,
    ...upcomingItems.filter((i) => !overdueIds.has(i.id)),
  ];

  if (milestones.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No upcoming milestones.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Milestones</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="divide-y divide-border">
          {milestones.map((item) => (
            <MilestoneRow key={item.id} item={item} isOverdue={overdueIds.has(item.id)} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
