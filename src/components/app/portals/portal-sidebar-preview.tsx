"use client";

import { LayoutDashboard, ListTodo, GitBranch, Activity } from "lucide-react";

type PortalSidebarPreviewProps = {
  portalName: string;
  tagline?: string | null;
  logoSrc?: string | null;
  primaryColor?: string | null;
  foregroundColor?: string | null;
  hidePoweredBy?: boolean;
};

const NAV_ITEMS = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Tasks", icon: ListTodo, active: false },
  { label: "Timeline", icon: GitBranch, active: false },
  { label: "Activity", icon: Activity, active: false },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function PortalSidebarPreview({
  portalName,
  tagline,
  logoSrc,
  primaryColor,
  foregroundColor,
  hidePoweredBy,
}: PortalSidebarPreviewProps) {
  const bg = primaryColor ?? "hsl(var(--sidebar))";
  const fg = foregroundColor ?? (primaryColor ? "#ffffff" : "hsl(var(--sidebar-foreground))");
  const activeBg = primaryColor
    ? `color-mix(in srgb, ${fg} 15%, transparent)`
    : "hsl(var(--sidebar-accent))";
  const hoverBg = primaryColor
    ? `color-mix(in srgb, ${fg} 10%, transparent)`
    : "hsl(var(--sidebar-accent))";
  const mutedFg = primaryColor
    ? `color-mix(in srgb, ${fg} 65%, transparent)`
    : "hsl(var(--muted-foreground))";
  const borderColor = primaryColor
    ? `color-mix(in srgb, ${fg} 15%, transparent)`
    : "hsl(var(--sidebar-border))";

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-border text-[11px] shadow-sm"
      style={{ background: bg, color: fg }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-2.5">
        {/* Avatar */}
        <div
          className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full text-[9px] font-bold"
          style={{ background: activeBg, color: fg }}
        >
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} alt="" className="size-full object-cover" />
          ) : (
            getInitials(portalName)
          )}
        </div>
        {/* Name + tagline */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight" style={{ color: fg }}>
            {portalName || "Portal name"}
          </p>
          {tagline && (
            <p className="truncate leading-tight" style={{ color: mutedFg, fontSize: 9 }}>
              {tagline}
            </p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-2.5 mb-1" style={{ height: 1, background: borderColor }} />

      {/* Nav items */}
      <div className="flex-1 space-y-0.5 px-1.5 py-1">
        {NAV_ITEMS.map(({ label, icon: Icon, active }) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-md px-2 py-1.5"
            style={{
              background: active ? activeBg : "transparent",
              color: active ? fg : mutedFg,
              fontWeight: active ? 600 : 400,
            }}
          >
            <Icon className="size-3 shrink-0" />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      {!hidePoweredBy && (
        <>
          <div className="mx-2.5 mt-1" style={{ height: 1, background: borderColor }} />
          <div className="px-2.5 py-2 text-center" style={{ color: mutedFg, fontSize: 9 }}>
            Powered by Salkaro
          </div>
        </>
      )}
    </div>
  );
}
