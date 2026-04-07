"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, Check, Copy, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@salkaro/ui";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@salkaro/ui";
import { Label } from "@salkaro/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@salkaro/ui";
import { Separator } from "@salkaro/ui";
import { Spinner } from "@salkaro/ui";
import { Textarea } from "@salkaro/ui";
import { cn } from "@/lib/utils";
import { isMondayImportableColumnType } from "@/constants/portals";
import { useMondaySource } from "@/hooks/use-monday-source";
import { useOrganisation } from "@/hooks/use-organisation";
import { usePortal } from "@/hooks/use-portal";
import { PLANS } from "@/constants/plans";
import {
  updatePortalAccess,
  updatePortalCustomization,
  updatePortalImportConfig,
  updatePortalName,
  updatePortalStatus,
} from "@/services/supabase/portals";
import { uploadPortalLogoDataUrl } from "@/services/supabase/avatar-storage";
import { PortalEditGeneralTab } from "@/components/app/portals/portal-edit-tabs/portal-edit-general-tab";
import { PortalEditFieldsTab } from "@/components/app/portals/portal-edit-tabs/portal-edit-fields-tab";
import { PortalEditSectionsTab } from "@/components/app/portals/portal-edit-tabs/portal-edit-sections-tab";
import { PortalEditBrandingTab } from "@/components/app/portals/portal-edit-tabs/portal-edit-branding-tab";
import { PortalDeleteDialog } from "@/components/app/portals/portal-delete-dialog";
import type { Portal } from "@/types/portal";

type PortalDetailContentProps = {
  portalId: string;
};

type Section = "general" | "fields" | "sections" | "branding" | "access";

type Draft = {
  portalName: string;
  portalStatus: "draft" | "active";
  selectedColumnIds: string[];
  tagline: string;
  projectOwner: string;
  organisationName: string;
  showStatusSection: boolean;
  showTimelineSection: boolean;
  showOwnersSection: boolean;
  logoUrl: string | null;
  logoDraft: string | null;
  primaryColor: string;
  foregroundColor: string;
  hidePoweredBy: boolean;
  hidePdfBranding: boolean;
};

function draftFromPortal(portal: Portal): Draft {
  return {
    portalName: portal.name,
    portalStatus: portal.status === "active" ? "active" : "draft",
    selectedColumnIds: portal.import_config.selectedColumnIds,
    tagline: portal.customization.tagline ?? "",
    projectOwner: portal.customization.projectOwner ?? "",
    organisationName: portal.customization.organisationName ?? "",
    showStatusSection: portal.customization.showStatusSection,
    showTimelineSection: portal.customization.showTimelineSection,
    showOwnersSection: portal.customization.showOwnersSection,
    logoUrl: portal.customization.logoUrl ?? null,
    logoDraft: null,
    primaryColor: portal.customization.primaryColor ?? "#0d9488",
    foregroundColor: portal.customization.foregroundColor ?? "#ffffff",
    hidePoweredBy: portal.customization.hidePoweredBy ?? false,
    hidePdfBranding: portal.customization.hidePdfBranding ?? false,
  };
}

function generateAccessCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 8; i++) result += alphabet[Math.floor(Math.random() * alphabet.length)];
  return result;
}

const NAV_ITEMS: { id: Section; label: string }[] = [
  { id: "general", label: "General" },
  { id: "fields", label: "Fields" },
  { id: "sections", label: "Sections" },
  { id: "branding", label: "Branding" },
  { id: "access", label: "Access" },
];

