import { SignupForm } from "@/components/auth/signup-form";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Get Started",
  "Create your Salkaro Portal account and start onboarding your agency clients.",
);

export default function GetStartedPage() {
  return <SignupForm />;
}
