"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function TagFilter({ tags }: { tags: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("tag");

  function select(tag: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (tag) {
      params.set("tag", tag);
    } else {
      params.delete("tag");
    }
    router.push(`/blog?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => select(null)}
        className={cn(
          "rounded-full px-3 py-1 text-sm font-medium transition-colors",
          !active
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:text-foreground",
        )}
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => select(tag)}
          className={cn(
            "rounded-full px-3 py-1 text-sm font-medium transition-colors",
            active === tag
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground",
          )}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
