import Link from "next/link";
import { Button } from "@salkaro/ui";
import { ROUTES } from "@/constants/routes";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Page Not Found",
  "The page you are looking for does not exist in Salkaro Portal.",
);

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center px-4">
      <p className="text-xs font-medium text-muted-foreground">404</p>
      <h1 className="text-lg font-semibold">Page not found</h1>
      <p className="text-xs text-muted-foreground max-w-xs">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Button asChild size="sm">
        <Link className="text-xs" href={ROUTES.DASHBOARD}>Go to dashboard</Link>
      </Button>
    </div>
  );
}