export function PortalDetailContent({ portalId }: PortalDetailContentProps) {
  const router = useRouter();
  const { organisation } = useOrganisation();
  const { portal, loading, error, refetch } = usePortal(portalId);
  const isPro = organisation?.subscription === PLANS.PRO;
  const { columns, loadingColumns, loadColumns } = useMondaySource();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("general");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Access section state
  const [accessType, setAccessType] = useState<Portal["access_type"]>("anyone_with_link");
  const [emailsInput, setEmailsInput] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [savingAccess, setSavingAccess] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    if (!portal) return;
    queueMicrotask(() => setDraft(draftFromPortal(portal)));
    void loadColumns(portal.connection_id, portal.import_config.boardId, true);
  }, [portal, loadColumns]);

  // Sync access state when portal loads or section opens
  useEffect(() => {
    if (!portal || activeSection !== "access") return;
    const alreadyHasCode = portal.access_type === "anyone_with_code" && portal.access_code_hash != null;
    const nextCode = alreadyHasCode ? "" : generateAccessCode();
    const nextEmails = portal.access_email_allowlist.join("\n");
    const nextType = portal.access_type;
    queueMicrotask(() => {
      setAccessType(nextType);
      setEmailsInput(nextEmails);
      setAccessCode(nextCode);
    });
  }, [portal, activeSection]);

  const set = useCallback(<K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((prev) => prev ? { ...prev, [key]: value } : prev);
  }, []);

  const generalDirty = draft !== null && portal !== null && (
    draft.portalName.trim() !== portal.name ||
    draft.portalStatus !== portal.status
  );

  const fieldsDirty = draft !== null && portal !== null && (
    draft.selectedColumnIds.length !== portal.import_config.selectedColumnIds.length ||
    draft.selectedColumnIds.some((id) => !portal.import_config.selectedColumnIds.includes(id))
  );

  const sectionsDirty = draft !== null && portal !== null && (
    draft.tagline.trim() !== (portal.customization.tagline ?? "") ||
    draft.projectOwner.trim() !== (portal.customization.projectOwner ?? "") ||
    draft.organisationName.trim() !== (portal.customization.organisationName ?? "") ||
    draft.showStatusSection !== portal.customization.showStatusSection ||
    draft.showTimelineSection !== portal.customization.showTimelineSection ||
    draft.showOwnersSection !== portal.customization.showOwnersSection
  );

  const brandingDirty = draft !== null && portal !== null && (
    draft.logoDraft !== null ||
    draft.primaryColor !== (portal.customization.primaryColor ?? "#0d9488") ||
    draft.foregroundColor !== (portal.customization.foregroundColor ?? "#ffffff") ||
    draft.hidePoweredBy !== (portal.customization.hidePoweredBy ?? false) ||
    draft.hidePdfBranding !== (portal.customization.hidePdfBranding ?? false)
  );

  const handleSave = useCallback(async () => {
    if (!portal || !organisation || !draft) return;

    const nextName = draft.portalName.trim();
    if (!nextName) { toast.error("Please enter a portal name."); return; }
    if (draft.selectedColumnIds.length === 0) { toast.error("Please select at least one field."); return; }

    setSaving(true);

    let resolvedLogoUrl = draft.logoUrl;
    if (isPro && draft.logoDraft) {
      setUploadingLogo(true);
      try {
        const { publicUrl } = await uploadPortalLogoDataUrl(organisation.id, portal.id, draft.logoDraft);
        resolvedLogoUrl = publicUrl;
        setDraft((prev) => prev ? { ...prev, logoUrl: publicUrl, logoDraft: null } : prev);
      } catch {
        toast.error("Failed to upload logo. Please try again.");
        setSaving(false);
        setUploadingLogo(false);
        return;
      }
      setUploadingLogo(false);
    }

    const [nameResult, statusResult, fieldsResult, displayResult] = await Promise.all([
      updatePortalName({ organisationId: organisation.id, portalId: portal.id, name: nextName }),
      draft.portalStatus !== portal.status
        ? updatePortalStatus({ organisationId: organisation.id, portalId: portal.id, status: draft.portalStatus })
        : Promise.resolve({ error: null }),
      updatePortalImportConfig({
        organisationId: organisation.id,
        portalId: portal.id,
        importConfig: { ...portal.import_config, selectedColumnIds: draft.selectedColumnIds },
      }),
      updatePortalCustomization({
        organisationId: organisation.id,
        portalId: portal.id,
        customization: {
          tagline: draft.tagline.trim() || null,
          projectOwner: draft.projectOwner.trim() || null,
          organisationName: draft.organisationName.trim() || null,
          showStatusSection: draft.showStatusSection,
          showTimelineSection: draft.showTimelineSection,
          showOwnersSection: draft.showOwnersSection,
          logoUrl: isPro ? resolvedLogoUrl : null,
          primaryColor: isPro ? draft.primaryColor : null,
          foregroundColor: isPro ? draft.foregroundColor : null,
          hidePoweredBy: isPro ? draft.hidePoweredBy : false,
          hidePdfBranding: isPro ? draft.hidePdfBranding : false,
        },
      }),
    ]);

    setSaving(false);

    const firstError = nameResult.error ?? statusResult.error ?? fieldsResult.error ?? displayResult.error;
    if (firstError) { toast.error(firstError.message); return; }

    toast.success("Portal updated.");
    await refetch(true);
  }, [portal, organisation, isPro, draft, refetch]);

  const handleSaveAccess = useCallback(async () => {
    if (!portal || !organisation) return;
    setSavingAccess(true);

    if (accessType === "email_otp") {
      const emails = emailsInput.split(/[\n,]/).map((e) => e.trim()).filter(Boolean);
      if (emails.length === 0) { toast.error("Add at least one email for OTP access."); setSavingAccess(false); return; }
      const result = await updatePortalAccess({ organisationId: organisation.id, portalId: portal.id, accessType, emails });
      setSavingAccess(false);
      if (result.error) { toast.error(result.error.message); return; }
    } else if (accessType === "anyone_with_code") {
      const result = await updatePortalAccess({ organisationId: organisation.id, portalId: portal.id, accessType, code: accessCode });
      setSavingAccess(false);
      if (result.error) { toast.error(result.error.message); return; }
    } else {
      const result = await updatePortalAccess({ organisationId: organisation.id, portalId: portal.id, accessType });
      setSavingAccess(false);
      if (result.error) { toast.error(result.error.message); return; }
    }

    toast.success("Access updated.");
    await refetch(true);
  }, [portal, organisation, accessType, emailsInput, accessCode, refetch]);

  const saveButton = (dirty: boolean) =>
    dirty ? (
      <div className="flex items-center gap-3 mt-4">
        <Button size="sm" onClick={() => void handleSave()} disabled={saving}>
          {saving ? (
            <><Spinner className="size-4" />{uploadingLogo ? "Uploading..." : "Saving..."}</>
          ) : "Save changes"}
        </Button>
      </div>
    ) : null;

  if (loading || !draft) {
    return <div className="flex items-center justify-center py-20"><Spinner className="size-5" /></div>;
  }

  if (error) {
    return <div className="py-6 text-sm text-destructive">Failed to load portal: {error.message}</div>;
  }

  if (!portal) {
    return <div className="py-6 text-sm text-muted-foreground">Portal not found.</div>;
  }

  const importableColumns = columns.filter((col) => isMondayImportableColumnType(col.type));
  const initials = draft.portalName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "P";
  const alreadyHasCode = portal.access_type === "anyone_with_code" && portal.access_code_hash != null;
  const portalLink = typeof window !== "undefined" ? `${window.location.origin}/view?portal_id=${portal.id}` : "";

  const accessDirty =
    accessType !== portal.access_type ||
    (accessType === "email_otp" &&
      emailsInput.split(/[\n,]/).map((e) => e.trim()).filter(Boolean).join(",") !==
      portal.access_email_allowlist.join(",")) ||
    (accessType === "anyone_with_code" && accessCode.trim().length > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-2 py-1 border-b border-border">
        <Button variant="ghost" size="icon-sm" aria-label="Back to portals" onClick={() => router.push("/portals")}>
          <ArrowLeftIcon className="size-3" />
        </Button>
        <h1 className="text-xs font-medium truncate">{portal.name}</h1>
      </div>

      {/* Mobile: horizontal scrollable nav */}
      <nav className="flex sm:hidden gap-0.5 overflow-x-auto border-b border-border px-3 py-2 shrink-0">
        {NAV_ITEMS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveSection(id)}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
              activeSection === id
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="flex flex-1 min-h-0">
        {/* Desktop: vertical sidebar */}
        <aside className="hidden sm:block w-44 shrink-0 border-r border-border p-3">
          <nav className="flex flex-col gap-0.5">
            {NAV_ITEMS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors",
                  activeSection === id
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeSection === "general" && (
            <div className="w-full max-w-sm space-y-4">
              <PortalEditGeneralTab
                name={draft.portalName}
                status={draft.portalStatus}
                onNameChange={(v) => set("portalName", v)}
                onStatusChange={(v) => set("portalStatus", v)}
                disabled={saving}
              />
              {saveButton(generalDirty)}
              <Separator />
              <div className="space-y-3">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Danger zone</p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium">Delete portal</p>
                    <p className="text-[11px] text-muted-foreground">Permanently delete this portal. This cannot be undone.</p>
                  </div>
                  <Button variant="outline" size="sm" className="self-start sm:self-auto" onClick={() => setDeleteDialogOpen(true)}>
                    <Trash2Icon className="size-3" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeSection === "fields" && (
            <div className="w-full max-w-sm">
              <PortalEditFieldsTab
                boardName={portal.import_config.boardName}
                columns={importableColumns}
                loadingColumns={loadingColumns}
                selectedColumnIds={draft.selectedColumnIds}
                onSelectedColumnIdsChange={(v) => set("selectedColumnIds", v)}
                disabled={saving}
              />
              {saveButton(fieldsDirty)}
            </div>
          )}

          {activeSection === "sections" && (
            <div className="w-full max-w-sm">
              <PortalEditSectionsTab
                tagline={draft.tagline}
                projectOwner={draft.projectOwner}
                organisationName={draft.organisationName}
                showStatusSection={draft.showStatusSection}
                showTimelineSection={draft.showTimelineSection}
                showOwnersSection={draft.showOwnersSection}
                onTaglineChange={(v) => set("tagline", v)}
                onProjectOwnerChange={(v) => set("projectOwner", v)}
                onOrganisationNameChange={(v) => set("organisationName", v)}
                onShowStatusSectionChange={(v) => set("showStatusSection", v)}
                onShowTimelineSectionChange={(v) => set("showTimelineSection", v)}
                onShowOwnersSectionChange={(v) => set("showOwnersSection", v)}
                disabled={saving}
              />
              {saveButton(sectionsDirty)}
            </div>
          )}

          {activeSection === "branding" && (
            <div className="max-w-2xl">
              <PortalEditBrandingTab
                isPro={isPro}
                portalName={draft.portalName}
                tagline={draft.tagline}
                logoUrl={draft.logoUrl}
                logoDraft={draft.logoDraft}
                primaryColor={draft.primaryColor}
                foregroundColor={draft.foregroundColor}
                hidePoweredBy={draft.hidePoweredBy}
                hidePdfBranding={draft.hidePdfBranding}
                initials={initials}
                onLogoDraftChange={(v) => set("logoDraft", v)}
                onPrimaryColorChange={(v) => set("primaryColor", v)}
                onForegroundColorChange={(v) => set("foregroundColor", v)}
                onHidePoweredByChange={(v) => set("hidePoweredBy", v)}
                onHidePdfBrandingChange={(v) => set("hidePdfBranding", v)}
                disabled={saving}
              />
              {saveButton(brandingDirty)}
            </div>
          )}

          {activeSection === "access" && (
            <div className="w-full max-w-sm space-y-4">
              <div className="space-y-2">
                <Label>Access type</Label>
                <Select
                  value={accessType}
                  onValueChange={(value) => {
                    const next = value as Portal["access_type"];
                    setAccessType(next);
                    if (next === "anyone_with_code" && !alreadyHasCode && accessCode.trim().length === 0) {
                      setAccessCode(generateAccessCode());
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anyone_with_link">Anyone with link</SelectItem>
                    <SelectItem value="email_otp" disabled>
                      <span className="flex items-center gap-2">
                        Email access with OTP
                        <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[0.625rem] font-medium text-muted-foreground">Soon</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="anyone_with_code">Anyone with code</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {accessType === "anyone_with_link" && (
                <div className="space-y-2">
                  <Label>Portal link</Label>
                  <InputGroup>
                    <InputGroupInput value={portalLink} readOnly />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton onClick={() => {
                        void navigator.clipboard.writeText(portalLink);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2000);
                      }}>
                        {linkCopied ? <Check className="text-green-500" /> : <Copy />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </div>
              )}

              {accessType === "email_otp" && (
                <div className="space-y-2">
                  <Label htmlFor="access-emails">Allowed client emails</Label>
                  <Textarea
                    id="access-emails"
                    value={emailsInput}
                    onChange={(e) => setEmailsInput(e.target.value)}
                    placeholder="client@company.com&#10;second@company.com"
                  />
                  <p className="text-xs text-muted-foreground">Enter one email per line or separate by commas.</p>
                </div>
              )}

              {accessType === "anyone_with_code" && (
                <div className="space-y-2">
                  <Label htmlFor="access-code">Portal access code</Label>
                  {alreadyHasCode && accessCode.trim().length === 0 ? (
                    <>
                      <p className="text-xs text-muted-foreground">A code is already set. For security, it cannot be viewed again.</p>
                      <Button type="button" variant="outline" size="sm" onClick={() => setAccessCode(generateAccessCode())}>
                        Regenerate code
                      </Button>
                    </>
                  ) : (
                    <>
                      <InputGroup>
                        <InputGroupInput id="access-code" value={accessCode} readOnly />
                        <InputGroupAddon align="inline-end">
                          <InputGroupButton onClick={() => {
                            void navigator.clipboard.writeText(accessCode);
                            setCodeCopied(true);
                            setTimeout(() => setCodeCopied(false), 2000);
                          }}>
                            {codeCopied ? <Check className="text-green-500" /> : <Copy />}
                          </InputGroupButton>
                        </InputGroupAddon>
                      </InputGroup>
                      <p className="text-xs text-muted-foreground">Save this code now — you won&apos;t be able to view it again after saving.</p>
                    </>
                  )}
                </div>
              )}

              {accessDirty && (
                <Button size="sm" onClick={() => void handleSaveAccess()} disabled={savingAccess}>
                  {savingAccess ? "Saving..." : "Save access"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <PortalDeleteDialog
        portal={deleteDialogOpen ? portal : null}
        organisationId={organisation?.id ?? ""}
        onClose={() => setDeleteDialogOpen(false)}
        onDeleted={async () => { router.push("/portals"); }}
      />
    </div>
  );
}
