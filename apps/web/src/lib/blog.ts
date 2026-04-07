import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const POSTS_DIR = path.join(process.cwd(), "src/content/blog");

export type PostFrontmatter = {
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  coverImage?: string;
  draft?: boolean;
};

export type Post = PostFrontmatter & {
  slug: string;
  readingTime: string;
  content: string;
};

export type PostMeta = Omit<Post, "content">;

function ensurePostsDir() {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }
}

export function getAllPosts(): PostMeta[] {
  ensurePostsDir();

  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));

  const posts = files
    .map((filename) => {
      const slug = filename.replace(/\.mdx?$/, "");
      const raw = fs.readFileSync(path.join(POSTS_DIR, filename), "utf-8");
      const { data, content } = matter(raw);
      const fm = data as PostFrontmatter;

      if (fm.draft) return null;

      return {
        ...fm,
        slug,
        readingTime: readingTime(content).text,
      } satisfies PostMeta;
    })
    .filter((p): p is PostMeta => p !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

export function getPost(slug: string): Post | null {
  ensurePostsDir();

  const extensions = [".mdx", ".md"];
  let raw: string | null = null;

  for (const ext of extensions) {
    const filepath = path.join(POSTS_DIR, `${slug}${ext}`);
    if (fs.existsSync(filepath)) {
      raw = fs.readFileSync(filepath, "utf-8");
      break;
    }
  }

  if (!raw) return null;

  const { data, content } = matter(raw);
  const fm = data as PostFrontmatter;

  if (fm.draft) return null;

  return {
    ...fm,
    slug,
    readingTime: readingTime(content).text,
    content,
  };
}

export function getPostsByTag(tag: string): PostMeta[] {
  return getAllPosts().filter((p) => p.tags.includes(tag));
}

export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tags = new Set(posts.flatMap((p) => p.tags));
  return Array.from(tags).sort();
}
