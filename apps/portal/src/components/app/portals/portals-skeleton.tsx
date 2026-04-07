import { Skeleton } from "@salkaro/ui";

export function PortalsSkeleton() {
  return (
    <section className="space-y-4 py-6 px-4">
      <div className="flex justify-end">
        <Skeleton className="h-9 w-28" />
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-44" />
        </div>
        <div className="space-y-3 p-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </section>
  );
}
