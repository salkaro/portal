export const PORTAL_CREATION_STEPS = [
    'connection',
    'source',
    'import',
    'customize',
] as const

export type PortalCreationStep = (typeof PORTAL_CREATION_STEPS)[number]

export const MONDAY_IMPORTABLE_COLUMN_TYPES = [
    'status',
    'date',
    'timeline',
    'people',
    'text',
    'numbers',
] as const

export type MondayImportableColumnType = (typeof MONDAY_IMPORTABLE_COLUMN_TYPES)[number]

export const PORTAL_CREATION_STEP_LABELS: Record<PortalCreationStep, string> = {
    connection: 'Choose connection',
    source: 'Select source board',
    import: 'Select import fields',
    customize: 'Customize portal',
}

export function isMondayImportableColumnType(value: string): value is MondayImportableColumnType {
    return (MONDAY_IMPORTABLE_COLUMN_TYPES as readonly string[]).includes(value)
}

export const PORTAL_DEFAULT_NAME = 'Client Portal'
