"use client";

import { useState } from "react";
import { CheckIcon, EllipsisVerticalIcon, PencilIcon, Trash2Icon, UsersIcon } from "lucide-react";
import { Button } from "@salkaro/ui";
import { Badge } from "@salkaro/ui";
import { Spinner } from "@salkaro/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@salkaro/ui";
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
import { SalkaroTable, type SalkaroColumn } from "@/components/ui/salkaro-table";
import { formatDateTime } from "@/utils/format-dates";
import type { OrganisationMember } from "@/services/supabase/employees";
import {
  approveOrganisationMember,
  removeOrganisationMember,
} from "@/services/supabase/employees";
import { UpdateMemberDialog } from "@/components/app/employees/dialogs/dialog-update-member";
import { toast } from "sonner";

type EmployeeTableProps = {
  members: OrganisationMember[];
  memberLimit: number;
  currentUserId: string | null;
  canManageMembers: boolean;
  onChanged: () => Promise<void>;
};

function getRoleVariant(role: OrganisationMember["role"]) {
  if (role === "owner") return "default" as const;
  if (role === "admin") return "secondary" as const;
  return "outline" as const;
}

export function EmployeeTable({
  members,
  memberLimit,
  currentUserId,
  canManageMembers,
  onChanged,
}: EmployeeTableProps) {
  const [editingMember, setEditingMember] = useState<OrganisationMember | null>(null);
  const [pendingRemovalMember, setPendingRemovalMember] = useState<OrganisationMember | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const hasLimit = Number.isFinite(memberLimit);

  async function handleRemoveMember(member: OrganisationMember) {
    setRemovingId(member.user_id);
    const result = await removeOrganisationMember({
      organisationId: member.organisation_id,
      userId: member.user_id,
    });

    if (result.error) {
      toast.error(result.error.message);
      setRemovingId(null);
      return;
    }

    toast.success("Member removed.");
    await onChanged();
    setRemovingId(null);
  }

  async function handleApproveMember(member: OrganisationMember) {
    setApprovingId(member.user_id);
    const result = await approveOrganisationMember({
      organisationId: member.organisation_id,
      userId: member.user_id,
    });

    if (result.error) {
      toast.error(result.error.message);
      setApprovingId(null);
      return;
    }

    toast.success(`${member.full_name || member.email || "Member"} approved.`);
    await onChanged();
    setApprovingId(null);
  }

  const columns: SalkaroColumn<OrganisationMember>[] = [
    {
      key: "member",
      label: "Member",
      render: (m) => {
        const displayName = m.user_id === currentUserId ? "You" : (m.full_name || m.email || "Member");
        const initials = (m.full_name || m.email || "?")
          .split(" ")
          .map((p) => p[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
        return (
          <div className="flex items-center gap-3">
            <div className="size-8 shrink-0 overflow-hidden rounded-full bg-muted">
              {m.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.avatar_url} alt={displayName} className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-[0.625rem] font-semibold text-muted-foreground">
                  {initials}
                </div>
              )}
            </div>
            <div className="font-medium">
              <div className="flex items-center gap-2">
                <p>{displayName}</p>
                {!m.approved && (
                  <Badge variant="outline" className="text-[0.625rem] border-amber-500/40 bg-amber-500/10 text-amber-600">
                    Pending approval
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">{m.email ?? ""}</p>
            </div>
          </div>
        );
      },
      searchValue: (m) => `${m.full_name ?? ""} ${m.email ?? ""} ${m.role}`,
    },
    {
      key: "role",
      label: "Role",
      render: (m) => (
        <Badge variant={getRoleVariant(m.role)} className="capitalize">
          {m.role}
        </Badge>
      ),
      searchValue: (m) => m.role,
    },
    {
      key: "joined",
      label: "Joined",
      render: (m) => formatDateTime(m.created_at),
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (m) => {
        const canManage = canManageMembers && m.user_id !== currentUserId && m.role !== "owner";
        if (!canManage) return <span className="text-xs text-muted-foreground">-</span>;

        // Pending member — show approve + deny inline
        if (!m.approved) {
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={approvingId === m.user_id}
                onClick={() => void handleApproveMember(m)}
              >
                {approvingId === m.user_id
                  ? <Spinner className="size-3.5" />
                  : <CheckIcon className="size-3.5" />}
                Approve
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={Boolean(removingId)}
                onClick={() => setPendingRemovalMember(m)}
              >
                <Trash2Icon className="size-3.5 text-destructive" />
              </Button>
            </div>
          );
        }

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <EllipsisVerticalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => setEditingMember(m)}>
                  <PencilIcon />
                  Update
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setPendingRemovalMember(m)}>
                  <Trash2Icon />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <SalkaroTable
        rows={members}
        columns={columns}
        rowKey={(m) => m.user_id}
        searchable
        searchPlaceholder="Search by name, email, or role..."
        filterBy={["member", "role"]}
        emptyMessage="No members found."
        headerRight={
          <Badge variant="outline" className="gap-1">
            <UsersIcon className="size-3" />
            {hasLimit ? `${members.length} / ${memberLimit}` : `${members.length} / Unlimited`}
          </Badge>
        }
      />

      {editingMember && (
        <UpdateMemberDialog
          open={Boolean(editingMember)}
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onUpdated={onChanged}
        />
      )}

      <AlertDialog
        open={Boolean(pendingRemovalMember)}
        onOpenChange={(open) => { if (!open) setPendingRemovalMember(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              This member will lose access to your organisation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(removingId)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={Boolean(removingId)}
              onClick={async (e) => {
                e.preventDefault();
                if (!pendingRemovalMember) return;
                await handleRemoveMember(pendingRemovalMember);
                setPendingRemovalMember(null);
              }}
            >
              {removingId ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
