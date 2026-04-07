"use client";

import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@salkaro/ui";
import { Toaster } from "@salkaro/ui";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster />
    </ThemeProvider>
  );
}
