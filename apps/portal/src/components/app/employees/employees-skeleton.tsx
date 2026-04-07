import { Skeleton } from "@salkaro/ui";
import { Separator } from "@salkaro/ui";

export function EmployeesSkeleton() {
  return (
    <div className="space-y-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-8 w-28" />
      </div>
      <Separator />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
