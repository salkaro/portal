import { ThemeToggle } from "@/components/theme/theme-toggle";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Appearance Settings",
  "Customize the look and theme for your portal workspace.",
);

export default function SettingsAppearancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-medium">Appearance</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Choose how Portal looks on your device.
        </p>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium">Theme</p>
        <ThemeToggle />
      </div>
    </div>
  );
}
