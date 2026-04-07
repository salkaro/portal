import { BriefcaseBusinessIcon, AppWindowIcon } from "lucide-react";

export function WelcomeStep() {
  return (
    <section className="space-y-3">
      <div className="flex items-start gap-2 rounded-md bg-muted/45 p-2.5">
        <BriefcaseBusinessIcon className="mt-0.5 size-4 shrink-0 text-primary" />
        <div>
          <p className="text-xs font-medium text-foreground">Workspace</p>
          <p className="text-[11px] text-muted-foreground">
            Keep your team in your existing tools.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-md bg-muted/45 p-2.5">
        <AppWindowIcon className="mt-0.5 size-4 shrink-0 text-primary" />
        <div>
          <p className="text-xs font-medium text-foreground">Portal</p>
          <p className="text-[11px] text-muted-foreground">
            Clients see one clean progress view.
          </p>
        </div>
      </div>
    </section>
  );
}
