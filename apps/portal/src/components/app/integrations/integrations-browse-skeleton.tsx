import { Skeleton } from "@salkaro/ui";

export function IntegrationsBrowseSkeleton() {
  return (
    <section className="space-y-4 py-6">
      <div className="flex items-start gap-3">
        <Skeleton className="h-9 w-40" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-52 w-full" />
      </div>
    </section>
  );
}
