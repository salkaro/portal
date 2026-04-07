import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";

const components = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="mt-10 mb-4 text-3xl font-bold tracking-tight" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="mt-10 mb-3 text-2xl font-semibold tracking-tight border-b border-border pb-2" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mt-8 mb-2 text-lg font-semibold" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="my-4 leading-7 text-foreground/90" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="my-4 ml-6 list-disc space-y-1.5 text-foreground/90" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="my-4 ml-6 list-decimal space-y-1.5 text-foreground/90" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="leading-7" {...props} />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="my-6 border-l-4 border-primary pl-5 italic text-muted-foreground"
      {...props}
    />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code
      className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-foreground"
      {...props}
    />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
      className="my-6 overflow-x-auto rounded-xl bg-muted p-5 text-sm font-mono leading-relaxed"
      {...props}
    />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
      {...props}
    />
  ),
  hr: () => <hr className="my-10 border-border" />,
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-6 w-full overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm" {...props} />
    </div>
  ),
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground" {...props} />
  ),
  tbody: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody className="divide-y divide-border" {...props} />
  ),
  tr: (props: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className="transition-colors hover:bg-muted/30" {...props} />
  ),
  th: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th className="px-4 py-3 text-left font-medium" {...props} />
  ),
  td: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td className="px-4 py-3 text-foreground/80" {...props} />
  ),
};

export function MdxContent({ source }: { source: string }) {
  return (
    <MDXRemote
      source={source}
      components={components}
      options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
    />
  );
}
