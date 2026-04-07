import { Skeleton } from "@salkaro/ui";

export function ClientsSkeleton() {
  return (
    <section className="space-y-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-28" />
      </div>

      <Skeleton className="h-12 w-full" />

      <div className="space-y-3">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    </section>
  );
}
