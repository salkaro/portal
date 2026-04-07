import { LoginForm } from "@/components/auth/login-form";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Login",
  "Sign in to your Salkaro Portal account.",
);

export default function LoginPage() {
  return <LoginForm />;
}
