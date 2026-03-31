export const PLANS = {
    FREE: 'free',
    PRO: 'pro',
} as const


export const FREE_PLAN_LIMITS = {
    PORTALS: 1,
    EMPLOYEES: 2,
}

export const PRO_PLAN_LIMITS = {
    PORTALS: 5,
    EMPLOYEES: Infinity,
}


export const PLAN_LIMITS = {
    [PLANS.FREE]: FREE_PLAN_LIMITS,
    [PLANS.PRO]: PRO_PLAN_LIMITS
}