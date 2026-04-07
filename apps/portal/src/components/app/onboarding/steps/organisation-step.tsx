import {
  AppWindowIcon,
  ArrowRightIcon,
  Building2Icon,
  UsersIcon,
} from "lucide-react";
import { Input } from "@salkaro/ui";
import { Label } from "@salkaro/ui";
import { Tabs, TabsList, TabsTrigger } from "@salkaro/ui";

type OrganisationStepProps = {
  activeTab: "create" | "join";
  setActiveTab: (tab: "create" | "join") => void;
  organisationName: string;
  setOrganisationName: (value: string) => void;
  suggestedName: string;
  joinCode: string;
  setJoinCode: (value: string) => void;
  isSubmitting: boolean;
};

export function OrganisationStep({
  activeTab,
  setActiveTab,
  organisationName,
  setOrganisationName,
  suggestedName,
  joinCode,
  setJoinCode,
  isSubmitting,
}: OrganisationStepProps) {
  return (
    <section className="flex h-full flex-col space-y-3">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "create" | "join")}
        className="w-full"
      >
        <TabsList className="w-full">
          <TabsTrigger value="create" className="w-full">
            Create organisation
          </TabsTrigger>
          <TabsTrigger value="join" className="w-full">
            Join organisation
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="min-h-0 flex-1 overflow-hidden">
        <div
          className="flex h-full w-[200%] transition-transform duration-250 ease-out"
          style={{
            transform: `translateX(${activeTab === "create" ? "0%" : "-50%"})`,
          }}
        >
          <div className="flex h-full w-1/2 flex-col space-y-2 px-1.5 mb-1">
            <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-border/60 bg-muted/25 p-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Building2Icon className="size-6" />
                </div>
                <ArrowRightIcon className="size-4 text-muted-foreground" />
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <AppWindowIcon className="size-6" />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Start your own workspace.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-organisation-name">
                Organisation name
              </Label>
              <Input
                id="create-organisation-name"
                value={organisationName}
                onChange={(event) => setOrganisationName(event.target.value)}
                placeholder={suggestedName}
                disabled={isSubmitting}
                className="flex-1"
              />
            </div>
          </div>

          <div className="flex h-full w-1/2 flex-col space-y-2 px-1.5">
            <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-border/60 bg-muted/25 p-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <UsersIcon className="size-6" />
                </div>
                <ArrowRightIcon className="size-4 text-muted-foreground" />
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Building2Icon className="size-6" />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Use a code from your team.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="join-organisation-code">Join code</Label>
              <Input
                id="join-organisation-code"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value)}
                placeholder="Enter code"
                autoCapitalize="characters"
                disabled={isSubmitting}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
