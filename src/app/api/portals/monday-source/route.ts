import { NextResponse, type NextRequest } from 'next/server'
import { decryptText } from '@/lib/crypto'
import { createClient } from '@/lib/supabase/server'
import {
    fetchMondayBoardColumns,
    fetchMondayBoards,
    type MondayBoard,
    type MondayBoardColumn,
} from '@/services/monday'
import {
    getAuthenticatedOrganisationContextOrThrow,
    getAuthenticatedUserOrThrow,
} from '@/services/oauth'
import { ServiceError } from '@/services/service-error'

type MondaySourceRequest = {
    connectionId?: string
    boardId?: string
}

type MondaySourceResponse = {
    boards: MondayBoard[]
    columns: MondayBoardColumn[]
}

export async function POST(request: NextRequest) {
    try {
        const payload = (await request.json()) as MondaySourceRequest

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

        if (connection.provider !== 'monday') {
            throw new ServiceError('Only monday connections are currently supported', 'invalid_provider', 400)
        }

        const accessToken = decryptText(connection.access_token_encrypted)
        const boards = await fetchMondayBoards(accessToken)

        let columns: MondayBoardColumn[] = []
        if (payload.boardId) {
            columns = await fetchMondayBoardColumns(accessToken, payload.boardId)
        }

        return NextResponse.json<MondaySourceResponse>({
            boards,
            columns,
        })
    } catch (error) {
        const message = error instanceof ServiceError ? error.message : 'Unable to load monday source data'
        const statusCode = error instanceof ServiceError ? error.status : 500

        return NextResponse.json({ message }, { status: statusCode })
    }
}
