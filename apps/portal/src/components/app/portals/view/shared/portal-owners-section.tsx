"use client";

import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@salkaro/ui";
import type { PortalItem } from "@/types/portal-view";
import { getOwnerCounts } from "@/utils/portal-view";

type PortalOwnersSectionProps = {
  items: PortalItem[];
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function PortalOwnersSection({ items }: PortalOwnersSectionProps) {
  const owners = getOwnerCounts(items);

  if (owners.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Owners</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No owner data available.</p>
        </CardContent>
      </Card>
    );
  }

  const max = owners[0].count;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Users className="size-4" />
          Owners
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {owners.map((owner) => (
          <div key={owner.name} className="flex items-center gap-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[0.625rem] font-semibold text-primary">
              {getInitials(owner.name)}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{owner.name}</span>
                <span className="text-muted-foreground">{owner.count} item{owner.count !== 1 ? "s" : ""}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/60 transition-all"
                  style={{ width: `${(owner.count / max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
