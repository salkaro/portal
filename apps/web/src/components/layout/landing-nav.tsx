"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MenuIcon, XIcon } from "lucide-react";
import { Button } from "@salkaro/ui";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Demo", href: "#demo" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Blog", href: "/blog" },
];

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://portal.salkaro.com";

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/brand/light/icon-white.svg"
            alt="Salkaro Portal"
            width={28}
            height={28}
            className="rounded-lg"
          />
          <span className="text-sm font-semibold tracking-tight">Salkaro Portal</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`${PORTAL_URL}/login`} onClick={() => trackEvent("signin_click", { location: "nav" })}>Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`${PORTAL_URL}/waitlist`} onClick={() => trackEvent("waitlist_click", { location: "nav" })}>Join waitlist</Link>
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="md:hidden rounded-md p-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 pb-4 pt-2 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`${PORTAL_URL}/login`} onClick={() => trackEvent("signin_click", { location: "nav" })}>Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={`${PORTAL_URL}/waitlist`} onClick={() => trackEvent("waitlist_click", { location: "nav" })}>Join waitlist</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
