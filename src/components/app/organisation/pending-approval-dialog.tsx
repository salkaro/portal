"use client";

import { ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrganisation } from "@/hooks/use-organisation";
import { handleSignOut } from "@/lib/sign-out";

export function PendingApprovalDialog() {
  const { pendingApproval, organisation, loading } = useOrganisation();

  if (loading || !pendingApproval) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ClockIcon className="size-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">
              Waiting for approval
            </h2>
            <p className="text-sm text-muted-foreground">
              Your request to join{" "}
              <span className="font-medium text-foreground">
                {organisation?.name ?? "this organisation"}
              </span>{" "}
              is pending. An admin or owner needs to approve your membership before you can access the app.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => void handleSignOut()}
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
