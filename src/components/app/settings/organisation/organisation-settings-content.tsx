"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import { CameraIcon } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { AvatarCropDialog } from "@/components/app/settings/general/avatar-crop-dialog";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useOrganisation } from "@/hooks/use-organisation";
import { uploadOrganisationIconDataUrl } from "@/services/supabase/avatar-storage";

const MAX_PROFILE_IMAGE_BYTES = 1_048_576;

function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] ?? "";
  const padding = base64.match(/=+$/)?.[0].length ?? 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image."));
    image.src = src;
  });
}

async function compressImageToDataUrl(file: File): Promise<string> {
  const sourceDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Unsupported image format."));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });

  const image = await loadImage(sourceDataUrl);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to initialize image compression.");
  }

  const maxDimension = 1200;
  const scale = Math.min(
    1,
    maxDimension / Math.max(image.naturalWidth, image.naturalHeight),
  );
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const qualities = [0.85, 0.75, 0.65, 0.55, 0.45];
  for (const quality of qualities) {
    const result = canvas.toDataURL("image/jpeg", quality);
    if (dataUrlBytes(result) <= MAX_PROFILE_IMAGE_BYTES) {
      return result;
    }
  }

  return canvas.toDataURL("image/jpeg", 0.35);
}

function getInitials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "?";

  const parts = cleaned.split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

export function OrganisationSettingsContent() {
  const { user, loading: userLoading } = useCurrentUser();
  const { organisation, loading, error, saveOrganisation } = useOrganisation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [nameDraft, setNameDraft] = useState("");
  const [iconUrlDraft, setIconUrlDraft] = useState("");
  const [hasEditedName, setHasEditedName] = useState(false);
  const [hasEditedIconUrl, setHasEditedIconUrl] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [pendingCropImage, setPendingCropImage] = useState("");

  const name = hasEditedName ? nameDraft : (organisation?.name ?? "");
  const iconUrl = hasEditedIconUrl
    ? iconUrlDraft
    : (organisation?.icon_url ?? "");
  const isDirty =
    name !== (organisation?.name ?? "") ||
    iconUrl !== (organisation?.icon_url ?? "");

  const initials = useMemo(() => getInitials(name), [name]);

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-1/3 gap-2 text-xs text-muted-foreground">
        <Spinner className="size-3.5" />
        Loading organisation...
      </div>
    );
  }

  if (error) {
    return <p className="text-xs text-destructive">{error.message}</p>;
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const compressedDataUrl = await compressImageToDataUrl(file);
      if (dataUrlBytes(compressedDataUrl) > MAX_PROFILE_IMAGE_BYTES) {
        toast.error(
          "Image is too large. Please choose an image under 1MB after compression.",
        );
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      setPendingCropImage(compressedDataUrl);
      setIsCropOpen(true);
      setSaveError("");
    } catch {
      toast.error("We couldn't process that image. Please try another file.");
    }
  }

  function handleCropApply(croppedDataUrl: string) {
    if (dataUrlBytes(croppedDataUrl) > MAX_PROFILE_IMAGE_BYTES) {
      toast.error(
        "Cropped image is still larger than 1MB. Try a smaller crop area.",
      );
      return;
    }

    setIconUrlDraft(croppedDataUrl);
    setHasEditedIconUrl(true);
    setIsCropOpen(false);
    setPendingCropImage("");
  }

  function handleCropCancel() {
    setIsCropOpen(false);
    setPendingCropImage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSave() {
    if (!organisation) return;
    if (!user) {
      setSaveError(
        "Unable to save organisation. Please refresh and try again.",
      );
      return;
    }

    setIsSaving(true);
    setSaveError("");

    let iconUrlToPersist = iconUrl;
    if (iconUrl.startsWith("data:")) {
      try {
        const { publicUrl } = await uploadOrganisationIconDataUrl(
          organisation.id,
          iconUrl,
        );
        iconUrlToPersist = publicUrl;
      } catch (uploadError) {
        const message =
          uploadError instanceof Error
            ? uploadError.message
            : "Unable to upload organisation icon.";
        setSaveError(message);
        setIsSaving(false);
        return;
      }
    }

    const result = await saveOrganisation({
      name: name.trim() || organisation.name,
      iconUrl: iconUrlToPersist.trim() || null,
      stripeCustomerId: organisation.stripe_customer_id,
      subscription: organisation.subscription,
    });

    if (result.error) {
      setSaveError(result.error.message);
      setIsSaving(false);
      return;
    }

    toast.success("Organisation updated.");
    setNameDraft(name.trim() || organisation.name);
    setIconUrlDraft(iconUrlToPersist);
    setHasEditedName(false);
    setHasEditedIconUrl(false);
    setIsSaving(false);
  }

  function handleCancelChanges() {
    setNameDraft(organisation?.name ?? "");
    setIconUrlDraft(organisation?.icon_url ?? "");
    setHasEditedName(false);
    setHasEditedIconUrl(false);
    setSaveError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="group relative">
          <Avatar className="size-12">
            <AvatarImage src={iconUrl} alt={name || "Organisation icon"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <Label
            htmlFor="organisation-icon"
            className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            <CameraIcon className="size-3.5" />
          </Label>

          <Input
            id="organisation-icon"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleImageUpload}
          />
        </div>

        <div className="flex-1 space-y-2">
          <Label htmlFor="organisation-name">Name</Label>
          <Input
            id="organisation-name"
            value={name}
            onChange={(event) => {
              setNameDraft(event.target.value);
              setHasEditedName(true);
              setSaveError("");
            }}
            placeholder="Organisation name"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isDirty && (
          <>
            <Button
              variant="outline"
              onClick={handleCancelChanges}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !organisation}>
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </>
        )}
        {saveError && <p className="text-xs text-destructive">{saveError}</p>}
      </div>

      <AvatarCropDialog
        key={pendingCropImage || "organisation-crop-empty"}
        open={isCropOpen}
        imageSrc={pendingCropImage}
        onCancel={handleCropCancel}
        onApply={handleCropApply}
      />
    </div>
  );
}
