"use client";

import { CheckIcon, CopyIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/utils/format-dates";
import type { OrganisationInvite } from "@/services/supabase/employees";
import { deleteOrganisationInvite } from "@/services/supabase/employees";

type ActiveInviteCodesDialogProps = {
  open: boolean;
  organisationId: string;
  invites: OrganisationInvite[];
  onClose: () => void;
  onChanged: () => Promise<void>;
};

export function ActiveInviteCodesDialog({
  open,
  organisationId,
  invites,
  onClose,
  onChanged,
}: ActiveInviteCodesDialogProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCopy(code: string) {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Invite code copied.");
    setTimeout(() => setCopiedCode(null), 1500);
  }

  async function handleDelete(inviteId: string) {
    setDeletingId(inviteId);
    const result = await deleteOrganisationInvite({ organisationId, inviteId });

    if (result.error) {
      toast.error(result.error.message);
      setDeletingId(null);
      return;
    }

    await onChanged();
    toast.success("Invite removed.");
    setDeletingId(null);
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Active invite codes</DialogTitle>
          <DialogDescription>
            Share active codes with teammates to let them join your
            organisation.
          </DialogDescription>
        </DialogHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Uses left</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  No active invite codes.
                </TableCell>
              </TableRow>
            ) : (
              invites.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell className="font-mono">{invite.code}</TableCell>
                  <TableCell>{invite.email || "-"}</TableCell>
                  <TableCell className="capitalize">{invite.role}</TableCell>
                  <TableCell>{invite.uses_left}</TableCell>
                  <TableCell>{formatDateTime(invite.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleCopy(invite.code)}
                      >
                        {copiedCode === invite.code ? (
                          <CheckIcon />
                        ) : (
                          <CopyIcon />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={deletingId === invite.id}
                        onClick={() => handleDelete(invite.id)}
                      >
                        <Trash2Icon className="text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
