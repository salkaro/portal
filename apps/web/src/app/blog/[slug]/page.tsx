import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, CalendarIcon, ClockIcon, TagIcon } from "lucide-react";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import { getAllPosts, getPost } from "@/lib/blog";
import { MdxContent } from "@/components/blog/mdx-content";
import { PostCard } from "@/components/blog/post-card";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const mdxSource = await serialize(post.content, {
    mdxOptions: { remarkPlugins: [remarkGfm] },
  });

  // Related: other posts sharing at least one tag, excluding current
  const allPosts = getAllPosts();
  const related = allPosts
    .filter(
      (p) =>
        p.slug !== slug && p.tags.some((t) => post.tags.includes(t)),
    )
    .slice(0, 2);

  // If not enough related, fill with recents
  const recents = allPosts
    .filter((p) => p.slug !== slug && !related.find((r) => r.slug === p.slug))
    .slice(0, 2 - related.length);

  const morePosts = [...related, ...recents];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-20">
      {/* Back link */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
      >
        <ArrowLeftIcon className="size-3.5" />
        Back to blog
      </Link>

      <div className="flex flex-col lg:flex-row gap-16">
        {/* Article */}
        <article className="flex-1 min-w-0">
          {/* Header */}
          <header className="mb-10">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-5">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${tag}`}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  <TagIcon className="size-3" />
                  {tag}
                </Link>
              ))}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
              {post.title}
            </h1>

            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              {post.description}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-y border-border py-4">
              <span className="font-medium text-foreground">{post.author}</span>
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="size-3.5" />
                {formatDate(post.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <ClockIcon className="size-3.5" />
                {post.readingTime}
              </span>
            </div>
          </header>

          {/* MDX body */}
          <div className="max-w-2xl">
            <MdxContent source={mdxSource} />
          </div>
        </article>

        {/* Sidebar — sticky on desktop */}
        <aside className="lg:w-64 shrink-0">
          <div className="lg:sticky lg:top-20 space-y-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                About the author
              </p>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  {post.author.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-medium">{post.author}</p>
                  <p className="text-xs text-muted-foreground">Salkaro</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/blog?tag=${tag}`}
                    className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* More posts */}
      {morePosts.length > 0 && (
        <section className="mt-20 pt-10 border-t border-border">
          <h2 className="text-lg font-semibold mb-6">More posts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {morePosts.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
