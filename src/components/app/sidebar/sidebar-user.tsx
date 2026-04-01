"use client";

import {
  ChevronsUpDownIcon,
  UserIcon,
  CreditCardIcon,
  LogOutIcon,
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { handleSignOut } from "@/lib/sign-out";
import { SETTINGS_ROUTES } from "@/constants/routes";

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

export function SidebarUser() {
  const { user } = useCurrentUser();
  const { isMobile } = useSidebar();

  const fullName = user?.user_metadata?.full_name as string | undefined;
  const email = user?.email;
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const initials = getInitials(fullName, email);

  async function onSignOut() {
    await handleSignOut(user?.id);
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={fullName ?? email ?? "Account"}
              className="
                  data-[state=open]:bg-sidebar-accent 
                  data-[state=open]:text-sidebar-accent-foreground
                  group-data-[collapsible=icon]:justify-center
                "
            >
              <Avatar className="size-6 rounded-md">
                <AvatarImage src={avatarUrl} alt={fullName ?? email ?? ""} />
                <AvatarFallback className="rounded-md text-[10px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col text-left group-data-[collapsible=icon]:hidden">
                <span className="truncate text-xs font-medium">
                  {fullName ?? email}
                </span>
                {fullName && (
                  <span className="truncate text-[10px] text-muted-foreground">
                    {email}
                  </span>
                )}
              </div>

              <ChevronsUpDownIcon className="ml-auto size-3.5 shrink-0 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5">
                <Avatar className="size-7 rounded-md">
                  <AvatarImage src={avatarUrl} alt={fullName ?? email ?? ""} />
                  <AvatarFallback className="rounded-md text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-xs font-medium">
                    {fullName ?? email}
                  </span>
                  {fullName && (
                    <span className="truncate text-[10px] text-muted-foreground">
                      {email}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <a href={SETTINGS_ROUTES.GENERAL}>
                  <UserIcon />
                  Account
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={SETTINGS_ROUTES.BILLING}>
                  <CreditCardIcon />
                  Billing
                </a>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={onSignOut}>
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
