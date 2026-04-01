"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import { CameraIcon } from "lucide-react";
import { limitInput } from "@/utils/string";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarCropDialog } from "@/components/app/settings/general/avatar-crop-dialog";
import { GeneralSettingsSkeleton } from "@/components/app/settings/general/general-settings-skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import { updateCurrentUserProfile } from "@/services/auth";
import { uploadAvatarDataUrl } from "@/services/supabase/avatar-storage";
import { formatDateTime } from "@/utils/format-dates";

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

  const fallback = canvas.toDataURL("image/jpeg", 0.35);
  return fallback;
}

function getInitials(
  name: string | null | undefined,
  email: string | null | undefined,
): string {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }

  return email ? email.slice(0, 2).toUpperCase() : "?";
}

export function GeneralSettingsContent() {
  const { user, loading } = useCurrentUser();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fullNameDraft, setFullNameDraft] = useState("");
  const [avatarUrlDraft, setAvatarUrlDraft] = useState("");
  const [hasEditedName, setHasEditedName] = useState(false);
  const [hasEditedAvatar, setHasEditedAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [pendingCropImage, setPendingCropImage] = useState("");

  const fullNameFromUser =
    (user?.user_metadata?.full_name as string | undefined) ?? "";
  const avatarUrlFromUser =
    (user?.user_metadata?.avatar_url as string | undefined) ?? "";
  const fullName = hasEditedName ? fullNameDraft : fullNameFromUser;
  const avatarUrl = hasEditedAvatar ? avatarUrlDraft : avatarUrlFromUser;
  const isDirty =
    fullName !== fullNameFromUser || avatarUrl !== avatarUrlFromUser;

  const initials = useMemo(
    () => getInitials(fullName, user?.email),
    [fullName, user?.email],
  );

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

    setAvatarUrlDraft(croppedDataUrl);
    setHasEditedAvatar(true);
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
    if (!user) {
      setSaveError("Unable to save profile. Please refresh and try again.");
      return;
    }

    setIsSaving(true);
    setSaveError("");

    let avatarUrlToPersist = avatarUrl;
    if (avatarUrl.startsWith("data:")) {
      try {
        const { publicUrl } = await uploadAvatarDataUrl(user.id, avatarUrl);
        avatarUrlToPersist = publicUrl;
      } catch (uploadError) {
        const message =
          uploadError instanceof Error
            ? uploadError.message
            : "Unable to upload avatar image.";
        setSaveError(message);
        setIsSaving(false);
        return;
      }
    }

    const result = await updateCurrentUserProfile({
      fullName: fullName.trim(),
      avatarUrl: avatarUrlToPersist,
    });

    if (result.error) {
      setSaveError(result.error.message);
      setIsSaving(false);
      return;
    }

    const updatedName =
      (result.data.user?.user_metadata?.full_name as string | undefined) ??
      fullName;
    const updatedAvatar =
      (result.data.user?.user_metadata?.avatar_url as string | undefined) ??
      avatarUrlToPersist;

    setFullNameDraft(updatedName);
    setAvatarUrlDraft(updatedAvatar);
    setHasEditedName(false);
    setHasEditedAvatar(false);
    toast.success("Profile updated successfully.");
    setIsSaving(false);
  }

  function handleCancelChanges() {
    setFullNameDraft(fullNameFromUser);
    setAvatarUrlDraft(avatarUrlFromUser);
    setHasEditedName(false);
    setHasEditedAvatar(false);
    setSaveError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  if (loading) {
    return <GeneralSettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="group relative">
          <Avatar className="size-12">
            <AvatarImage
              src={avatarUrl}
              alt={fullName || user?.email || "Profile image"}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <Label
            htmlFor="profile-image"
            className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            <CameraIcon className="size-3.5" />
          </Label>

          <Input
            id="profile-image"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleImageUpload}
          />
        </div>

        <div className="flex-1 space-y-2">
          <Label htmlFor="full-name">Full name</Label>
          <Input
            id="full-name"
            value={fullName}
            onChange={(event) => {
              setFullNameDraft(limitInput(event.target.value, 64));
              setHasEditedName(true);
              setSaveError("");
            }}
            placeholder="Enter your full name"
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground">
            Account created
          </p>
          <p className="text-xs">{formatDateTime(user?.created_at)}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-muted-foreground">
            Last sign in
          </p>
          <p className="text-xs">{formatDateTime(user?.last_sign_in_at)}</p>
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
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </>
        )}
        {saveError && <p className="text-xs text-destructive">{saveError}</p>}
      </div>

      <AvatarCropDialog
        key={pendingCropImage || "avatar-crop-empty"}
        open={isCropOpen}
        imageSrc={pendingCropImage}
        onCancel={handleCropCancel}
        onApply={handleCropApply}
      />
    </div>
  );
}
