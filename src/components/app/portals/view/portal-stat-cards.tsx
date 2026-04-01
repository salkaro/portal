"use client";

import { CheckCircle2, Clock, Loader2, ListTodo } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { PortalItem } from "@/types/portal-view";
import { getCompletionStats, getOverdueItems } from "@/utils/portal-view";

type PortalStatCardsProps = {
  items: PortalItem[];
};

export function PortalStatCards({ items }: PortalStatCardsProps) {
  const { total, done, inProgress, donePercent } = getCompletionStats(items);
  const overdue = getOverdueItems(items).length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {/* Tasks */}
      <Card className="shadow-sm">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tasks</p>
            <ListTodo className="size-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Total tasks</p>
        </CardContent>
      </Card>

      {/* Completion */}
      <Card className="shadow-sm">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Completion</p>
            <CheckCircle2 className="size-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold">{donePercent}%</p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${donePercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {done} of {total} task{total !== 1 ? "s" : ""} complete
          </p>
        </CardContent>
      </Card>

      {/* Active */}
      <Card className="shadow-sm">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active</p>
            <Loader2 className="size-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold">{inProgress}</p>
          <p className="text-xs text-muted-foreground">Currently in progress</p>
        </CardContent>
      </Card>

      {/* Needs Attention */}
      <Card className={`shadow-sm ${overdue > 0 ? "border-destructive/30" : ""}`}>
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Needs Attention</p>
            <Clock className={`size-4 ${overdue > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          </div>
          <p className={`text-2xl font-bold ${overdue > 0 ? "text-destructive" : ""}`}>{overdue}</p>
          <p className="text-xs text-muted-foreground">
            {overdue > 0 ? `${overdue} overdue item${overdue !== 1 ? "s" : ""}` : "All on track"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
