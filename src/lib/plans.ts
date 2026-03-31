import { PLAN_LIMITS, PLANS } from '@/constants/plans'

export type PlanTier = keyof typeof PLAN_LIMITS

const PLAN_RANK: Record<PlanTier, number> = {
    [PLANS.FREE]: 0,
    [PLANS.PRO]: 1,
}

export function hasRequiredPlan(userPlan: PlanTier, requiredPlan: PlanTier): boolean {
    return PLAN_RANK[userPlan] >= PLAN_RANK[requiredPlan]
}

export function getCurrentUserPlanFromDatabase(): PlanTier {
    return PLANS.FREE
}
