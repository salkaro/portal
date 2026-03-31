"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  NAV_FOOTER_ITEMS,
  NAV_INTERNAL_ITEMS,
  NAV_ITEMS,
} from "@/constants/site";

const PAGE_NAMES = [
  ...NAV_ITEMS,
  ...NAV_INTERNAL_ITEMS,
  ...NAV_FOOTER_ITEMS,
].reduce<Record<string, string>>((acc, item) => {
  acc[item.href] = item.label;
  return acc;
}, {});

function getPageName(pathname: string): string {
  // Exact match first
  if (PAGE_NAMES[pathname]) return PAGE_NAMES[pathname];
  // Match by prefix (e.g. /portals/123 → Portals)
  const match = Object.keys(PAGE_NAMES).find((key) =>
    pathname.startsWith(key + "/"),
  );
  return match ? PAGE_NAMES[match] : "";
}

export function AppHeader() {
  const pathname = usePathname();
  const pageName = getPageName(pathname);

  return (
    <header className="flex h-10 shrink-0 items-center gap-2 border-b border-border px-3">
      <SidebarTrigger size="icon" />

      {pageName && (
        <>
          <div className="flex items-center">
            <Separator orientation="vertical" className="h-3" />
          </div>

          <span className="text-sm font-medium leading-none">{pageName}</span>
        </>
      )}
    </header>
  );
}
