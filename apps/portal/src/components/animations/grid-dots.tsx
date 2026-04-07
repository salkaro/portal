"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type GridDotsProps = {
  className?: string;
  children?: ReactNode;
  dotSize?: number;
  gap?: number;
  minOpacity?: number;
  maxOpacity?: number;
  radius?: number;
};

function buildDotsBackground(dotSize: number, gap: number) {
  return {
    backgroundImage: `radial-gradient(circle, var(--color-primary) ${dotSize}px, transparent ${dotSize + 0.5}px)`,
    backgroundSize: `${gap}px ${gap}px`,
  };
}

const GridDots = ({
  className,
  children,
  dotSize = 1,
  gap = 18,
  minOpacity = 0.2,
  maxOpacity = 0.72,
  radius = 140,
}: GridDotsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const dotsBackground = buildDotsBackground(dotSize, gap);

  useEffect(() => {
    function handleMouseMove(event: globalThis.MouseEvent) {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const isInside = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;

      setMouse({ x, y });
      setIsHovered(isInside);
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const spotlightMask = `radial-gradient(${radius}px circle at ${mouse.x}px ${mouse.y}px, black 0%, transparent 100%)`;

  return (
    <div
      ref={containerRef}
      className={cn("relative isolate overflow-hidden", className)}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          ...dotsBackground,
          opacity: minOpacity,
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-150"
        style={
          {
            ...dotsBackground,
            opacity: isHovered ? maxOpacity : 0,
            maskImage: spotlightMask,
            WebkitMaskImage: spotlightMask,
          } as CSSProperties
        }
      />

      {children ? <div className="relative z-10">{children}</div> : null}
    </div>
  );
};

export default GridDots;
