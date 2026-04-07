"use client";

import { RefreshCw, DownloadIcon } from "lucide-react";
import { Button } from "@salkaro/ui";
import { SidebarTrigger } from "@salkaro/ui";
import { Separator } from "@salkaro/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@salkaro/ui";

type PortalTopbarProps = {
  activeSectionLabel: string;
  refreshing: boolean;
  exporting: boolean;
  canExport: boolean;
  onRefresh: () => void;
  onExport: () => void;
};

export function PortalTopbar({
  activeSectionLabel,
  refreshing,
  exporting,
  canExport,
  onRefresh,
  onExport,
}: PortalTopbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
      <SidebarTrigger className="-ml-1" size="icon" />
      <div className="flex items-center">
        <Separator orientation="vertical" className="h-3" />
      </div>
      <span className="text-sm font-medium leading-none">{activeSectionLabel}</span>
      <div className="ml-auto flex items-center gap-2">
        {canExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={exporting || refreshing}
          >
            <DownloadIcon className={`size-3.5 ${exporting ? "animate-pulse" : ""}`} />
            {exporting ? "Exporting..." : "Export PDF"}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
    </header>
  );
}
