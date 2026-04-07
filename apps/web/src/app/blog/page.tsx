import { Suspense } from "react";
import type { Metadata } from "next";
import { getAllPosts, getAllTags } from "@/lib/blog";
import { FeaturedPostCard, PostCard } from "@/components/blog/post-card";
import { TagFilter } from "@/components/blog/tag-filter";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Insights on client management, agency operations, and building better client relationships.",
};

export default function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  return (
    <Suspense>
      <BlogPageInner searchParams={searchParams} />
    </Suspense>
  );
}

async function BlogPageInner({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const allPosts = getAllPosts();
  const tags = getAllTags();

  const posts = tag
    ? allPosts.filter((p) => p.tags.includes(tag))
    : allPosts;

  const [featured, ...rest] = posts;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Blog</h1>
        <p className="mt-3 text-muted-foreground max-w-xl">
          Insights on client management, agency operations, and building better
          client relationships.
        </p>
      </div>

      {/* Tag filter */}
      {tags.length > 0 && (
        <div className="mb-10">
          <TagFilter tags={tags} />
        </div>
      )}

      {posts.length === 0 && (
        <div className="py-20 text-center text-muted-foreground">
          No posts found{tag ? ` for tag "${tag}"` : ""}.
        </div>
      )}

      {/* Featured post */}
      {featured && (
        <div className="mb-10">
          <FeaturedPostCard post={featured} />
        </div>
      )}

      {/* Post grid */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
