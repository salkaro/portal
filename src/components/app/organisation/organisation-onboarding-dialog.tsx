"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { limitInput } from "@/utils/string";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useOrganisation } from "@/hooks/use-organisation";

function getSuggestedOrganisationName(
  fullName: string | null | undefined,
  email: string | null | undefined,
): string {
  const cleanedName = fullName?.trim();
  if (cleanedName) return `${cleanedName}'s Organisation`;

  const emailPrefix = email?.split("@")[0];
  if (emailPrefix) return `${emailPrefix}'s Organisation`;

  return "My Organisation";
}

export function OrganisationOnboardingDialog() {
  const { user, loading: userLoading } = useCurrentUser();
  const {
    organisation,
    loading: organisationLoading,
    error: organisationError,
    createOrganisation,
    joinByCode,
  } = useOrganisation();

  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [organisationName, setOrganisationName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const suggestedName = useMemo(
    () =>
      getSuggestedOrganisationName(
        (user?.user_metadata?.full_name as string | undefined) ?? null,
        user?.email ?? null,
      ),
    [user],
  );

  const shouldOpen =
    !userLoading &&
    !organisationLoading &&
    !organisationError &&
    Boolean(user) &&
    organisation === null;

  async function handleCreateOrganisation() {
    setIsSubmitting(true);
    setErrorMessage("");

    const result = await createOrganisation({
      name: organisationName.trim() || suggestedName,
      iconUrl: null,
    });

    if (result.error) {
      setErrorMessage(result.error.message);
      setIsSubmitting(false);
      return;
    }

    toast.success("Organisation created.");
    setIsSubmitting(false);
  }

  async function handleJoinOrganisation() {
    setIsSubmitting(true);
    setErrorMessage("");

    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setErrorMessage("Enter an organisation code to continue.");
      setIsSubmitting(false);
      return;
    }

    const result = await joinByCode({ code });
    if (result.error) {
      setErrorMessage(result.error.message);
      setIsSubmitting(false);
      return;
    }

    toast.success("Joined organisation.");
    setIsSubmitting(false);
  }

  return (
    <Dialog open={shouldOpen} onOpenChange={() => undefined}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Set up your organisation</DialogTitle>
          <DialogDescription>
            You need to join an organisation or create one before using the app.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value as "create" | "join");
            setErrorMessage("");
          }}
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

          <TabsContent value="create" className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="create-organisation-name">
                Organisation name
              </Label>
              <Input
                id="create-organisation-name"
                value={organisationName}
                onChange={(event) => setOrganisationName(limitInput(event.target.value, 64))}
                placeholder={suggestedName}
                disabled={isSubmitting}
              />
            </div>
            <Button
              onClick={handleCreateOrganisation}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Creating..." : "Create organisation"}
            </Button>
          </TabsContent>

          <TabsContent value="join" className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="join-organisation-code">Join code</Label>
              <Input
                id="join-organisation-code"
                value={joinCode}
                onChange={(event) => setJoinCode(limitInput(event.target.value, 16))}
                placeholder="Enter code"
                autoCapitalize="characters"
                disabled={isSubmitting}
              />
            </div>
            <Button
              onClick={handleJoinOrganisation}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Joining..." : "Join organisation"}
            </Button>
          </TabsContent>
        </Tabs>

        {(userLoading || organisationLoading) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Spinner className="size-3.5" />
            Checking organisation membership...
          </div>
        )}

        {errorMessage && (
          <p className="text-xs text-destructive">{errorMessage}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
