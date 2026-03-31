import { pageMetadata } from "@/lib/metadata";
import { GeneralSettingsContent } from "@/components/app/settings/general/general-settings-content";

export const metadata = pageMetadata(
  "Settings",
  "Manage your Salkaro Portal account and workspace settings.",
);

export default function SettingsGeneralPage() {
  return <GeneralSettingsContent />;
}
