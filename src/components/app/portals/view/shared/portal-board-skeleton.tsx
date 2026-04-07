import { Skeleton } from "@/components/ui/skeleton";

export function PortalBoardSkeleton() {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar skeleton */}
      <div className="w-64 shrink-0 border-r border-border p-4 space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-52" />
        <div className="space-y-1 pt-2">
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-8 w-full rounded-md" />
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="h-14 border-b border-border flex items-center gap-3 px-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-48" />
          <div className="ml-auto flex gap-2">
            <Skeleton className="h-8 w-28 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <Skeleton className="h-44 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
