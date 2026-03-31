export const ROUTES = {
    // Public
    HOME: '/',
    LOGIN: '/login',
    GET_STARTED: '/get-started',

    // Main
    DASHBOARD: '/dashboard',
    PORTALS: '/portals',
    CLIENTS: '/clients',
    ACTIVITY: '/activity',

    // Internal
    EMPLOYEES: '/employees',
    INTEGRATIONS: '/integrations',

    // Footer
    SETTINGS: '/settings',

    AUTH_CALLBACK: '/api/auth/callback',

    // Public portal view
    VIEW: '/view',
} as const


export const SETTINGS_ROUTES = {
    GENERAL: '/settings',
    ORGANISATION: '/settings/organisation',
    APPEARANCE: '/settings/appearance',
    BILLING: '/settings/billing',
}


export const SETTINGS_NAV_ITEMS = [
  { label: 'General', href: SETTINGS_ROUTES.GENERAL },
  { label: 'Organisation', href: SETTINGS_ROUTES.ORGANISATION },
  { label: 'Appearance', href: SETTINGS_ROUTES.APPEARANCE },
  { label: 'Billing', href: SETTINGS_ROUTES.BILLING },
] as const
