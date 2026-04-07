export const ONBOARDING_STATE_VERSION = 1;
export const ONBOARDING_STORAGE_KEY_PREFIX = "onboarding_state";

export const ONBOARDING_STAGES = {
    INTRO_PENDING: "intro_pending",
    INTRO_COMPLETED: "intro_completed",
    ORG_CREATED_TOUR_PENDING: "org_created_tour_pending",
    ORG_CREATED_TOUR_COMPLETED: "org_created_tour_completed",
    JOINED_ORG_SKIP: "joined_org_skip",
    ORG_DELETED: "org_deleted",
} as const;

export type OnboardingStage =
    (typeof ONBOARDING_STAGES)[keyof typeof ONBOARDING_STAGES];

export const ONBOARDING_SOURCE_ACTIONS = {
    CREATE: "create",
    JOIN: "join",
} as const;

export type OnboardingSourceAction =
    (typeof ONBOARDING_SOURCE_ACTIONS)[keyof typeof ONBOARDING_SOURCE_ACTIONS];

export const ONBOARDING_TOUR_TARGETS = {
    PORTALS: "portals",
    INTEGRATIONS: "integrations",
} as const;

export type OnboardingTourTarget =
    (typeof ONBOARDING_TOUR_TARGETS)[keyof typeof ONBOARDING_TOUR_TARGETS];

export const ONBOARDING_TOUR_TARGET_ATTRIBUTE = "data-onboarding-target";
