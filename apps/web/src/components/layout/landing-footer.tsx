import Image from "next/image";
import Link from "next/link";

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://portal.salkaro.com";

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-muted/30 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <Image
              src="/brand/light/icon-white.svg"
              alt="Salkaro Portal"
              width={22}
              height={22}
              className="rounded-md"
            />
            <span className="text-xs text-muted-foreground font-medium">Salkaro Portal</span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href={`${PORTAL_URL}/login`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link href={`${PORTAL_URL}/waitlist`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Waitlist
            </Link>
            <Link href={`${PORTAL_URL}/demo`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Demo
            </Link>
            <Link href="#faq" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </Link>
          </nav>

          {/* Legal */}
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Salkaro. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
