import type { ReactNode } from "react";
import { LockKeyholeIcon, SparklesIcon, BuildingIcon } from "lucide-react";

type NotAuthorisedProps = {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
};

export function NotAuthorised({
  icon,
  title,
  description,
  action,
}: NotAuthorisedProps) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
        {icon ?? <LockKeyholeIcon className="size-5" />}
      </div>
      <div className="space-y-1 max-w-xs">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function NotAuthorisedUpgrade({ action }: { action?: ReactNode }) {
  return (
    <NotAuthorised
      icon={<SparklesIcon className="size-5" />}
      title="Upgrade required"
      description="Your current plan does not include this feature. Upgrade to unlock it."
      action={action}
    />
  );
}

export function NotAuthorisedNoOrganisation({ action }: { action?: ReactNode }) {
  return (
    <NotAuthorised
      icon={<BuildingIcon className="size-5" />}
      title="No organisation"
      description="You need to join or create an organisation before accessing this page."
      action={action}
    />
  );
}
