import { ServiceError } from '@/services/service-error'
import type { PortalBoardData, PortalColumn, PortalItem, PortalSubitem } from '@/types/portal-view'

type MondayGraphQLResponse<TData> = {
    data?: TData
    errors?: Array<{
        message: string
        extensions?: {
            code?: string
        }
    }>
}

export type MondayBoard = {
    id: string
    name: string
}

export type MondayItem = {
    id: string
    name: string
}

export type MondayStatus = {
    id: string
    label: string
}

export type MondayBoardColumn = {
    id: string
    title: string
    type: string
}

export type MondayAccountIdentity = {
    userId: string
    accountId: string | null
    accountName: string | null
}

const MONDAY_API_URL = 'https://api.monday.com/v2'

function isMondayPermissionError(message: string): boolean {
    const normalizedMessage = message.toLowerCase()

    return (
        normalizedMessage.includes('unauthorized field or type') ||
        normalizedMessage.includes('permission') ||
        normalizedMessage.includes('forbidden')
    )
}

async function mondayGraphql<TData>(accessToken: string, query: string, variables?: Record<string, unknown>) {
    const response = await fetch(MONDAY_API_URL, {
        method: 'POST',
        headers: {
            Authorization: accessToken,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
    })

    if (!response.ok) {
        throw new ServiceError('monday API request failed', 'upstream_error', response.status)
    }

    const payload = (await response.json()) as MondayGraphQLResponse<TData>

    if (payload.errors?.length) {
        const errorMessage = payload.errors.map((error) => error.message).join('; ')

        if (isMondayPermissionError(errorMessage)) {
            throw new ServiceError(
                'Monday permissions are missing for this connection. Enable board read permission in your Monday app settings, then reconnect the integration.',
                'forbidden',
                403
            )
        }

        throw new ServiceError(errorMessage, 'upstream_error', 502)
    }

    if (!payload.data) {
        throw new ServiceError('monday API returned no data', 'upstream_error', 502)
    }

    return payload.data
}

export async function fetchMondayBoards(accessToken: string): Promise<MondayBoard[]> {
    const data = await mondayGraphql<{ boards: Array<{ id: string; name: string }> }>(
        accessToken,
        'query { boards(limit: 100) { id name } }'
    )

    return data.boards.map((board) => ({ id: board.id, name: board.name }))
}

export async function fetchMondayItems(accessToken: string, boardId: string): Promise<MondayItem[]> {
    const data = await mondayGraphql<{
        boards: Array<{ items_page: { items: Array<{ id: string; name: string }> } }>
    }>(
        accessToken,
        'query ($boardId: [ID!]) { boards(ids: $boardId) { items_page(limit: 200) { items { id name } } } }',
        { boardId }
    )

    return data.boards?.[0]?.items_page?.items?.map((item) => ({ id: item.id, name: item.name })) ?? []
}

export async function fetchMondayStatuses(accessToken: string, boardId: string): Promise<MondayStatus[]> {
    const data = await mondayGraphql<{
        boards: Array<{ columns: Array<{ id: string; settings_str: string | null }> }>
    }>(
        accessToken,
        'query ($boardId: [ID!]) { boards(ids: $boardId) { columns { id settings_str } } }',
        { boardId }
    )

    const columns = data.boards?.[0]?.columns ?? []
    const statuses: MondayStatus[] = []

    for (const column of columns) {
        if (!column.settings_str) continue

        try {
            const settings = JSON.parse(column.settings_str) as {
                labels?: Record<string, string>
            }

            for (const [id, label] of Object.entries(settings.labels ?? {})) {
                statuses.push({ id: `${column.id}:${id}`, label })
            }
        } catch {
            // Ignore malformed settings JSON for non-status columns.
        }
    }

    return statuses
}

export async function fetchMondayBoardColumns(
    accessToken: string,
    boardId: string
): Promise<MondayBoardColumn[]> {
    const data = await mondayGraphql<{
        boards: Array<{ columns: Array<{ id: string; title: string; type: string }> }>
    }>(
        accessToken,
        'query ($boardId: [ID!]) { boards(ids: $boardId) { columns { id title type } } }',
        { boardId }
    )

    return data.boards?.[0]?.columns?.map((column) => ({
        id: column.id,
        title: column.title,
        type: column.type,
    })) ?? []
}

export async function fetchMondayAccountIdentity(accessToken: string): Promise<MondayAccountIdentity> {
    try {
        const data = await mondayGraphql<{
            me: {
                id: string
                account?: {
                    id: string
                    name: string
                } | null
            }
        }>(accessToken, 'query { me { id account { id name } } }')

        return {
            userId: data.me.id,
            accountId: data.me.account?.id ?? null,
            accountName: data.me.account?.name ?? null,
        }
    } catch {
        // Some monday app scopes do not allow querying account details.
        const fallbackData = await mondayGraphql<{
            me: {
                id: string
            }
        }>(accessToken, 'query { me { id } }')

        return {
            userId: fallbackData.me.id,
            accountId: null,
            accountName: null,
        }
    }
}

export async function fetchMondayBoardData(
    accessToken: string,
    boardId: string,
    columnIds: string[]
): Promise<PortalBoardData> {
    const data = await mondayGraphql<{
        boards: Array<{
            columns: Array<{ id: string; title: string; type: string }>
            items_page: {
                items: Array<{
                    id: string
                    name: string
                    group: { id: string; title: string }
                    column_values: Array<{
                        id: string
                        text: string
                        value: string | null
                        column: { title: string; type: string }
                    }>
                    subitems: Array<{
                        id: string
                        name: string
                        column_values: Array<{
                            id: string
                            text: string
                            column: { type: string }
                        }>
                    }>
                }>
            }
        }>
    }>(
        accessToken,
        `query ($boardId: [ID!], $columnIds: [String!]) {
            boards(ids: $boardId) {
                columns(ids: $columnIds) { id title type }
                items_page(limit: 200) {
                    items {
                        id
                        name
                        group { id title }
                        column_values(ids: $columnIds) {
                            id
                            text
                            value
                            column { title type }
                        }
                        subitems {
                            id
                            name
                            column_values {
                                id
                                text
                                column { type }
                            }
                        }
                    }
                }
            }
        }`,
        { boardId, columnIds }
    )

    const board = data.boards?.[0]

    const columns: PortalColumn[] = (board?.columns ?? []).map((col) => ({
        id: col.id,
        title: col.title,
        type: col.type,
    }))

    const items: PortalItem[] = (board?.items_page?.items ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        groupId: item.group?.id ?? '',
        groupTitle: item.group?.title ?? 'Items',
        columnValues: item.column_values.map((cv) => ({
            columnId: cv.id,
            title: cv.column.title,
            type: cv.column.type,
            text: cv.text ?? '',
            value: cv.value,
        })),
        subitems: (item.subitems ?? []).map((sub) => {
            const statusCol = sub.column_values.find((cv) => cv.column.type === 'status')
            return {
                id: sub.id,
                name: sub.name,
                status: statusCol?.text ?? null,
            } satisfies PortalSubitem
        }),
    }))

    return { columns, items }
}
