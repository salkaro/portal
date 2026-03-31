// Redirected straight to login
import { pageMetadata } from "@/lib/metadata";
import { redirect } from "next/navigation";

export const metadata = pageMetadata(
  "Home",
  "Client portal workspace for agencies and their customers.",
);

export default function Home() {
  redirect("/login");
}
