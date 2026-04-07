import Image from "next/image";

const INTEGRATIONS = [
  { name: "Monday.com", slug: "monday" },
  { name: "Linear", slug: "linear" },
];

export function LogoStrip() {
  return (
    <section className="border-y border-border bg-muted/30 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground mb-8">
          Works with your existing tools
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {INTEGRATIONS.map((integration) => (
            <div key={integration.slug} className="flex items-center gap-2.5 opacity-60 hover:opacity-100 transition-opacity">
              <Image
                src={`/integrations/dark/${integration.slug}.svg`}
                alt={`${integration.name} integration`}
                width={120}
                height={28}
                className="h-6 w-auto dark:hidden"
              />
              <Image
                src={`/integrations/light/${integration.slug}.svg`}
                alt={`${integration.name} integration`}
                width={120}
                height={28}
                className="h-6 w-auto hidden dark:block"
              />
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          More integrations coming soon
        </p>
      </div>
    </section>
  );
}
