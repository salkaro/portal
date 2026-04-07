"use client";

import { useRef } from "react";
import { CameraIcon } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarCropDialog } from "@/components/app/settings/general/avatar-crop-dialog";
import { useState } from "react";

type PortalLogoPickerProps = {
  /** Current logo URL or data URL to display */
  logoSrc: string | null;
  /** Portal initials shown as fallback */
  initials: string;
  /** Called with a cropped JPEG data URL when the user confirms a new image */
  onChange: (dataUrl: string) => void;
  disabled?: boolean;
};

const MAX_IMAGE_BYTES = 1_048_576;

function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] ?? "";
  const padding = base64.match(/=+$/)?.[0].length ?? 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Unable to load image."));
    img.src = src;
  });
}

async function compressToDataUrl(file: File): Promise<string> {
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
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable.");

  const maxDim = 1200;
  const scale = Math.min(1, maxDim / Math.max(image.naturalWidth, image.naturalHeight));
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  for (const quality of [0.85, 0.75, 0.65, 0.55, 0.45]) {
    const result = canvas.toDataURL("image/jpeg", quality);
    if (dataUrlBytes(result) <= MAX_IMAGE_BYTES) return result;
  }
  return canvas.toDataURL("image/jpeg", 0.35);
}

export function PortalLogoPicker({
  logoSrc,
  initials,
  onChange,
  disabled = false,
}: PortalLogoPickerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingCrop, setPendingCrop] = useState("");
  const [cropOpen, setCropOpen] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressToDataUrl(file);
      if (dataUrlBytes(compressed) > MAX_IMAGE_BYTES) {
        toast.error("Image is too large. Please choose a smaller file.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setPendingCrop(compressed);
      setCropOpen(true);
    } catch {
      toast.error("Couldn't process that image. Please try another file.");
    }
  }

  function handleCropApply(croppedDataUrl: string) {
    setCropOpen(false);
    setPendingCrop("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    onChange(croppedDataUrl);
  }

  function handleCropCancel() {
    setCropOpen(false);
    setPendingCrop("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => fileInputRef.current?.click()}
        className="group relative size-16 shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        aria-label="Change portal logo"
      >
        <Avatar className="size-16 rounded-full">
          {logoSrc && <AvatarImage src={logoSrc} alt="Portal logo" className="object-cover" />}
          <AvatarFallback className="rounded-full text-sm font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <CameraIcon className="size-5 text-white" />
        </div>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => void handleFileChange(e)}
      />

      <AvatarCropDialog
        open={cropOpen}
        imageSrc={pendingCrop}
        onCancel={handleCropCancel}
        onApply={handleCropApply}
      />
    </>
  );
}
