import { ServiceError } from '@/services/service-error'
import type { PortalBoardData, PortalColumn, PortalItem } from '@/types/portal-view'

type LinearGraphQLResponse<TData> = {
    data?: TData
    errors?: Array<{
        message: string
        extensions?: {
            type?: string
        }
    }>
}

export type LinearTeam = {
    id: string
    name: string
}

export type LinearIssue = {
    id: string
    name: string
}

export type LinearWorkflowState = {
    id: string
    label: string
}

export type LinearAccountIdentity = {
    userId: string
    organizationId: string | null
    organizationName: string | null
}

const LINEAR_API_URL = 'https://api.linear.app/graphql'

async function linearGraphql<TData>(accessToken: string, query: string, variables?: Record<string, unknown>) {
    const response = await fetch(LINEAR_API_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
    })

    if (!response.ok) {
        if (response.status === 401) {
            throw new ServiceError(
                'Linear authentication failed. Please reconnect the integration.',
                'forbidden',
                403
            )
        }
        throw new ServiceError('Linear API request failed', 'upstream_error', response.status)
    }

    const payload = (await response.json()) as LinearGraphQLResponse<TData>

    if (payload.errors?.length) {
        const errorMessage = payload.errors.map((e) => e.message).join('; ')
        const isAuthError = payload.errors.some((e) => e.extensions?.type === 'AUTHENTICATION_ERROR')

        if (isAuthError) {
            throw new ServiceError(
                'Linear authentication failed. Please reconnect the integration.',
                'forbidden',
                403
            )
        }

        throw new ServiceError(errorMessage, 'upstream_error', 502)
    }

    if (!payload.data) {
        throw new ServiceError('Linear API returned no data', 'upstream_error', 502)
    }

    return payload.data
}

export async function fetchLinearAccountIdentity(accessToken: string): Promise<LinearAccountIdentity> {
    const data = await linearGraphql<{
        viewer: {
            id: string
            organization: {
                id: string
                name: string
            }
        }
    }>(
        accessToken,
        `query {
            viewer {
                id
                organization {
                    id
                    name
                }
            }
        }`
    )

    return {
        userId: data.viewer.id,
        organizationId: data.viewer.organization?.id ?? null,
        organizationName: data.viewer.organization?.name ?? null,
    }
}

export async function fetchLinearTeams(accessToken: string): Promise<LinearTeam[]> {
    const data = await linearGraphql<{
        teams: {
            nodes: Array<{ id: string; name: string }>
        }
    }>(
        accessToken,
        `query {
            teams(first: 100) {
                nodes {
                    id
                    name
                }
            }
        }`
    )

    return data.teams.nodes.map((team) => ({ id: team.id, name: team.name }))
}

export async function fetchLinearIssues(accessToken: string, teamId: string): Promise<LinearIssue[]> {
    const data = await linearGraphql<{
        team: {
            issues: {
                nodes: Array<{ id: string; title: string }>
            }
        }
    }>(
        accessToken,
        `query ($teamId: String!) {
            team(id: $teamId) {
                issues(first: 200) {
                    nodes {
                        id
                        title
                    }
                }
            }
        }`,
        { teamId }
    )

    return data.team.issues.nodes.map((issue) => ({ id: issue.id, name: issue.title }))
}

export type LinearProject = {
    id: string
    name: string
}

export type LinearBoardColumn = {
    id: string
    title: string
    type: string
}

export async function fetchLinearProjects(accessToken: string, teamId: string): Promise<LinearProject[]> {
    const data = await linearGraphql<{
        team: {
            projects: {
                nodes: Array<{ id: string; name: string }>
            }
        }
    }>(
        accessToken,
        `query ($teamId: String!) {
            team(id: $teamId) {
                projects(first: 100) {
                    nodes {
                        id
                        name
                    }
                }
            }
        }`,
        { teamId }
    )

    return data.team.projects.nodes.map((p) => ({ id: p.id, name: p.name }))
}

