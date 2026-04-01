"use client";

import { useMemo, useState } from "react";
import { CopyIcon, CheckIcon } from "lucide-react";
import { limitInput } from "@/utils/string";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createOrganisationInvite } from "@/services/supabase/employees";

type AddMemberDialogProps = {
  open: boolean;
  organisationId: string;
  inviteLimit: number;
  onClose: () => void;
  onCreated: () => Promise<void>;
};

export function AddMemberDialog({
  open,
  organisationId,
  inviteLimit,
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
    return !Number.isFinite(value) || value < 1 || value > 5;
  }, [uses]);

  async function handleCreateInvite() {
    setIsSubmitting(true);
    const result = await createOrganisationInvite({
      organisationId,
      role,
      usesLeft: Number(uses),
      email: email.trim() || null,
      inviteLimit,
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
              <Select
                value={role}
                onValueChange={(value) => setRole(value as "admin" | "member")}
              >
                <SelectTrigger id="invite-role" className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-uses">Uses</Label>
              <Input
                id="invite-uses"
                type="number"
                min={1}
                max={5}
                value={uses}
                onChange={(event) => {
                  const next = event.target.value;
                  if (next === "") {
                    setUses("");
                    return;
                  }

                  const numeric = Number(next);
                  if (!Number.isFinite(numeric)) return;
                  setUses(
                    String(Math.min(5, Math.max(1, Math.floor(numeric)))),
                  );
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-email">Email (optional)</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(limitInput(event.target.value, 254))
                }
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
