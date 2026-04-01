export const INTEGRATION_PROVIDERS = [
    'monday',
    'clickup',
    'asana',
    'linear',
] as const

export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number]

export type IntegrationCardDefinition = {
    provider: IntegrationProvider
    title: string
    description: string
    imageForLightTheme: string
    imageForDarkTheme: string
    iconForLightTheme: string
    iconForDarkTheme: string
    enabled: boolean
}

export const INTEGRATION_CARD_DEFINITIONS: IntegrationCardDefinition[] = [
    {
        provider: 'monday',
        title: 'Monday.com',
        description: 'Sync your boards and item statuses into Salkaro portals in real time.',
        imageForLightTheme: '/integrations/dark/monday.svg',
        imageForDarkTheme: '/integrations/light/monday.svg',
        iconForLightTheme: '/integrations/dark/monday-icon.svg',
        iconForDarkTheme: '/integrations/light/monday-icon.svg',
        enabled: true,
    },
    {
        provider: 'clickup',
        title: 'ClickUp',
        description: 'Connect ClickUp workspaces and map tasks to your client portal updates.',
        imageForLightTheme: '/integrations/dark/clickup.svg',
        imageForDarkTheme: '/integrations/light/clickup.svg',
        iconForLightTheme: '/integrations/dark/clickup-icon.svg',
        iconForDarkTheme: '/integrations/light/clickup-icon.svg',
        enabled: false,
    },
    {
        provider: 'asana',
        title: 'Asana',
        description: 'Bring project timelines and completion statuses directly to your clients.',
        imageForLightTheme: '/integrations/dark/asana.svg',
        imageForDarkTheme: '/integrations/light/asana.svg',
        iconForLightTheme: '/integrations/dark/asana-icon.svg',
        iconForDarkTheme: '/integrations/light/asana-icon.svg',
        enabled: false,
    },
    {
        provider: 'linear',
        title: 'Linear',
        description: 'Mirror issue progress and milestone delivery from your Linear projects.',
        imageForLightTheme: '/integrations/dark/linear.svg',
        imageForDarkTheme: '/integrations/light/linear.svg',
        iconForLightTheme: '/integrations/dark/linear-icon.svg',
        iconForDarkTheme: '/integrations/light/linear.svg',
        enabled: false,
    },
]

export function isIntegrationProvider(value: string): value is IntegrationProvider {
    return (INTEGRATION_PROVIDERS as readonly string[]).includes(value)
}
