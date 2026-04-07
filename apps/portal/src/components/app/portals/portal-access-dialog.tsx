"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
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
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@salkaro/ui";
import { Label } from "@salkaro/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@salkaro/ui";
import { Textarea } from "@salkaro/ui";
import { updatePortalAccess } from "@/services/supabase/portals";
import type { Portal } from "@/types/portal";

type PortalAccessDialogProps = {
  open: boolean;
  organisationId: string;
  portal: Portal | null;
  onClose: () => void;
  onUpdated: () => Promise<void>;
};

function generateAccessCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";

  for (let index = 0; index < 8; index += 1) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return result;
}

export function PortalAccessDialog({
  open,
  organisationId,
  portal,
  onClose,
  onUpdated,
}: PortalAccessDialogProps) {
  const [accessType, setAccessType] = useState<Portal["access_type"]>(
    portal?.access_type ?? "anyone_with_link",
  );
  const [emailsInput, setEmailsInput] = useState(
    portal?.access_email_allowlist.join("\n") ?? "",
  );
  const alreadyHasCode = portal?.access_type === "anyone_with_code" && portal?.access_code_hash != null;
  const [accessCode, setAccessCode] = useState(() =>
    alreadyHasCode ? "" : generateAccessCode()
  );
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!portal) {
      return;
    }

    setSaving(true);

    if (accessType === "anyone_with_link") {
      const result = await updatePortalAccess({
        organisationId,
        portalId: portal.id,
        accessType,
      });

      if (result.error) {
        toast.error(result.error.message);
        setSaving(false);
        return;
      }

      toast.success("Portal access updated.");
      setSaving(false);
      onClose();
      await onUpdated();
      return;
    }

    if (accessType === "email_otp") {
      const emails = emailsInput
        .split(/[\n,]/)
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      if (emails.length === 0) {
        toast.error("Add at least one email for OTP access.");
        setSaving(false);
        return;
      }

      const result = await updatePortalAccess({
        organisationId,
        portalId: portal.id,
        accessType,
        emails,
      });

      if (result.error) {
        toast.error(result.error.message);
        setSaving(false);
        return;
      }

      toast.success("Portal access updated.");
      setSaving(false);
      onClose();
      await onUpdated();
      return;
    }

    const result = await updatePortalAccess({
      organisationId,
      portalId: portal.id,
      accessType,
      code: accessCode,
    });

    if (result.error) {
      toast.error(result.error.message);
      setSaving(false);
      return;
    }

    toast.success("Portal access updated.");
    setSaving(false);
    onClose();
    await onUpdated();
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure portal access</DialogTitle>
          <DialogDescription>
            Choose who can open this portal and how they authenticate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Access type</Label>
            <Select
              value={accessType}
              onValueChange={(value) => {
                const nextValue = value as Portal["access_type"];
                setAccessType(nextValue);

                if (nextValue === "anyone_with_code" && !alreadyHasCode && accessCode.trim().length === 0) {
                  setAccessCode(generateAccessCode());
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anyone_with_link">
                  Anyone with link
                </SelectItem>
                <SelectItem value="email_otp" disabled>
                  <span className="flex items-center gap-2">
                    Email access with OTP
                    <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[0.625rem] font-medium text-muted-foreground">Soon</span>
                  </span>
                </SelectItem>
                <SelectItem value="anyone_with_code">
                  Anyone with code
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {accessType === "anyone_with_link" && portal ? (
            <div className="space-y-2">
              <Label>Portal link</Label>
              <InputGroup>
                <InputGroupInput
                  value={`${window.location.origin}/view?portal_id=${portal.id}`}
                  readOnly
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    onClick={() => {
                      void navigator.clipboard.writeText(`${window.location.origin}/view?portal_id=${portal.id}`);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? <Check className="text-green-500" /> : <Copy />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>
          ) : null}

          {accessType === "email_otp" ? (
            <div className="space-y-2">
              <Label htmlFor="access-emails">Allowed client emails</Label>
              <Textarea
                id="access-emails"
                value={emailsInput}
                onChange={(event) => setEmailsInput(event.target.value)}
                placeholder="client@company.com\nsecond@company.com"
              />
              <p className="text-xs text-muted-foreground">
                Enter one email per line or separate by commas.
              </p>
            </div>
          ) : null}

          {accessType === "anyone_with_code" ? (
            <div className="space-y-2">
              <Label htmlFor="access-code">Portal access code</Label>
              {alreadyHasCode && accessCode.trim().length === 0 ? (
                <>
                  <p className="text-muted-foreground">
                    A code is already set. For security, it cannot be viewed again.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAccessCode(generateAccessCode())}
                  >
                    Regenerate code
                  </Button>
                </>
              ) : (
                <>
                  <InputGroup>
                    <InputGroupInput id="access-code" value={accessCode} readOnly />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        onClick={() => {
                          void navigator.clipboard.writeText(accessCode);
                          setCodeCopied(true);
                          setTimeout(() => setCodeCopied(false), 2000);
                        }}
                      >
                        {codeCopied ? <Check className="text-green-500" /> : <Copy />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  <p className="text-xs text-muted-foreground">
                    Save this code now — you won&apos;t be able to view it again after saving.
                  </p>
                </>
              )}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving..." : "Save access"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
