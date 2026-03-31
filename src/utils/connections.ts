export const HUMAN_READABLE_METADATA_KEYS = [
    'integrationDisplayName',
    'workspaceName',
    'accountName',
    'teamName',
    'organisationName',
    'mondayAccountName',
] as const

export function getConnectionDisplayName(connection: {
    provider: string
    external_account_id: string | null
    metadata: Record<string, unknown>
}): string {
    for (const key of HUMAN_READABLE_METADATA_KEYS) {
        const value = connection.metadata[key]
        if (typeof value === 'string' && value.trim()) {
            return value
        }
    }

    if (connection.external_account_id) {
        return `${connection.provider} · ${connection.external_account_id}`
    }

    return `${connection.provider} · Connected account`
}
