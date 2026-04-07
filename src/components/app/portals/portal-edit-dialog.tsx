"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isMondayImportableColumnType } from "@/constants/portals";
import { useMondaySource } from "@/hooks/use-monday-source";
import { useOrganisation } from "@/hooks/use-organisation";
import { PLANS } from "@/constants/plans";
import {
  updatePortalCustomization,
  updatePortalImportConfig,
  updatePortalName,
  updatePortalStatus,
} from "@/services/supabase/portals";
import { uploadPortalLogoDataUrl } from "@/services/supabase/avatar-storage";
import type { Portal } from "@/types/portal";
import { PortalEditGeneralTab } from "@/components/app/portals/portal-edit-tabs/portal-edit-general-tab";
import { PortalEditFieldsTab } from "@/components/app/portals/portal-edit-tabs/portal-edit-fields-tab";
import { PortalEditSectionsTab } from "@/components/app/portals/portal-edit-tabs/portal-edit-sections-tab";
import { PortalEditBrandingTab } from "@/components/app/portals/portal-edit-tabs/portal-edit-branding-tab";

type PortalEditDialogProps = {
  portal: Portal | null;
  organisationId: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

export function PortalEditDialog({
  portal,
  organisationId,
  onClose,
  onSaved,
}: PortalEditDialogProps) {
  const { organisation } = useOrganisation();
  const isPro = organisation?.subscription === PLANS.PRO;
  const { columns, loadingColumns, loadColumns } = useMondaySource();

  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // General
  const [portalNameDraft, setPortalNameDraft] = useState("");
  const [portalStatusDraft, setPortalStatusDraft] = useState<"draft" | "active">("draft");

  // Fields
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>([]);

  // Sections
  const [tagline, setTagline] = useState("");
  const [projectOwner, setProjectOwner] = useState("");
  const [organisationName, setOrganisationName] = useState("");
  const [showStatusSection, setShowStatusSection] = useState(true);
  const [showTimelineSection, setShowTimelineSection] = useState(true);
  const [showOwnersSection, setShowOwnersSection] = useState(false);

  // Branding
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoDraft, setLogoDraft] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#0d9488");
  const [foregroundColor, setForegroundColor] = useState("#ffffff");
  const [hidePoweredBy, setHidePoweredBy] = useState(false);
  const [hidePdfBranding, setHidePdfBranding] = useState(false);

  useEffect(() => {
    if (!portal) return;
    setPortalNameDraft(portal.name);
    setPortalStatusDraft(portal.status === "active" ? "active" : "draft");
    setSelectedColumnIds(portal.import_config.selectedColumnIds);
    setTagline(portal.customization.tagline ?? "");
    setProjectOwner(portal.customization.projectOwner ?? "");
    setOrganisationName(portal.customization.organisationName ?? "");
    setShowStatusSection(portal.customization.showStatusSection);
    setShowTimelineSection(portal.customization.showTimelineSection);
    setShowOwnersSection(portal.customization.showOwnersSection);
    setLogoUrl(portal.customization.logoUrl ?? null);
    setLogoDraft(null);
    setPrimaryColor(portal.customization.primaryColor ?? "#0d9488");
    setForegroundColor(portal.customization.foregroundColor ?? "#ffffff");
    setHidePoweredBy(portal.customization.hidePoweredBy ?? false);
    setHidePdfBranding(portal.customization.hidePdfBranding ?? false);
    void loadColumns(portal.connection_id, portal.import_config.boardId, true);
  }, [portal, loadColumns]);

  function handleClose() {
    if (!saving) {
      setLogoDraft(null);
      onClose();
    }
  }

  async function handleSave() {
    if (!portal) return;

    const nextName = portalNameDraft.trim();
    if (!nextName) {
      toast.error("Please enter a portal name.");
      return;
    }
    if (selectedColumnIds.length === 0) {
      toast.error("Please select at least one field.");
      return;
    }

    setSaving(true);

    let resolvedLogoUrl = logoUrl;
    if (isPro && logoDraft) {
      setUploadingLogo(true);
      try {
        const { publicUrl } = await uploadPortalLogoDataUrl(organisationId, portal.id, logoDraft);
        resolvedLogoUrl = publicUrl;
        setLogoUrl(publicUrl);
        setLogoDraft(null);
      } catch {
        toast.error("Failed to upload logo. Please try again.");
        setSaving(false);
        setUploadingLogo(false);
        return;
      }
      setUploadingLogo(false);
    }

    const [nameResult, statusResult, fieldsResult, displayResult] = await Promise.all([
      updatePortalName({ organisationId, portalId: portal.id, name: nextName }),
      portalStatusDraft !== portal.status
        ? updatePortalStatus({ organisationId, portalId: portal.id, status: portalStatusDraft })
        : Promise.resolve({ error: null }),
      updatePortalImportConfig({
        organisationId,
        portalId: portal.id,
        importConfig: { ...portal.import_config, selectedColumnIds },
      }),
      updatePortalCustomization({
        organisationId,
        portalId: portal.id,
        customization: {
          tagline: tagline.trim() || null,
          projectOwner: projectOwner.trim() || null,
          organisationName: organisationName.trim() || null,
          showStatusSection,
          showTimelineSection,
          showOwnersSection,
          logoUrl: isPro ? resolvedLogoUrl : null,
          primaryColor: isPro ? primaryColor : null,
          foregroundColor: isPro ? foregroundColor : null,
          hidePoweredBy: isPro ? hidePoweredBy : false,
          hidePdfBranding: isPro ? hidePdfBranding : false,
        },
      }),
    ]);

    setSaving(false);

    const firstError = nameResult.error ?? statusResult.error ?? fieldsResult.error ?? displayResult.error;
    if (firstError) {
      toast.error(firstError.message);
      return;
    }

    toast.success("Portal updated.");
    handleClose();
    await onSaved();
  }

  const importableColumns = columns.filter((col) => isMondayImportableColumnType(col.type));
  const initials = portalNameDraft.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "P";

  return (
    <Dialog open={portal !== null} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit portal</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
            <TabsTrigger value="fields" className="flex-1">Fields</TabsTrigger>
            <TabsTrigger value="display" className="flex-1">Sections</TabsTrigger>
            <TabsTrigger value="branding" className="flex-1">Branding</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="pt-3">
            <PortalEditGeneralTab
              name={portalNameDraft}
              status={portalStatusDraft}
              onNameChange={setPortalNameDraft}
              onStatusChange={setPortalStatusDraft}
              disabled={saving}
            />
          </TabsContent>

          <TabsContent value="fields" className="pt-3">
            <PortalEditFieldsTab
              boardName={portal?.import_config.boardName ?? ""}
              columns={importableColumns}
              loadingColumns={loadingColumns}
              selectedColumnIds={selectedColumnIds}
              onSelectedColumnIdsChange={setSelectedColumnIds}
              disabled={saving}
            />
          </TabsContent>

          <TabsContent value="display" className="pt-3">
            <PortalEditSectionsTab
              tagline={tagline}
              projectOwner={projectOwner}
              organisationName={organisationName}
              showStatusSection={showStatusSection}
              showTimelineSection={showTimelineSection}
              showOwnersSection={showOwnersSection}
              onTaglineChange={setTagline}
              onProjectOwnerChange={setProjectOwner}
              onOrganisationNameChange={setOrganisationName}
              onShowStatusSectionChange={setShowStatusSection}
              onShowTimelineSectionChange={setShowTimelineSection}
              onShowOwnersSectionChange={setShowOwnersSection}
              disabled={saving}
            />
          </TabsContent>

          <TabsContent value="branding" className="pt-3">
            <PortalEditBrandingTab
              isPro={isPro}
              portalName={portalNameDraft}
              tagline={tagline}
              logoUrl={logoUrl}
              logoDraft={logoDraft}
              primaryColor={primaryColor}
              foregroundColor={foregroundColor}
              hidePoweredBy={hidePoweredBy}
              hidePdfBranding={hidePdfBranding}
              initials={initials}
              onLogoDraftChange={setLogoDraft}
              onPrimaryColorChange={setPrimaryColor}
              onForegroundColorChange={setForegroundColor}
              onHidePoweredByChange={setHidePoweredBy}
              onHidePdfBrandingChange={setHidePdfBranding}
              disabled={saving}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? (
              <>
                <Spinner className="size-4" />
                {uploadingLogo ? "Uploading..." : "Saving..."}
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
