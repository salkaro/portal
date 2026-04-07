"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PortalItem } from "@/types/portal-view";
import { getStatusCounts } from "@/utils/portal-view";

type PortalStatusBreakdownProps = {
  items: PortalItem[];
};

export function PortalStatusBreakdown({ items }: PortalStatusBreakdownProps) {
  const statusCounts = getStatusCounts(items);
  const total = items.length;

  if (statusCounts.length === 0) return null;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Status Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
          {statusCounts.map((s) => (
            <div
              key={s.label}
              className={`${s.color} transition-all`}
              style={{ width: `${(s.count / total) * 100}%` }}
              title={`${s.label}: ${s.count}`}
            />
          ))}
        </div>

        <div className="space-y-2 pt-1">
          {statusCounts.map((s) => {
            const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
            return (
              <div key={s.label} className="flex items-center gap-3">
                <span className={`inline-block size-2.5 shrink-0 rounded-full ${s.color}`} />
                <span className="flex-1 text-sm text-foreground">{s.label}</span>
                <div className="flex items-center gap-2">
                  <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-muted sm:block">
                    <div
                      className={`h-full rounded-full ${s.color} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{pct}%</span>
                  <span className="w-6 text-right text-xs font-medium tabular-nums">{s.count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
