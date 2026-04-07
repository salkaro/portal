import { AppWindowIcon, LinkIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@salkaro/ui";
import { Tooltip, TooltipContent, TooltipTrigger } from "@salkaro/ui";

type PortalsEmptyStateProps = {
  hasConnections: boolean;
  onCreatePortal: () => void;
  atLimit?: boolean;
  limitLabel?: string;
};

export function PortalsEmptyState({
  hasConnections,
  onCreatePortal,
  atLimit = false,
  limitLabel,
}: PortalsEmptyStateProps) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-border p-6 text-center">
      <div className="mb-2 flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <AppWindowIcon className="size-4" />
      </div>

      <p className="text-sm font-medium text-foreground">
        No portals created yet
      </p>
      <p className="mt-1 max-w-lg text-sm text-muted-foreground">
        Create your first client portal and map your project data into a
        branded, shareable experience.
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {atLimit ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <Button disabled>Create portal</Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{limitLabel} Upgrade to create more.</TooltipContent>
          </Tooltip>
        ) : (
          <Button onClick={onCreatePortal}>Create portal</Button>
        )}
        {!hasConnections ? (
          <Button variant="outline" asChild>
            <Link href="/integrations/browse">
              <LinkIcon className="size-4" />
              Connect an integration first
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
