import { NextResponse, type NextRequest } from 'next/server'
import { decryptText } from '@/lib/crypto'
import { createClient } from '@/lib/supabase/server'
import {
    fetchMondayBoards,
    fetchMondayBoardColumns,
    type MondayBoard,
    type MondayBoardColumn,
} from '@/services/monday'
import {
    fetchLinearTeams,
    fetchLinearProjects,
    fetchLinearAvailableFields,
    type LinearTeam,
    type LinearProject,
    type LinearBoardColumn,
} from '@/services/linear'
import {
    getAuthenticatedOrganisationContextOrThrow,
    getAuthenticatedUserOrThrow,
} from '@/services/oauth'
import { ServiceError } from '@/services/service-error'

type PortalSourceRequest = {
    connectionId?: string
    boardId?: string
    subBoardId?: string
}

type PortalSourceBoard = MondayBoard | LinearTeam
type PortalSourceSubBoard = LinearProject
type PortalSourceColumn = MondayBoardColumn | LinearBoardColumn

type PortalSourceResponse = {
    boards: PortalSourceBoard[]
    subBoards: PortalSourceSubBoard[]
    columns: PortalSourceColumn[]
}

export async function POST(request: NextRequest) {
    try {
        const payload = (await request.json()) as PortalSourceRequest

        if (!payload.connectionId) {
            throw new ServiceError('connectionId is required', 'invalid_request', 400)
        }

        const user = await getAuthenticatedUserOrThrow()
        const organisationContext = await getAuthenticatedOrganisationContextOrThrow(user.id)
        const supabase = await createClient()

        const { data: connection, error } = await supabase
            .from('connected_accounts')
            .select('id,provider,access_token_encrypted')
            .eq('organisation_id', organisationContext.organisationId)
            .eq('id', payload.connectionId)
            .limit(1)
            .maybeSingle<{ id: string; provider: string; access_token_encrypted: string }>()

        if (error) {
            throw new ServiceError(error.message, 'database_error', 500)
        }

        if (!connection) {
            throw new ServiceError('Connection not found', 'not_found', 404)
        }

        const accessToken = decryptText(connection.access_token_encrypted)

        let boards: PortalSourceBoard[] = []
        let subBoards: PortalSourceSubBoard[] = []
        let columns: PortalSourceColumn[] = []

        if (connection.provider === 'monday') {
            boards = await fetchMondayBoards(accessToken)
            if (payload.boardId) {
                columns = await fetchMondayBoardColumns(accessToken, payload.boardId)
            }
        } else if (connection.provider === 'linear') {
            boards = await fetchLinearTeams(accessToken)
            if (payload.boardId) {
                subBoards = await fetchLinearProjects(accessToken, payload.boardId)
                // Return available fields once a team is selected (project is optional)
                columns = fetchLinearAvailableFields()
            }
        } else {
            throw new ServiceError(`Provider '${connection.provider}' is not supported`, 'invalid_provider', 400)
        }

        return NextResponse.json<PortalSourceResponse>({ boards, subBoards, columns })
    } catch (error) {
        const message = error instanceof ServiceError ? error.message : 'Unable to load portal source data'
        const statusCode = error instanceof ServiceError ? error.status : 500

        return NextResponse.json({ message }, { status: statusCode })
    }
}
