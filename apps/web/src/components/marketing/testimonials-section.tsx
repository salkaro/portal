const TESTIMONIALS = [
  {
    quote:
      "We used to spend 2–3 hours a week on client update emails. Now we just send the portal link. Clients love it.",
    name: "Sarah Mitchell",
    role: "Founder",
    company: "Folio Agency",
    initials: "SM",
  },
  {
    quote:
      "Our clients actually know what's happening on their projects now. It's changed how they perceive us — way more professional.",
    name: "James Okafor",
    role: "Project Lead",
    company: "Ctrl Studio",
    initials: "JO",
  },
  {
    quote:
      "The Monday.com integration was seamless. Set up our first portal in under 10 minutes and shared it the same day.",
    name: "Priya Nair",
    role: "Operations Manager",
    company: "Aves Digital",
    initials: "PN",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Agencies are already saving hours every week
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="rounded-xl border border-border bg-card p-6 space-y-4 flex flex-col"
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className="size-3.5 fill-primary text-primary" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                  {t.initials}
                </div>
                <div>
                  <div className="text-xs font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.role}, {t.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
