import { pageMetadata } from "@/lib/metadata";
import { OrganisationSettingsContent } from "@/components/app/settings/organisation/organisation-settings-content";

export const metadata = pageMetadata(
  "Organisation Settings",
  "Manage organisation details for your Salkaro Portal account.",
);

export default function SettingsOrganisationPage() {
  return <OrganisationSettingsContent />;
}
