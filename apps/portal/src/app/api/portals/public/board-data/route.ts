import { NextResponse, type NextRequest } from 'next/server'
import { decryptText, encryptText } from '@/lib/crypto'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { fetchMondayBoardData } from '@/services/monday'
import { fetchLinearBoardData } from '@/services/linear'
import { refreshOAuthToken } from '@/services/oauth'
import { ServiceError } from '@/services/service-error'
import { logger } from '@/lib/logger'
import type { PortalBoardData } from '@/types/portal-view'

// Refresh the token if it expires within the next 5 minutes
const EXPIRY_BUFFER_MS = 5 * 60 * 1000

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
            subBoardId?: string | null
            subBoardName?: string | null
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
            .select('id, access_token_encrypted, refresh_token_encrypted, token_expires_at, provider')
            .eq('id', connectionId)
            .maybeSingle<{
                id: string
                access_token_encrypted: string
                refresh_token_encrypted: string | null
                token_expires_at: string | null
                provider: string
            }>()

        if (connectionError) {
            throw new ServiceError(connectionError.message, 'database_error', 500)
        }

        if (!connection) {
            throw new ServiceError('Connection not found', 'not_found', 404)
        }

        // Refresh the access token if it has expired or is about to
        const isExpired =
            connection.token_expires_at !== null &&
            new Date(connection.token_expires_at).getTime() - Date.now() < EXPIRY_BUFFER_MS

        let accessToken = decryptText(connection.access_token_encrypted)

        if (isExpired && connection.refresh_token_encrypted) {
            try {
                const refreshToken = decryptText(connection.refresh_token_encrypted)
                const refreshed = await refreshOAuthToken(connection.provider, refreshToken)

                const newExpiresAt =
                    typeof refreshed.expires_in === 'number'
                        ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
                        : null

                await serviceClient
                    .from('connected_accounts')
                    .update({
                        access_token_encrypted: encryptText(refreshed.access_token),
                        refresh_token_encrypted: refreshed.refresh_token
                            ? encryptText(refreshed.refresh_token)
                            : connection.refresh_token_encrypted,
                        token_expires_at: newExpiresAt,
                    })
                    .eq('id', connection.id)

                accessToken = refreshed.access_token
                logger.info('integration.token.refreshed', { provider: connection.provider })
            } catch (refreshError) {
                const reason = refreshError instanceof ServiceError ? refreshError.message : 'unknown'
                logger.warn('integration.token.refresh_failed', { provider: connection.provider, reason })
                // Fall through with the existing token — it may still work or fail with a clear auth error
            }
        }

        let boardData: PortalBoardData

        if (connection.provider === 'monday') {
            boardData = await fetchMondayBoardData(
                accessToken,
                importConfig.boardId,
                importConfig.selectedColumnIds
            )
        } else if (connection.provider === 'linear') {
            boardData = await fetchLinearBoardData(
                accessToken,
                importConfig.boardId,
                importConfig.selectedColumnIds,
                importConfig.subBoardId
            )
        } else {
            throw new ServiceError(`Provider '${connection.provider}' is not supported`, 'invalid_provider', 400)
        }

        return NextResponse.json(boardData)
    } catch (error) {
        if (error instanceof ServiceError) {
            return NextResponse.json({ message: error.message }, { status: error.status })
        }

        logger.error('portal.board-data.error', { reason: error instanceof Error ? error.message : 'unknown' })
        return NextResponse.json({ message: 'Unable to load portal data' }, { status: 500 })
    }
}
