import { NextResponse, type NextRequest } from 'next/server'
import { decryptText } from '@/lib/crypto'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { fetchMondayBoardData } from '@/services/monday'
import { ServiceError } from '@/services/service-error'
import { logger } from '@/lib/logger'
import type { PortalBoardData } from '@/types/portal-view'

export async function GET(request: NextRequest) {
    try {
        const portalId = request.nextUrl.searchParams.get('portal_id')

        if (!portalId) {
            throw new ServiceError('portal_id is required', 'invalid_request', 400)
        }

        // Use anon client to look up the portal (enforces status = active via DB function)
        const supabase = await createClient()

        const { data: portalData, error: portalError } = await supabase.rpc('get_public_portal_by_id', {
            p_portal_id: portalId,
        })

        if (portalError) {
            throw new ServiceError(portalError.message, 'database_error', 500)
        }

        const portal = Array.isArray(portalData) ? portalData[0] : null

        if (!portal) {
            throw new ServiceError('Portal not found', 'not_found', 404)
        }

        const importConfig = portal.import_config as {
            boardId: string
            boardName: string
            selectedColumnIds: string[]
        } | null

        if (!importConfig?.boardId || !importConfig.selectedColumnIds?.length) {
            throw new ServiceError('Portal has no import configuration', 'invalid_request', 400)
        }

        // Use the DB function to get connection_id (security definer — safe for anon)
        const { data: connectionId, error: connectionIdError } = await supabase.rpc('get_portal_connection_id', {
            p_portal_id: portalId,
        })

        if (connectionIdError || !connectionId) {
            throw new ServiceError('Unable to resolve portal connection', 'not_found', 404)
        }

        // Use service role client to read the encrypted token — never exposed to client
        const serviceClient = createServiceClient()

        const { data: connection, error: connectionError } = await serviceClient
            .from('connected_accounts')
            .select('access_token_encrypted, provider')
            .eq('id', connectionId)
            .maybeSingle<{ access_token_encrypted: string; provider: string }>()

        if (connectionError) {
            throw new ServiceError(connectionError.message, 'database_error', 500)
        }

        if (!connection) {
            throw new ServiceError('Connection not found', 'not_found', 404)
        }

        if (connection.provider !== 'monday') {
            throw new ServiceError('Only monday connections are currently supported', 'invalid_provider', 400)
        }

        const accessToken = decryptText(connection.access_token_encrypted)

        const boardData: PortalBoardData = await fetchMondayBoardData(
            accessToken,
            importConfig.boardId,
            importConfig.selectedColumnIds
        )

        return NextResponse.json(boardData)
    } catch (error) {
        if (error instanceof ServiceError) {
            return NextResponse.json({ message: error.message }, { status: error.status })
        }

        logger.error('portal.board-data.error', { reason: error instanceof Error ? error.message : 'unknown' })
        return NextResponse.json({ message: 'Unable to load portal data' }, { status: 500 })
    }
}
