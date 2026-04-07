"use client";

import { Building2, Clock, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@salkaro/ui";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@salkaro/ui";
import type { NavSection } from "@/components/app/portals/view/portal-board-view";

type PortalSidebarProps = {
  portalName: string;
  tagline?: string | null;
  projectOwner?: string | null;
  organisationName?: string | null;
  lastUpdatedLabel?: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  foregroundColor?: string | null;
  hidePoweredBy?: boolean;
  activeSection: NavSection;
  navItems: { id: NavSection; label: string; icon: React.ElementType }[];
  onSectionChange: (section: NavSection) => void;
};

function getPortalInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Convert #rrggbb to [r, g, b] (0-255). Returns null if invalid. */
function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return [r, g, b];
}

/**
 * Build CSS variable overrides for the sidebar based on a hex brand colour.
 * --sidebar         → very light tint (5% opacity over white) as the background
 * --sidebar-primary → the brand colour itself (active item indicator)
 * --sidebar-primary-foreground → white
 * --sidebar-accent  → light tint (8%) for hover states
 */
function buildSidebarStyle(hex: string | null | undefined, fgHex: string | null | undefined): React.CSSProperties {
  const rgb = hexToRgb(hex ?? "#0d9488");
  if (!rgb) return {};
  const [r, g, b] = rgb;
  const fg = fgHex ?? "#ffffff";
  return {
    "--sidebar": `rgb(${r} ${g} ${b})`,
    "--sidebar-foreground": `color-mix(in srgb, ${fg} 65%, transparent)`,
    "--sidebar-primary": `color-mix(in srgb, ${fg} 15%, transparent)`,
    "--sidebar-primary-foreground": fg,
    "--sidebar-accent": `color-mix(in srgb, ${fg} 15%, transparent)`,
    "--sidebar-accent-foreground": fg,
    "--sidebar-border": `color-mix(in srgb, ${fg} 15%, transparent)`,
  } as React.CSSProperties;
}

export function PortalSidebar({
  portalName,
  tagline,
  projectOwner,
  organisationName,
  lastUpdatedLabel,
  logoUrl,
  primaryColor,
  foregroundColor,
  hidePoweredBy,
  activeSection,
  navItems,
  onSectionChange,
}: PortalSidebarProps) {
  const sidebarStyle = buildSidebarStyle(primaryColor, foregroundColor);

  return (
    <div style={sidebarStyle} className="contents">
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="cursor-default">
                <Avatar className="size-8 shrink-0 rounded-full">
                  {logoUrl && (
                    <AvatarImage
                      src={logoUrl}
                      alt={portalName}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback
                    className="rounded-full text-xs font-semibold"
                    style={{ background: "var(--sidebar-primary)", color: "var(--sidebar-accent-foreground)" }}
                  >
                    {getPortalInitials(portalName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col gap-0.5 leading-none">
                  <span
                    className="truncate font-semibold text-xs"
                    style={{ color: "var(--sidebar-accent-foreground)" }}
                    title={portalName}
                  >
                    {portalName}
                  </span>
                  {tagline && (
                    <span className="truncate" title={tagline}>
                      {tagline}
                    </span>
                  )}
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={activeSection === item.id}
                      onClick={() => onSectionChange(item.id)}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {(projectOwner || organisationName || lastUpdatedLabel) && (
            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <div
                  className="space-y-2 px-2 py-2"
                  style={{ color: "var(--sidebar-foreground)" }}
                >
                  {projectOwner && (
                    <div className="flex items-center gap-2 text-xs">
                      <User className="size-3.5 shrink-0" />
                      <span className="truncate">{projectOwner}</span>
                    </div>
                  )}
                  {organisationName && (
                    <div className="flex items-center gap-2 text-xs">
                      <Building2 className="size-3.5 shrink-0" />
                      <span className="truncate">{organisationName}</span>
                    </div>
                  )}
                  {lastUpdatedLabel && (
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="size-3.5 shrink-0" />
                      <span className="truncate">
                        Updated {lastUpdatedLabel}
                      </span>
                    </div>
                  )}
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        {!hidePoweredBy && (
          <SidebarFooter
            className="px-4 py-3 group-data-[collapsible=icon]:hidden"
            style={{ borderTop: "1px solid var(--sidebar-border)" }}
          >
            <p
              className="text-[0.625rem] text-center"
              style={{ color: "var(--sidebar-foreground)" }}
            >
              Powered by Salkaro
            </p>
          </SidebarFooter>
        )}
      </Sidebar>
    </div>
  );
}
