"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@salkaro/ui";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@salkaro/ui";
import { SidebarUpgrade } from "@/components/app/sidebar/sidebar-upgrade";
import { SidebarUser } from "@/components/app/sidebar/sidebar-user";
import {
  ONBOARDING_TOUR_TARGET_ATTRIBUTE,
  ONBOARDING_TOUR_TARGETS,
} from "@/constants/onboarding";
import { ROUTES } from "@/constants/routes";
import {
  NAV_FOOTER_ITEMS,
  NAV_INTERNAL_ITEMS,
  NAV_ITEMS,
} from "@/constants/site";
import { useOrganisation } from "@/hooks/use-organisation";
import FeatureGuard from "../../guards/feature-guard";
import type { PlanTier } from "@/lib/plans";

function getInitials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "P";

  const parts = cleaned.split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

export function AppSidebar() {
  const pathname = usePathname();
  const { organisation } = useOrganisation();
  const organisationName = organisation?.name?.trim() || "Portal";
  const organisationIconUrl = organisation?.icon_url || "";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="group-data-[collapsible=icon]:justify-center"
            >
              <Link href={ROUTES.DASHBOARD}>
                <Avatar size="sm">
                  <AvatarImage
                    src={organisationIconUrl}
                    alt={organisationName}
                  />
                  <AvatarFallback className="text-xs">
                    {getInitials(organisationName)}
                  </AvatarFallback>
                </Avatar>

                <span className="font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
                  {organisationName}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === href || pathname.startsWith(href + "/")
                    }
                    tooltip={label}
                  >
                    <Link
                      href={href}
                      {...(href === ROUTES.PORTALS
                        ? {
                            [ONBOARDING_TOUR_TARGET_ATTRIBUTE]:
                              ONBOARDING_TOUR_TARGETS.PORTALS,
                          }
                        : {})}
                    >
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>INTERNAL</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_INTERNAL_ITEMS.map(({ label, href, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === href || pathname.startsWith(href + "/")
                    }
                    tooltip={label}
                  >
                    <Link
                      href={href}
                      {...(href === ROUTES.INTEGRATIONS
                        ? {
                            [ONBOARDING_TOUR_TARGET_ATTRIBUTE]:
                              ONBOARDING_TOUR_TARGETS.INTEGRATIONS,
                          }
                        : {})}
                    >
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <FeatureGuard freePlanRequired plan={organisation?.subscription as PlanTier | undefined}>
            <SidebarUpgrade />
          </FeatureGuard>
          {NAV_FOOTER_ITEMS.map(({ label, href, icon: Icon }) => (
            <SidebarMenuItem key={href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === href || pathname.startsWith(href + "/")}
                tooltip={label}
              >
                <Link href={href}>
                  <Icon />
                  <span>{label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
