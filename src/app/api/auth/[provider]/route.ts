import { randomBytes } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { SETTINGS_ROUTES } from '@/constants/routes'
import { logger } from '@/lib/logger'
import {
    buildOAuthAuthorizeUrl,
    getAuthenticatedUserOrThrow,
    getAuthenticatedOrganisationContextOrThrow,
    getOAuthProviderConfig,
} from '@/services/oauth'
import { ServiceError } from '@/services/service-error'

function buildState(userId: string): string {
    const payload = {
        nonce: randomBytes(16).toString('hex'),
        userId,
        ts: Date.now(),
    }

    return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
}

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ provider: string }> }
) {
    const { provider } = await context.params

    try {
        const config = getOAuthProviderConfig(provider)
        const user = await getAuthenticatedUserOrThrow()
        const organisationContext = await getAuthenticatedOrganisationContextOrThrow(user.id)

        if (!['owner', 'admin'].includes(organisationContext.role)) {
            throw new ServiceError(
                'Only organisation owners and admins can connect integrations',
                'forbidden',
                403
            )
        }

        const state = buildState(user.id)
        const authUrl = buildOAuthAuthorizeUrl(config.provider, state)
        const response = NextResponse.redirect(authUrl)

        response.cookies.set(`oauth_state_${config.provider}`, state, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: `/api/auth/${config.provider}/callback`,
            maxAge: 60 * 10,
        })

        logger.info('integration.oauth.start', { provider }, user.id)
        return response
    } catch (error) {
        const message =
            error instanceof ServiceError ? error.message : 'Unable to start integration connection'

        logger.error('integration.oauth.start_failed', { provider, reason: message })
        const redirectUrl = new URL(SETTINGS_ROUTES.ORGANISATION, request.url)
        redirectUrl.searchParams.set('integrationError', message)
        return NextResponse.redirect(redirectUrl)
    }
}
