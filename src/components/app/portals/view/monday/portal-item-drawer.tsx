"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";
import type { PortalItem, PortalSubitem } from "@/types/portal-view";

type PortalItemDrawerProps = {
  item: PortalItem | null;
  open: boolean;
  onClose: () => void;
};

const STATUS_DONE = ["done", "complete", "completed", "closed", "finished"];
const STATUS_IN_PROGRESS = ["in progress", "working on it", "in review"];

function isSubitemDone(status: string | null): boolean {
  return STATUS_DONE.includes(status?.toLowerCase().trim() ?? "");
}

function SubitemStatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <Badge variant="outline" className="text-[0.625rem] text-muted-foreground">
        No status
      </Badge>
    );
  }

  const lower = status.toLowerCase().trim();
  const colorClass = STATUS_DONE.includes(lower)
    ? "border-green-500/40 bg-green-500/10 text-green-600"
    : STATUS_IN_PROGRESS.includes(lower)
    ? "border-blue-500/40 bg-blue-500/10 text-blue-600"
    : lower === "stuck"
    ? "border-destructive/40 bg-destructive/10 text-destructive"
    : "border-border bg-muted/50 text-muted-foreground";

  return (
    <Badge variant="outline" className={`text-[0.625rem] ${colorClass}`}>
      {status}
    </Badge>
  );
}

function SubitemRow({ subitem }: { subitem: PortalSubitem }) {
  const done = isSubitemDone(subitem.status);
  return (
    <div className="flex items-center gap-3 rounded-md border px-3 py-2.5">
      {done ? (
        <CheckCircle2 className="size-3.5 shrink-0 text-green-500" />
      ) : (
        <Circle className="size-3.5 shrink-0 text-muted-foreground/50" />
      )}
      <span className={`flex-1 text-xs ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>
        {subitem.name}
      </span>
      <SubitemStatusBadge status={subitem.status} />
    </div>
  );
}

export function PortalItemDrawer({ item, open, onClose }: PortalItemDrawerProps) {
  const subitems = item?.subitems ?? [];
  const doneCount = subitems.filter((s) => isSubitemDone(s.status)).length;
  const total = subitems.length;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="text-sm font-semibold leading-snug pr-8">
            {item?.name ?? ""}
          </SheetTitle>
          {total > 0 && (
            <SheetDescription>
              {doneCount} of {total} subtask{total !== 1 ? "s" : ""} complete
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {total > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{percent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )}

          {total === 0 ? (
            <p className="text-xs text-muted-foreground">No subtasks for this item.</p>
          ) : (
            <div className="space-y-2">
              {subitems.map((sub) => (
                <SubitemRow key={sub.id} subitem={sub} />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