// Returns the fixed set of fields available for Linear portals.
// These are the fields the user can toggle on/off in the import step.
export function fetchLinearAvailableFields(): LinearBoardColumn[] {
    return [
        { id: 'status', title: 'Status', type: 'status' },
        { id: 'assignee', title: 'Assignee', type: 'people' },
        { id: 'dueDate', title: 'Due Date', type: 'date' },
        { id: 'priority', title: 'Priority', type: 'text' },
        { id: 'labels', title: 'Labels', type: 'labels' },
    ]
}

export async function fetchLinearWorkflowStates(accessToken: string, teamId: string): Promise<LinearWorkflowState[]> {
    const data = await linearGraphql<{
        team: {
            states: {
                nodes: Array<{ id: string; name: string }>
            }
        }
    }>(
        accessToken,
        `query ($teamId: String!) {
            team(id: $teamId) {
                states {
                    nodes {
                        id
                        name
                    }
                }
            }
        }`,
        { teamId }
    )

    return data.team.states.nodes.map((state) => ({ id: state.id, label: state.name }))
}

export async function fetchLinearBoardData(
    accessToken: string,
    teamId: string,
    selectedFieldIds: string[],
    projectId?: string | null
): Promise<PortalBoardData> {
    const issueFilter = projectId
        ? `filter: { project: { id: { eq: $projectId } } }`
        : ``

    const queryVarsDef = projectId
        ? `$teamId: String!, $projectId: ID`
        : `$teamId: String!`

    const data = await linearGraphql<{
        team: {
            issues: {
                nodes: Array<{
                    id: string
                    title: string
                    priority: number
                    state: { id: string; name: string }
                    assignee: { id: string; name: string } | null
                    dueDate: string | null
                    labels: { nodes: Array<{ name: string }> }
                }>
            }
        }
    }>(
        accessToken,
        `query (${queryVarsDef}) {
            team(id: $teamId) {
                issues(
                    first: 200
                    ${issueFilter ? `, ${issueFilter}` : ''}
                ) {
                    nodes {
                        id
                        title
                        priority
                        state { id name }
                        assignee { id name }
                        dueDate
                        labels { nodes { name } }
                    }
                }
            }
        }`,
        projectId ? { teamId, projectId } : { teamId }
    )

    const availableFields = fetchLinearAvailableFields()
    const columns: PortalColumn[] = availableFields
        .filter((f) => selectedFieldIds.includes(f.id))
        .map((f) => ({ id: f.id, title: f.title, type: f.type }))

    const priorityLabel: Record<number, string> = {
        0: 'No priority',
        1: 'Urgent',
        2: 'High',
        3: 'Medium',
        4: 'Low',
    }

    const items: PortalItem[] = data.team.issues.nodes.map((issue) => {
        const allColumnValues = [
            {
                columnId: 'status',
                title: 'Status',
                type: 'status',
                text: issue.state.name,
                value: issue.state.id,
            },
            {
                columnId: 'assignee',
                title: 'Assignee',
                type: 'people',
                text: issue.assignee?.name ?? '',
                value: issue.assignee?.id ?? null,
            },
            {
                columnId: 'dueDate',
                title: 'Due Date',
                type: 'date',
                text: issue.dueDate ?? '',
                value: issue.dueDate ?? null,
            },
            {
                columnId: 'priority',
                title: 'Priority',
                type: 'text',
                text: priorityLabel[issue.priority] ?? 'No priority',
                value: String(issue.priority),
            },
            {
                columnId: 'labels',
                title: 'Labels',
                type: 'labels',
                text: issue.labels.nodes.map((l) => l.name).join(', '),
                value: null,
            },
        ]

        return {
            id: issue.id,
            name: issue.title,
            groupId: issue.state.id,
            groupTitle: issue.state.name,
            columnValues: allColumnValues.filter((cv) => selectedFieldIds.includes(cv.columnId)),
            subitems: [],
        }
    })

    return { columns, items }
}
