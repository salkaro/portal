"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ONBOARDING_SOURCE_ACTIONS,
    ONBOARDING_STAGES,
    ONBOARDING_STATE_VERSION,
    ONBOARDING_STORAGE_KEY_PREFIX,
    type OnboardingSourceAction,
    type OnboardingStage,
} from "@/constants/onboarding";
import { useCurrentUser } from "@/hooks/use-current-user";

type PersistedOnboardingState = {
    version: number;
    stage: OnboardingStage;
    sourceAction: OnboardingSourceAction | null;
    updatedAt: string;
};

type UseOnboardingStateResult = {
    stage: OnboardingStage | null;
    sourceAction: OnboardingSourceAction | null;
    loading: boolean;
    setStage: (
        stage: OnboardingStage,
        sourceAction?: OnboardingSourceAction | null,
    ) => void;
    reset: () => void;
};

function getStorageKey(userId: string): string {
    return `${ONBOARDING_STORAGE_KEY_PREFIX}:${userId}`;
}

function isValidStage(value: unknown): value is OnboardingStage {
    return Object.values(ONBOARDING_STAGES).includes(value as OnboardingStage);
}

function isValidSourceAction(value: unknown): value is OnboardingSourceAction {
    return Object.values(ONBOARDING_SOURCE_ACTIONS).includes(
        value as OnboardingSourceAction,
    );
}

function parsePersistedState(raw: string | null): PersistedOnboardingState | null {
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw) as Partial<PersistedOnboardingState>;
        if (
            parsed.version !== ONBOARDING_STATE_VERSION ||
            !isValidStage(parsed.stage)
        ) {
            return null;
        }

        return {
            version: parsed.version,
            stage: parsed.stage,
            sourceAction: isValidSourceAction(parsed.sourceAction)
                ? parsed.sourceAction
                : null,
            updatedAt:
                typeof parsed.updatedAt === "string"
                    ? parsed.updatedAt
                    : new Date().toISOString(),
        };
    } catch {
        return null;
    }
}

export function useOnboardingState(): UseOnboardingStateResult {
    const { user, loading: userLoading } = useCurrentUser();
    const userId = user?.id ?? null;

    const [stage, setStageState] = useState<OnboardingStage | null>(null);
    const [sourceAction, setSourceAction] =
        useState<OnboardingSourceAction | null>(null);
    const [loading, setLoading] = useState(true);

    const storageKey = useMemo(
        () => (userId ? getStorageKey(userId) : null),
        [userId],
    );

    useEffect(() => {
        if (userLoading) return;

        let cancelled = false;

        const run = async () => {
            await Promise.resolve();

            if (cancelled) return;

            if (!storageKey) {
                setStageState(null);
                setSourceAction(null);
                setLoading(false);
                return;
            }

            const parsed = parsePersistedState(localStorage.getItem(storageKey));

            if (!parsed) {
                setStageState(ONBOARDING_STAGES.INTRO_PENDING);
                setSourceAction(null);
                setLoading(false);
                return;
            }

            setStageState(parsed.stage);
            setSourceAction(parsed.sourceAction);
            setLoading(false);
        };

        void run();

        return () => {
            cancelled = true;
        };
    }, [storageKey, userLoading]);

    const setStage = useCallback(
        (nextStage: OnboardingStage, nextSourceAction?: OnboardingSourceAction | null) => {
            setStageState(nextStage);

            const resolvedSourceAction =
                nextSourceAction !== undefined ? nextSourceAction : sourceAction;

            setSourceAction(resolvedSourceAction ?? null);

            if (!storageKey) return;

            const payload: PersistedOnboardingState = {
                version: ONBOARDING_STATE_VERSION,
                stage: nextStage,
                sourceAction: resolvedSourceAction ?? null,
                updatedAt: new Date().toISOString(),
            };

            localStorage.setItem(storageKey, JSON.stringify(payload));
        },
        [sourceAction, storageKey],
    );

    const reset = useCallback(() => {
        setStageState(ONBOARDING_STAGES.INTRO_PENDING);
        setSourceAction(null);

        if (!storageKey) return;

        localStorage.removeItem(storageKey);
    }, [storageKey]);

    return {
        stage,
        sourceAction,
        loading,
        setStage,
        reset,
    };
}
