"use client";

import { useEffect } from "react";
import {
  ONBOARDING_SOURCE_ACTIONS,
  ONBOARDING_STAGES,
} from "@/constants/onboarding";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useOnboardingState } from "@/hooks/use-onboarding-state";
import { useOrganisation } from "@/hooks/use-organisation";
import { IntroOnboardingDialog } from "./intro-onboarding-dialog";
import { PostCreateTour } from "@/components/app/onboarding/post-create-tour";

export function OnboardingOrchestrator() {
  const { user, loading: userLoading } = useCurrentUser();
  const { organisation, loading: organisationLoading } = useOrganisation();
  const { stage, loading: onboardingLoading, setStage } = useOnboardingState();

  useEffect(() => {
    if (!user || !organisation || !stage) return;

    if (stage === ONBOARDING_STAGES.INTRO_PENDING) {
      setStage(ONBOARDING_STAGES.INTRO_COMPLETED, null);
    }
  }, [organisation, setStage, stage, user]);

  if (userLoading || organisationLoading || onboardingLoading) {
    return null;
  }

  if (!user || !stage) {
    return null;
  }

  const hasOrganisation = Boolean(organisation);
  const showIntro =
    !hasOrganisation &&
    (stage === ONBOARDING_STAGES.INTRO_PENDING ||
      stage === ONBOARDING_STAGES.INTRO_COMPLETED);
  const introInitialStep = stage === ONBOARDING_STAGES.INTRO_COMPLETED ? 2 : 0;
  const showPostCreateTour =
    hasOrganisation && stage === ONBOARDING_STAGES.ORG_CREATED_TOUR_PENDING;

  return (
    <>
      <IntroOnboardingDialog
        key={`intro-${showIntro ? "open" : "closed"}-${introInitialStep}`}
        open={showIntro}
        initialStep={introInitialStep}
        onOrganisationCreated={() => {
          setStage(
            ONBOARDING_STAGES.ORG_CREATED_TOUR_PENDING,
            ONBOARDING_SOURCE_ACTIONS.CREATE,
          );
        }}
        onOrganisationJoined={() => {
          setStage(
            ONBOARDING_STAGES.JOINED_ORG_SKIP,
            ONBOARDING_SOURCE_ACTIONS.JOIN,
          );
        }}
      />

      <PostCreateTour
        open={showPostCreateTour}
        onComplete={() => {
          setStage(ONBOARDING_STAGES.ORG_CREATED_TOUR_COMPLETED);
        }}
        onSkip={() => {
          setStage(ONBOARDING_STAGES.ORG_CREATED_TOUR_COMPLETED);
        }}
      />
    </>
  );
}
