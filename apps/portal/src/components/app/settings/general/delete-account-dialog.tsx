"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@salkaro/ui";
import { Input } from "@salkaro/ui";
import { Label } from "@salkaro/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@salkaro/ui";
import { ROUTES } from "@/constants/routes";

const CONFIRM_PHRASE = "delete my account";

interface DeleteAccountDialogProps {
  open: boolean;
  isOwner: boolean;
  onClose: () => void;
}

export function DeleteAccountDialog({
  open,
  isOwner,
  onClose,
}: DeleteAccountDialogProps) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const isConfirmed = confirmText.toLowerCase() === CONFIRM_PHRASE;

  function handleOpenChange(next: boolean) {
    if (!next && !isDeleting) {
      setConfirmText("");
      onClose();
    }
  }

  async function handleDelete() {
    if (!isConfirmed || isDeleting) return;

    setIsDeleting(true);

    const response = await fetch("/api/account/delete", { method: "DELETE" });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      toast.error(body.message ?? "Failed to delete account. Please try again.");
      setIsDeleting(false);
      return;
    }

    router.push(ROUTES.HOME);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Delete account</DialogTitle>
          <DialogDescription>
            This action is permanent and cannot be undone. Only your payment
            history will be retained.
          </DialogDescription>
        </DialogHeader>

        {isOwner && (
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
            You are the <span className="font-medium text-foreground">owner</span> of your organisation. Deleting your account will also permanently delete your organisation and all its portals and data.
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="confirm-delete">
            Type{" "}
            <span className="font-medium text-foreground select-none">
              {CONFIRM_PHRASE}
            </span>{" "}
            to confirm
          </Label>
          <Input
            id="confirm-delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRM_PHRASE}
            disabled={isDeleting}
            autoComplete="off"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
