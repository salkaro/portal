export const PLANS = {
    FREE: 'free',
    PRO: 'pro',
} as const


export const FREE_PLAN_LIMITS = {
    PORTALS: 1,
    EMPLOYEES: 1,
    INTEGRATIONS: 1,
    INVITES: 3,
    ACTIVITY_EVENTS: 0,
}

export const PRO_PLAN_LIMITS = {
    PORTALS: Infinity,
    EMPLOYEES: 10,
    INTEGRATIONS: Infinity,
    INVITES: 25,
    ACTIVITY_EVENTS: 100,
}


export const FREE_PLAN_FEATURES = {
    custom_branding: false,
}

export const PRO_PLAN_FEATURES = {
    custom_branding: true,
}


export const PLAN_LIMITS = {
    [PLANS.FREE]: FREE_PLAN_LIMITS,
    [PLANS.PRO]: PRO_PLAN_LIMITS
}