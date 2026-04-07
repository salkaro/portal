import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "@/styles/globals.css";
import { cn } from "@/lib/utils";
import { LandingNav } from "@/components/layout/landing-nav";
import { LandingFooter } from "@/components/layout/landing-footer";
import { Analytics } from "@/components/analytics";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://salkaro.com";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Salkaro Portal — Client Portal Software for Agencies",
    template: "%s | Salkaro Portal",
  },
  description:
    "Share live project updates with clients in minutes. Connect Monday.com, Linear, or Jira and give clients a branded portal — no login required.",
  keywords: [
    "client portal software",
    "agency client portal",
    "project status portal",
    "client project tracking",
    "white label client portal",
    "monday.com client portal",
    "linear client portal",
    "share project updates with clients",
    "client portal no login",
    "agency reporting software",
  ],
  openGraph: {
    type: "website",
    siteName: "Salkaro Portal",
    title: "Salkaro Portal — Client Portal Software for Agencies",
    description:
      "Share live project updates with clients in minutes. Connect Monday.com, Linear, or Jira and give clients a branded portal — no login required.",
    url: APP_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Salkaro Portal — Client Portal Software for Agencies",
    description:
      "Share live project updates with clients in minutes. Connect Monday.com, Linear, or Jira and give clients a branded portal — no login required.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased",
        geistSans.variable,
        geistMono.variable,
        inter.variable,
        "font-sans",
      )}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Analytics />
        <LandingNav />
        {children}
        <LandingFooter />
      </body>
    </html>
  );
}
