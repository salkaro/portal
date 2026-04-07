"use client";

import { CheckIcon, CopyIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@salkaro/ui";
import { Badge } from "@salkaro/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@salkaro/ui";
import { SalkaroTable, type SalkaroColumn } from "@/components/ui/salkaro-table";
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

  const columns: SalkaroColumn<OrganisationInvite>[] = [
    {
      key: "code",
      label: "Code",
      render: (i) => <span className="font-mono">{i.code}</span>,
      searchValue: (i) => i.code,
    },
    {
      key: "email",
      label: "Email",
      render: (i) => i.email || <span className="text-muted-foreground">—</span>,
      searchValue: (i) => i.email ?? "",
    },
    {
      key: "role",
      label: "Role",
      render: (i) => <Badge variant="outline" className="capitalize">{i.role}</Badge>,
      searchValue: (i) => i.role,
    },
    {
      key: "uses_left",
      label: "Uses left",
      render: (i) => i.uses_left,
    },
    {
      key: "created",
      label: "Created",
      render: (i) => <span className="text-muted-foreground">{formatDateTime(i.created_at)}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (i) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon-sm" onClick={() => void handleCopy(i.code)}>
            {copiedCode === i.code ? <CheckIcon /> : <CopyIcon />}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={deletingId === i.id}
            onClick={() => void handleDelete(i.id)}
          >
            <Trash2Icon className="text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Active invite codes</DialogTitle>
          <DialogDescription>
            Share active codes with teammates to let them join your organisation.
          </DialogDescription>
        </DialogHeader>

        <SalkaroTable
          rows={invites}
          columns={columns}
          rowKey={(i) => i.id}
          searchable
          pageSize={5}
          searchPlaceholder="Search codes..."
          filterBy={["code", "email", "role"]}
          emptyMessage="No active invite codes."
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
