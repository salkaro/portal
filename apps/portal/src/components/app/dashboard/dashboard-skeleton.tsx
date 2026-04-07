import { Skeleton } from "@salkaro/ui";

export function DashboardSkeleton() {
  return (
    <section className="space-y-4 py-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>

      <Skeleton className="h-80 w-full" />
    </section>
  );
}
