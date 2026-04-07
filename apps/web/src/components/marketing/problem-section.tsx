import { MailIcon, TableIcon, KeyIcon } from "lucide-react";

const PROBLEMS = [
  {
    icon: MailIcon,
    title: "Reply-all status threads",
    description:
      "Clients emailing any updates? every few days. You spend more time writing status emails than doing the actual work.",
  },
  {
    icon: TableIcon,
    title: "Manual spreadsheet exports",
    description:
      "Copying project data into a PDF or spreadsheet every week just so clients have something to look at. It's outdated the moment you send it.",
  },
  {
    icon: KeyIcon,
    title: "Tool access they never use",
    description:
      "Giving clients a Monday.com login they log into once, get confused, and then go back to emailing you.",
  },
];

export function ProblemSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Client communication is broken
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Most agencies are stuck in the same loop — and it wastes hours every week.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROBLEMS.map((problem) => (
            <div
              key={problem.title}
              className="rounded-xl border border-border bg-card p-6 space-y-3"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10">
                <problem.icon className="size-4 text-destructive" />
              </div>
              <h3 className="font-semibold text-sm">{problem.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {problem.description}
              </p>
            </div>
          ))}
        </div>

        <p className="text-center mt-10 text-sm text-muted-foreground italic">
          Sound familiar? There&apos;s a better way.
        </p>
      </div>
    </section>
  );
}
