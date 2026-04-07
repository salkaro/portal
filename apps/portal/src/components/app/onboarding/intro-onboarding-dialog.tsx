"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { TriangleAlertIcon } from "lucide-react";
import { limitInput } from "@/utils/string";
import { Button } from "@salkaro/ui";
import { INTEGRATION_CARD_DEFINITIONS } from "@/constants/integrations";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useOrganisation } from "@/hooks/use-organisation";
import { handleSignOut } from "@/lib/sign-out";
import { IntegrationsStep } from "@/components/app/onboarding/steps/integrations-step";
import { OrganisationStep } from "@/components/app/onboarding/steps/organisation-step";
import { WelcomeStep } from "@/components/app/onboarding/steps/welcome-step";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@salkaro/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@salkaro/ui";

type IntroOnboardingDialogProps = {
  open: boolean;
  initialStep?: number;
  orgDeleted?: boolean;
  onOrganisationCreated: () => void;
  onOrganisationJoined: () => void;
};

type IntroStep = {
  title: string;
  description: string;
};

const INTRO_STEPS: IntroStep[] = [
  {
    title: "Welcome to Salkaro Portal",
    description:
      "Share project progress with clients without exposing internal tools.",
  },
  {
    title: "Connect your tools",
    description: "Pull live updates into portals from your integrations.",
  },
  {
    title: "Set up organisation",
    description: "Create a new organisation or join one to continue.",
  },
];

function getJoinErrorMessage(rawMessage: string | null | undefined): string {
  const message = (rawMessage ?? "").toLowerCase();

  if (
    message.includes("organisation not found") ||
    message.includes("invalid code") ||
    message.includes("incorrect code")
  ) {
    return "Incorrect organisation code. Please check and try again.";
  }

  return rawMessage?.trim() || "Unable to join organisation.";
}

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

