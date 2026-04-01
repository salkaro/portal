"use client";

import { type ComponentType, useEffect, useMemo, useState } from "react";
import { AppWindowIcon, CompassIcon, PlugZapIcon } from "lucide-react";
import {
  ONBOARDING_TOUR_TARGET_ATTRIBUTE,
  ONBOARDING_TOUR_TARGETS,
  type OnboardingTourTarget,
} from "@/constants/onboarding";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type PostCreateTourProps = {
  open: boolean;
  onComplete: () => void;
  onSkip: () => void;
};

type TourStep = {
  target: OnboardingTourTarget;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const TOUR_STEPS: TourStep[] = [
  {
    target: ONBOARDING_TOUR_TARGETS.PORTALS,
    title: "Start with Portals",
    description: "Create and manage your client portals here.",
    icon: AppWindowIcon,
  },
  {
    target: ONBOARDING_TOUR_TARGETS.INTEGRATIONS,
    title: "Connect Integrations",
    description: "Link your data sources here so portals stay up to date.",
    icon: PlugZapIcon,
  },
];

function getTargetRect(target: OnboardingTourTarget): Rect | null {
  const node = document.querySelector<HTMLElement>(
    `[${ONBOARDING_TOUR_TARGET_ATTRIBUTE}="${target}"]`,
  );

  if (!node) return null;

  const rect = node.getBoundingClientRect();

  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

export function PostCreateTour({
  open,
  onComplete,
  onSkip,
}: PostCreateTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);

  const step = useMemo(() => TOUR_STEPS[stepIndex], [stepIndex]);
  const isLastStep = stepIndex === TOUR_STEPS.length - 1;
  const StepIcon = step.icon;

  useEffect(() => {
    if (!open) return;

    const updateRect = () => {
      const rect = getTargetRect(step.target);
      setTargetRect(rect);

      if (!rect) {
        onComplete();
      }
    };

    updateRect();

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [open, onComplete, step.target]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onSkip();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onSkip]);

  if (!open || !targetRect) return null;

  const highlightPadding = 6;
  const highlightTop = Math.max(0, targetRect.top - highlightPadding);
  const highlightLeft = Math.max(0, targetRect.left - highlightPadding);
  const highlightWidth = targetRect.width + highlightPadding * 2;
  const highlightHeight = targetRect.height + highlightPadding * 2;

  const cardWidth = 320;
  const cardTop = Math.max(12, highlightTop);
  const cardLeft = Math.min(
    highlightLeft + highlightWidth + 12,
    window.innerWidth - cardWidth - 12,
  );

  function handleNext() {
    if (isLastStep) {
      onComplete();
      return;
    }

    setStepIndex((previous) => previous + 1);
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/35" />

      <div
        className="pointer-events-none fixed z-51 rounded-md border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
        style={{
          top: highlightTop,
          left: highlightLeft,
          width: highlightWidth,
          height: highlightHeight,
        }}
      />

      <div
        className="fixed z-52 w-80 rounded-lg border border-border bg-background p-4 shadow-xl"
        style={{ top: cardTop, left: cardLeft, width: cardWidth }}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-1.5 text-primary">
              <StepIcon className="size-4" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {step.title}
            </p>
          </div>
          <Badge variant="outline" className="h-5 text-[10px]">
            <CompassIcon className="size-3" />
            Guided
          </Badge>
        </div>

        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {step.description}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Step {stepIndex + 1} of {TOUR_STEPS.length}
          </p>
          <Button variant="ghost" size="sm" onClick={onSkip}>
            Skip
          </Button>
        </div>

        <div className="mt-2 flex justify-end">
          <Button size="sm" onClick={handleNext}>
            {isLastStep ? "Got it" : "Next"}
          </Button>
        </div>
      </div>
    </>
  );
}
