"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SETTINGS_NAV_ITEMS } from "@/constants/routes";

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {SETTINGS_NAV_ITEMS.map(({ label, href }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
