"use client";

import { useMemo, useState } from "react";
import { CopyIcon, CheckIcon } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOrganisationInvite } from "@/services/supabase/employees";

type AddMemberDialogProps = {
  open: boolean;
  organisationId: string;
  onClose: () => void;
  onCreated: () => Promise<void>;
};

export function AddMemberDialog({
  open,
  organisationId,
  onClose,
  onCreated,
}: AddMemberDialogProps) {
  const [role, setRole] = useState<"admin" | "member">("member");
  const [uses, setUses] = useState("1");
  const [email, setEmail] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitDisabled = useMemo(() => {
    const value = Number(uses);
    return !Number.isFinite(value) || value < 1;
  }, [uses]);

  async function handleCreateInvite() {
    setIsSubmitting(true);
    const result = await createOrganisationInvite({
      organisationId,
      role,
      usesLeft: Number(uses),
      email: email.trim() || null,
    });

    if (result.error || !result.data) {
      toast.error(result.error?.message ?? "Unable to create invite.");
      setIsSubmitting(false);
      return;
    }

    setCreatedCode(result.data.code);
    await onCreated();
    toast.success("Invite created.");
    setIsSubmitting(false);
  }

  async function handleCopyCode() {
    if (!createdCode) return;

    await navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleDialogClose() {
    setRole("member");
    setUses("1");
    setEmail("");
    setCreatedCode(null);
    setCopied(false);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && handleDialogClose()}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Invite new member</DialogTitle>
          <DialogDescription>
            Create an invite code and share it with the teammate.
          </DialogDescription>
        </DialogHeader>

        {createdCode ? (
          <div className="space-y-2">
            <Label>Invite code</Label>
            <div className="flex items-center gap-2">
              <Input value={createdCode} readOnly />
              <Button variant="outline" size="icon-sm" onClick={handleCopyCode}>
                {copied ? <CheckIcon /> : <CopyIcon />}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <select
                id="invite-role"
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as "admin" | "member")
                }
                className="h-7 w-full rounded-md border border-input bg-input/20 px-2 text-xs"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-uses">Uses</Label>
              <Input
                id="invite-uses"
                type="number"
                min={1}
                value={uses}
                onChange={(event) => setUses(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-email">Email (optional)</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="member@company.com"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleDialogClose}
            disabled={isSubmitting}
          >
            {createdCode ? "Close" : "Cancel"}
          </Button>
          {!createdCode && (
            <Button
              onClick={handleCreateInvite}
              disabled={isSubmitting || submitDisabled}
            >
              {isSubmitting ? "Creating..." : "Generate invite"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
