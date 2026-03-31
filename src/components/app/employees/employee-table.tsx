"use client";

import { useMemo, useState } from "react";
import { EllipsisVerticalIcon, PencilIcon, Trash2Icon, UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/utils/format-dates";
import type { OrganisationMember } from "@/services/supabase/employees";
import { removeOrganisationMember } from "@/services/supabase/employees";
import { UpdateMemberDialog } from "@/components/app/employees/dialogs/dialog-update-member";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

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
  const [query, setQuery] = useState("");
  const [editingMember, setEditingMember] = useState<OrganisationMember | null>(
    null,
  );
  const [pendingRemovalMember, setPendingRemovalMember] =
    useState<OrganisationMember | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const hasLimit = Number.isFinite(memberLimit);

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;

    return members.filter((member) => {
      const fullName = (member.full_name ?? "").toLowerCase();
      const email = (member.email ?? "").toLowerCase();
      const role = member.role.toLowerCase();
      return fullName.includes(q) || email.includes(q) || role.includes(q);
    });
  }, [members, query]);

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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, email, or role..."
          className="max-w-sm"
        />

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <UsersIcon className="size-3" />
            {hasLimit
              ? `${members.length} / ${memberLimit}`
              : `${members.length} / Unlimited`}
          </Badge>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredMembers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground">
                No members found.
              </TableCell>
            </TableRow>
          ) : (
            filteredMembers.map((member) => {
              const canEditMember =
                canManageMembers &&
                member.user_id !== currentUserId &&
                member.role !== "owner";

              return (
                <TableRow key={member.user_id}>
                  <TableCell className="font-medium">
                    {member.user_id === currentUserId ? (
                      <div>
                        <p>You</p>
                        <p className="text-[11px] text-muted-foreground">
                          {member.email ?? ""}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p>{member.full_name || member.email || "Member"}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {member.email ?? ""}
                        </p>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getRoleVariant(member.role)}
                      className="capitalize"
                    >
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDateTime(member.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {canEditMember ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <EllipsisVerticalIcon />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem
                              onClick={() => setEditingMember(member)}
                            >
                              <PencilIcon />
                              Update
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setPendingRemovalMember(member)}
                            >
                              <Trash2Icon />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

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
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setPendingRemovalMember(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              This member will lose access to your organisation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(removingId)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={Boolean(removingId)}
              onClick={async (event) => {
                event.preventDefault();
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
    </div>
  );
}
