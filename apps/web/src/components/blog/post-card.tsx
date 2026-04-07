import Link from "next/link";
import { CalendarIcon, ClockIcon } from "lucide-react";
import { Badge } from "@salkaro/ui";
import type { PostMeta } from "@/lib/blog";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const TAG_COLOURS: Record<string, string> = {
  "agency":        "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  "product":       "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "client-management": "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  "tips":          "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "integrations":  "bg-orange-500/10 text-orange-600 dark:text-orange-400",
};

function TagBadge({ tag }: { tag: string }) {
  const colour = TAG_COLOURS[tag] ?? "bg-primary/10 text-primary";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colour}`}>
      {tag}
    </span>
  );
}

export function FeaturedPostCard({ post }: { post: PostMeta }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Cover band */}
      <div className="h-56 sm:h-64 bg-gradient-to-br from-primary/20 via-primary/10 to-muted flex items-end p-6">
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight group-hover:text-primary transition-colors line-clamp-2">
          {post.title}
        </h2>
        <p className="mt-3 text-muted-foreground leading-relaxed line-clamp-3">
          {post.description}
        </p>
        <div className="mt-5 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarIcon className="size-3.5" />
            {formatDate(post.date)}
          </span>
          <span className="flex items-center gap-1.5">
            <ClockIcon className="size-3.5" />
            {post.readingTime}
          </span>
          <span className="font-medium">{post.author}</span>
        </div>
      </div>
    </Link>
  );
}

export function PostCard({ post }: { post: PostMeta }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Cover band */}
      <div className="h-36 bg-gradient-to-br from-primary/15 via-primary/5 to-muted flex items-end p-4">
        <div className="flex flex-wrap gap-1.5">
          {post.tags.slice(0, 2).map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
      </div>

      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-semibold tracking-tight group-hover:text-primary transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2 flex-1">
          {post.description}
        </p>
        <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarIcon className="size-3" />
            {formatDate(post.date)}
          </span>
          <span className="flex items-center gap-1">
            <ClockIcon className="size-3" />
            {post.readingTime}
          </span>
        </div>
      </div>
    </Link>
  );
}
