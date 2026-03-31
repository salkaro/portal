import { AppWindowIcon, LinkIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type PortalsEmptyStateProps = {
  hasMondayConnections: boolean;
  onCreatePortal: () => void;
};

export function PortalsEmptyState({
  hasMondayConnections,
  onCreatePortal,
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
        Create your first client portal and map monday board data into a
        branded, shareable experience.
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <Button onClick={onCreatePortal}>Create portal</Button>
        {!hasMondayConnections ? (
          <Button variant="outline" asChild>
            <Link href="/integrations/browse">
              <LinkIcon className="size-4" />
              Connect monday first
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