export function IntroOnboardingDialog({
  open,
  initialStep = 0,
  orgDeleted = false,
  onOrganisationCreated,
  onOrganisationJoined,
}: IntroOnboardingDialogProps) {
  const { user } = useCurrentUser();
  const { createOrganisation, joinByCode, refetch } = useOrganisation();

  const [stepIndex, setStepIndex] = useState(initialStep);
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [organisationName, setOrganisationName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmCreateOpen, setConfirmCreateOpen] = useState(false);
  const [confirmJoinOpen, setConfirmJoinOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [panelAnimationClass, setPanelAnimationClass] = useState(
    "animate-in fade-in-0 slide-in-from-right-2 duration-200",
  );

  const integrationPreview = useMemo(
    () => INTEGRATION_CARD_DEFINITIONS.slice(0, 4),
    [],
  );

  const suggestedName = useMemo(
    () =>
      getSuggestedOrganisationName(
        (user?.user_metadata?.full_name as string | undefined) ?? null,
        user?.email ?? null,
      ),
    [user],
  );

  const currentStep = INTRO_STEPS[stepIndex];
  const isLastStep = stepIndex === INTRO_STEPS.length - 1;
  const progressPercent = ((stepIndex + 1) / INTRO_STEPS.length) * 100;
  const circleRadius = 5;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const progressOffset =
    circleCircumference - (progressPercent / 100) * circleCircumference;
  const canCreateOrganisation = organisationName.trim().length > 0;
  const canJoinOrganisation = joinCode.trim().length > 0;

  function transitionToStep(nextStep: number) {
    if (
      isTransitioning ||
      nextStep < 0 ||
      nextStep > INTRO_STEPS.length - 1 ||
      nextStep === stepIndex
    ) {
      return;
    }

    const isForward = nextStep > stepIndex;
    setIsTransitioning(true);
    setPanelAnimationClass(
      isForward
        ? "animate-out fade-out-0 slide-out-to-left-2 duration-150"
        : "animate-out fade-out-0 slide-out-to-right-2 duration-150",
    );

    window.setTimeout(() => {
      setStepIndex(nextStep);
      setPanelAnimationClass(
        isForward
          ? "animate-in fade-in-0 slide-in-from-right-2 duration-200"
          : "animate-in fade-in-0 slide-in-from-left-2 duration-200",
      );

      window.setTimeout(() => {
        setIsTransitioning(false);
      }, 200);
    }, 150);
  }

  function handleNext() {
    transitionToStep(stepIndex + 1);
  }

  function handleBack() {
    transitionToStep(stepIndex - 1);
  }

  async function handleCreateOrganisation() {
    if (!canCreateOrganisation) {
      setErrorMessage("Enter an organisation name.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    const result = await createOrganisation({
      name: organisationName.trim(),
      iconUrl: null,
    });

    if (result.error) {
      setErrorMessage(result.error.message);
      setIsSubmitting(false);
      return;
    }

    toast.success("Organisation created.");
    await refetch();
    onOrganisationCreated();
    setIsSubmitting(false);
  }

  async function handleJoinOrganisation() {
    if (!canJoinOrganisation) {
      setErrorMessage("Enter a join code.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setErrorMessage("Enter a join code.");
      setIsSubmitting(false);
      return;
    }

    const result = await joinByCode({ code });

    if (result.error) {
      setErrorMessage(getJoinErrorMessage(result.error.message));
      setIsSubmitting(false);
      return;
    }

    toast.success("Joined organisation.");
    await refetch();
    onOrganisationJoined();
    setIsSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent
        className="flex flex-col sm:max-w-xl"
        showCloseButton={false}
      >
        <DialogHeader className="min-h-12">
          <div className="mb-1 flex items-center gap-2">
            <Image
              src="/brand/light/icon-white.svg"
              alt="Salkaro logo"
              width={20}
              height={20}
              className="rounded-md dark:hidden"
            />
            <Image
              src="/brand/dark/icon-black.svg"
              alt="Salkaro logo"
              width={20}
              height={20}
              className="hidden rounded-md dark:block"
            />
            <DialogTitle>
              {orgDeleted
                ? "Rejoin or create an organisation"
                : currentStep.title}
            </DialogTitle>
          </div>
          <DialogDescription>
            {orgDeleted
              ? "Create a new workspace or join an existing one to continue."
              : currentStep.description}
          </DialogDescription>
        </DialogHeader>

        {orgDeleted && (
          <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
            <TriangleAlertIcon className="mt-px size-3.5 shrink-0 text-foreground" />
            <p>
              Your organisation no longer exists. You can create a new one or
              join another.
            </p>
          </div>
        )}

        <div className="h-50 overflow-hidden">
          <div className={panelAnimationClass} key={stepIndex}>
            {stepIndex === 0 && <WelcomeStep />}

            {stepIndex === 1 && (
              <IntegrationsStep integrations={integrationPreview} />
            )}

            {stepIndex === 2 && (
              <OrganisationStep
                activeTab={activeTab}
                setActiveTab={(tab) => {
                  setActiveTab(tab);
                  setErrorMessage("");
                }}
                organisationName={organisationName}
                setOrganisationName={(value) =>
                  setOrganisationName(limitInput(value, 64))
                }
                suggestedName={suggestedName}
                joinCode={joinCode}
                setJoinCode={(value) => setJoinCode(limitInput(value, 16))}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        </div>

        {stepIndex === 2 && errorMessage && (
          <p className="text-xs text-destructive">{errorMessage}</p>
        )}

        {!orgDeleted && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                <circle
                  cx="7"
                  cy="7"
                  r={circleRadius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-primary/25"
                />
                <circle
                  cx="7"
                  cy="7"
                  r={circleRadius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={progressOffset}
                  transform="rotate(-90 7 7)"
                  className="text-primary"
                  style={{ transition: "stroke-dashoffset 280ms ease" }}
                />
              </svg>
              <p className="text-xs font-medium text-muted-foreground">
                Step {stepIndex + 1} of {INTRO_STEPS.length}
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-between gap-2">
          {orgDeleted || stepIndex === 0 ? (
            <Button
              variant="outline"
              onClick={() => void handleSignOut(user?.id)}
              disabled={isSubmitting}
            >
              Sign out
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting || isTransitioning}
            >
              Back
            </Button>
          )}
          {isLastStep ? (
            activeTab === "create" ? (
              <>
                <Button
                  onClick={() => setConfirmCreateOpen(true)}
                  disabled={
                    isSubmitting || isTransitioning || !canCreateOrganisation
                  }
                >
                  {isSubmitting ? "Creating..." : "Create organisation"}
                </Button>

                <AlertDialog
                  open={confirmCreateOpen}
                  onOpenChange={setConfirmCreateOpen}
                >
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Create organisation?</AlertDialogTitle>
                      <AlertDialogDescription>
                        You can rename this organisation later in settings.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isSubmitting}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        disabled={isSubmitting || !canCreateOrganisation}
                        onClick={(event) => {
                          event.preventDefault();
                          void handleCreateOrganisation();
                          setConfirmCreateOpen(false);
                        }}
                      >
                        Confirm create
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setConfirmJoinOpen(true)}
                  disabled={
                    isSubmitting || isTransitioning || !canJoinOrganisation
                  }
                  variant="outline"
                >
                  {isSubmitting ? "Joining..." : "Join organisation"}
                </Button>

                <AlertDialog
                  open={confirmJoinOpen}
                  onOpenChange={setConfirmJoinOpen}
                >
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Join organisation?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Your request will be sent and you will need approval
                        before you can access this organisation.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isSubmitting}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        disabled={isSubmitting || !canJoinOrganisation}
                        onClick={(event) => {
                          event.preventDefault();
                          void handleJoinOrganisation();
                          setConfirmJoinOpen(false);
                        }}
                      >
                        Confirm join
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )
          ) : (
            <Button onClick={handleNext} disabled={isTransitioning}>
              Next
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
