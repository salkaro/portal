import { WaitlistForm } from "@/components/auth/waitlist-form";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Join the Waitlist",
  "Get early access to Salkaro Portal — the client portal software built for agencies.",
);

export default function WaitlistPage() {
  return <WaitlistForm />;
}
