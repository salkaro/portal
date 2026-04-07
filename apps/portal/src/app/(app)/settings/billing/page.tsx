import { BillingContent } from "@/components/app/settings/billing/billing-content";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Billing Settings",
  "View your current plan, pricing options, and billing history.",
);

export default function SettingsBillingPage() {
  return <BillingContent />;
}
