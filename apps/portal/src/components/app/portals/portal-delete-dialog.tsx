"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@salkaro/ui";
import { deletePortal } from "@/services/supabase/portals";
import type { Portal } from "@/types/portal";

type PortalDeleteDialogProps = {
  portal: Portal | null;
  organisationId: string;
  onClose: () => void;
  onDeleted: () => Promise<void>;
};

export function PortalDeleteDialog({
  portal,
  organisationId,
  onClose,
  onDeleted,
}: PortalDeleteDialogProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete() {
    if (!portal) return;

    setDeletingId(portal.id);

    const result = await deletePortal({ organisationId, portalId: portal.id });

    if (result.error) {
      toast.error(result.error.message);
      setDeletingId(null);
      return;
    }

    toast.success("Portal deleted.");
    setDeletingId(null);
    onClose();
    await onDeleted();
  }

  return (
    <AlertDialog
      open={portal !== null}
      onOpenChange={(open) => {
        if (!open && deletingId === null) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete portal?</AlertDialogTitle>
          <AlertDialogDescription>
            {portal
              ? `This will permanently remove ${portal.name}.`
              : "This will permanently remove this portal."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deletingId !== null}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={portal === null || deletingId !== null}
            onClick={(e) => {
              e.preventDefault();
              void handleDelete();
            }}
          >
            {deletingId !== null ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
