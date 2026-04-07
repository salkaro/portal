import { ResetForm } from "@/components/auth/reset-form";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Reset Password",
  "Reset your Salkaro Portal account password.",
);

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ error_code?: string; verified?: string }>;
}) {
  const { error_code, verified } = await searchParams;

  return <ResetForm linkError={error_code ?? null} isUpdateMode={verified === '1'} />;
}
