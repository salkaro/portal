"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

type AvatarCropDialogProps = {
  open: boolean;
  imageSrc: string;
  onCancel: () => void;
  onApply: (croppedDataUrl: string) => void;
};

type ImageDimensions = {
  width: number;
  height: number;
};

type PanPosition = {
  x: number;
  y: number;
};

const CROP_SIZE = 320;
const OUTPUT_SIZE = 320;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function clampPan(
  dimensions: ImageDimensions,
  zoom: number,
  pan: PanPosition,
): PanPosition {
  const scaledWidth = dimensions.width * zoom;
  const scaledHeight = dimensions.height * zoom;

  return {
    x: clamp(pan.x, CROP_SIZE - scaledWidth, 0),
    y: clamp(pan.y, CROP_SIZE - scaledHeight, 0),
  };
}

export function AvatarCropDialog({
  open,
  imageSrc,
  onCancel,
  onApply,
}: AvatarCropDialogProps) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragStartRef = useRef<PanPosition | null>(null);
  const panStartRef = useRef<PanPosition>({ x: 0, y: 0 });

  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [pan, setPan] = useState<PanPosition>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!open || !imageSrc) return;

    const image = new Image();
    image.onload = () => {
      imageRef.current = image;

      const nextDimensions = {
        width: image.naturalWidth,
        height: image.naturalHeight,
      };
      const nextMinZoom = Math.max(
        CROP_SIZE / nextDimensions.width,
        CROP_SIZE / nextDimensions.height,
      );
      const nextZoom = Math.max(1, nextMinZoom);
      const centeredPan = {
        x: (CROP_SIZE - nextDimensions.width * nextZoom) / 2,
        y: (CROP_SIZE - nextDimensions.height * nextZoom) / 2,
      };

      setDimensions(nextDimensions);
      setMinZoom(nextMinZoom);
      setZoom(nextZoom);
      setPan(clampPan(nextDimensions, nextZoom, centeredPan));
    };

    image.src = imageSrc;
  }, [open, imageSrc]);

  useEffect(() => {
    const image = imageRef.current;
    const canvas = previewCanvasRef.current;
    if (!image || !canvas || !dimensions) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scaledWidth = dimensions.width * zoom;
    const scaledHeight = dimensions.height * zoom;
    const circleRadius = CROP_SIZE / 2 - 3;

    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;

    ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);
    ctx.drawImage(image, pan.x, pan.y, scaledWidth, scaledHeight);

    // Darken everything outside the crop circle while keeping the image visible.
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.beginPath();
    ctx.rect(0, 0, CROP_SIZE, CROP_SIZE);
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, circleRadius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill("evenodd");
    ctx.restore();

    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, circleRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 10;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, circleRadius + 4, 0, Math.PI * 2);
    ctx.closePath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.stroke();
  }, [dimensions, pan, zoom, imageSrc]);

  useEffect(() => {
    if (!isDragging || !dimensions) return;
    const currentDimensions = dimensions;

    function onPointerMove(event: PointerEvent) {
      if (!dragStartRef.current) return;

      const deltaX = event.clientX - dragStartRef.current.x;
      const deltaY = event.clientY - dragStartRef.current.y;

      setPan(
        clampPan(currentDimensions, zoom, {
          x: panStartRef.current.x + deltaX,
          y: panStartRef.current.y + deltaY,
        }),
      );
    }

    function onPointerUp() {
      setIsDragging(false);
      dragStartRef.current = null;
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [isDragging, dimensions, zoom]);

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!dimensions) return;

    dragStartRef.current = { x: event.clientX, y: event.clientY };
    panStartRef.current = pan;
    setIsDragging(true);
  }

  function handleZoomChange(nextZoom: number) {
    if (!dimensions) {
      setZoom(nextZoom);
      return;
    }

    const constrainedZoom = Math.max(nextZoom, minZoom);
    const sourceCenterX = (CROP_SIZE / 2 - pan.x) / zoom;
    const sourceCenterY = (CROP_SIZE / 2 - pan.y) / zoom;

    const nextPan = clampPan(dimensions, constrainedZoom, {
      x: CROP_SIZE / 2 - sourceCenterX * constrainedZoom,
      y: CROP_SIZE / 2 - sourceCenterY * constrainedZoom,
    });

    setZoom(constrainedZoom);
    setPan(nextPan);
  }

  function handleApply() {
    const image = imageRef.current;
    if (!image || !dimensions) return;

    const sourceX = -pan.x / zoom;
    const sourceY = -pan.y / zoom;
    const sourceSize = CROP_SIZE / zoom;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE,
    );

    const outputDataUrl = canvas.toDataURL("image/jpeg", 0.9);
    onApply(outputDataUrl);
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent className="sm:max-w-xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Crop profile image</DialogTitle>
          <DialogDescription>
            Drag to move the image under the circle, then scale to frame your
            avatar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="mx-auto w-fit overflow-hidden rounded-md border">
            <canvas
              ref={previewCanvasRef}
              onPointerDown={handlePointerDown}
              className="h-80 w-80 bg-black/80 cursor-grab active:cursor-grabbing"
              aria-label="Avatar crop preview"
            />
          </div>

          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Scale</Label>
              <Slider
                min={minZoom}
                max={Math.max(minZoom + 2, 3)}
                step={0.05}
                value={[zoom]}
                onValueChange={(values) =>
                  handleZoomChange(values[0] ?? minZoom)
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleApply}>Apply crop</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
