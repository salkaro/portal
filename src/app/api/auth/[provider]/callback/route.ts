import { NextResponse, type NextRequest } from 'next/server'
import { ROUTES } from '@/constants/routes'
import { logger } from '@/lib/logger'
import { fetchMondayAccountIdentity } from '@/services/monday'
import { fetchLinearAccountIdentity } from '@/services/linear'
import {
    exchangeOAuthCodeForToken,
    getAuthenticatedOrganisationContextOrThrow,
    getAuthenticatedUserOrThrow,
    getOAuthProviderConfig,
    upsertConnectedAccount,
} from '@/services/oauth'
import { ServiceError } from '@/services/service-error'

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ provider: string }> }
) {
    const { provider } = await context.params
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin
    const redirectUrl = new URL(ROUTES.INTEGRATIONS, appUrl)

    try {
        const config = getOAuthProviderConfig(provider)

        const code = request.nextUrl.searchParams.get('code')
        const returnedState = request.nextUrl.searchParams.get('state')
        const stateCookie = request.cookies.get(`oauth_state_${config.provider}`)?.value

        if (!code || !returnedState || !stateCookie || stateCookie !== returnedState) {
            throw new ServiceError('Invalid OAuth callback state', 'invalid_request', 400)
        }

        const user = await getAuthenticatedUserOrThrow()
        const organisationContext = await getAuthenticatedOrganisationContextOrThrow(user.id)

        if (!['owner', 'admin'].includes(organisationContext.role)) {
            throw new ServiceError(
                'Only organisation owners and admins can connect integrations',
                'forbidden',
                403
            )
        }

        const token = await exchangeOAuthCodeForToken(config.provider, code)

        let externalAccountId: string | null = null
        let metadata: Record<string, unknown> = {}

        if (config.provider === 'monday') {
            try {
                const identity = await fetchMondayAccountIdentity(token.access_token)
                externalAccountId = identity.accountId ?? identity.userId
                metadata = {
                    integrationDisplayName:
                        identity.accountName?.trim() ||
                        (identity.accountId ? `monday workspace ${identity.accountId}` : null),
                    mondayUserId: identity.userId,
                    mondayAccountId: identity.accountId,
                    mondayAccountName: identity.accountName,
                }
            } catch (identityError) {
                const reason =
                    identityError instanceof ServiceError
                        ? identityError.message
                        : 'Unable to fetch monday account identity'

                logger.warn('integration.oauth.identity_lookup_failed', { provider, reason }, user.id)
            }
        } else if (config.provider === 'linear') {
            try {
                const identity = await fetchLinearAccountIdentity(token.access_token)
                externalAccountId = identity.organizationId ?? identity.userId
                metadata = {
                    integrationDisplayName:
                        identity.organizationName?.trim() ||
                        (identity.organizationId ? `Linear workspace ${identity.organizationId}` : null),
                    linearUserId: identity.userId,
                    linearOrganizationId: identity.organizationId,
                    linearOrganizationName: identity.organizationName,
                }
            } catch (identityError) {
                const reason =
                    identityError instanceof ServiceError
                        ? identityError.message
                        : 'Unable to fetch Linear account identity'

                logger.warn('integration.oauth.identity_lookup_failed', { provider, reason }, user.id)
            }
        }

        await upsertConnectedAccount({
            organisationId: organisationContext.organisationId,
            actorUserId: user.id,
            provider: config.provider,
            accessToken: token.access_token,
            refreshToken: token.refresh_token,
            expiresInSeconds: token.expires_in,
            scope: token.scope,
            externalAccountId,
            metadata,
        })

        redirectUrl.searchParams.set('connected', '1')
        const response = NextResponse.redirect(redirectUrl)
        response.cookies.delete(`oauth_state_${config.provider}`)

        logger.info('integration.oauth.success', { provider }, user.id)
        return response
    } catch (error) {
        const message = error instanceof ServiceError ? error.message : 'OAuth callback failed'

        logger.error('integration.oauth.failed', { provider, reason: message })
        redirectUrl.searchParams.set('integrationError', message)
        const response = NextResponse.redirect(redirectUrl)
        response.cookies.delete(`oauth_state_${provider}`)
        return response
    }
}
