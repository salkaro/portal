"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@salkaro/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@salkaro/ui";
import { Label } from "@salkaro/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@salkaro/ui";
import type { OrganisationMember } from "@/services/supabase/employees";
import { updateOrganisationMemberRole } from "@/services/supabase/employees";

type UpdateMemberDialogProps = {
  open: boolean;
  member: OrganisationMember;
  onClose: () => void;
  onUpdated: () => Promise<void>;
};

export function UpdateMemberDialog({
  open,
  member,
  onClose,
  onUpdated,
}: UpdateMemberDialogProps) {
  const [role, setRole] = useState<"admin" | "member">(
    member.role === "admin" ? "admin" : "member",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);

    const result = await updateOrganisationMemberRole({
      organisationId: member.organisation_id,
      userId: member.user_id,
      role,
    });

    if (result.error) {
      toast.error(result.error.message);
      setIsSubmitting(false);
      return;
    }

    toast.success("Member updated.");
    await onUpdated();
    setIsSubmitting(false);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Update member</DialogTitle>
          <DialogDescription>
            Change role access for this organisation member.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="member-role">Role</Label>
          <Select
            value={role}
            onValueChange={(value) => setRole(value as "admin" | "member")}
          >
            <SelectTrigger id="member-role" className="w-full">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
