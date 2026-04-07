import 'server-only'

import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { encryptText } from '@/lib/crypto'
import {
    type IntegrationProvider,
    isIntegrationProvider,
} from '@/constants/integrations'
import { ServiceError } from '@/services/service-error'

type OAuthProviderConfig = {
    provider: IntegrationProvider
    authUrl: string
    tokenUrl: string
    scopes: string[]
    clientIdEnv: string
    clientSecretEnv: string
}

type OAuthTokenResponse = {
    access_token: string
    token_type?: string
    scope?: string
    refresh_token?: string
    expires_in?: number
}

type AuthenticatedOrganisationContext = {
    organisationId: string
    role: 'owner' | 'admin' | 'member'
}

const OAUTH_PROVIDER_CONFIG: Record<IntegrationProvider, OAuthProviderConfig> = {
    monday: {
        provider: 'monday',
        authUrl: 'https://auth.monday.com/oauth2/authorize',
        tokenUrl: 'https://auth.monday.com/oauth2/token',
        scopes: [],
        clientIdEnv: 'MONDAY_CLIENT_ID',
        clientSecretEnv: 'MONDAY_CLIENT_SECRET',
    },
    clickup: {
        provider: 'clickup',
        authUrl: 'https://app.clickup.com/api',
        tokenUrl: 'https://api.clickup.com/api/v2/oauth/token',
        scopes: [],
        clientIdEnv: 'CLICKUP_CLIENT_ID',
        clientSecretEnv: 'CLICKUP_CLIENT_SECRET',
    },
    asana: {
        provider: 'asana',
        authUrl: 'https://app.asana.com/-/oauth_authorize',
        tokenUrl: 'https://app.asana.com/-/oauth_token',
        scopes: [],
        clientIdEnv: 'ASANA_CLIENT_ID',
        clientSecretEnv: 'ASANA_CLIENT_SECRET',
    },
    linear: {
        provider: 'linear',
        authUrl: 'https://linear.app/oauth/authorize',
        tokenUrl: 'https://api.linear.app/oauth/token',
        scopes: ['read'],
        clientIdEnv: 'LINEAR_CLIENT_ID',
        clientSecretEnv: 'LINEAR_CLIENT_SECRET',
    },
    jira: {
        provider: 'jira',
        authUrl: 'https://auth.atlassian.com/authorize',
        tokenUrl: 'https://auth.atlassian.com/oauth/token',
        scopes: ['read:jira-work', 'offline_access'],
        clientIdEnv: 'JIRA_CLIENT_ID',
        clientSecretEnv: 'JIRA_CLIENT_SECRET',
    },
}

function getRequiredEnv(name: string): string {
    const value = process.env[name]
    if (!value) {
        throw new ServiceError(`${name} is not configured`, 'configuration_error', 500)
    }

    return value
}

export function getOAuthProviderConfig(providerInput: string): OAuthProviderConfig {
    if (!isIntegrationProvider(providerInput)) {
        throw new ServiceError('Unsupported integration provider', 'invalid_provider', 400)
    }

    return OAUTH_PROVIDER_CONFIG[providerInput]
}

export function buildOAuthRedirectUri(provider: IntegrationProvider): string {
    const appUrl = getRequiredEnv('NEXT_PUBLIC_APP_URL')
    return `${appUrl}/api/auth/${provider}/callback`
}

export function buildOAuthAuthorizeUrl(providerInput: string, state: string): string {
    const config = getOAuthProviderConfig(providerInput)
    const clientId = getRequiredEnv(config.clientIdEnv)
    const redirectUri = buildOAuthRedirectUri(config.provider)

    const url = new URL(config.authUrl)
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('state', state)

    if (config.scopes.length) {
        url.searchParams.set('scope', config.scopes.join(' '))
    }

    return url.toString()
}

export async function exchangeOAuthCodeForToken(
    providerInput: string,
    code: string
): Promise<OAuthTokenResponse> {
    const config = getOAuthProviderConfig(providerInput)
    const clientId = getRequiredEnv(config.clientIdEnv)
    const clientSecret = getRequiredEnv(config.clientSecretEnv)
    const redirectUri = buildOAuthRedirectUri(config.provider)

    let response: Response

    if (config.provider === 'monday') {
        response = await fetch(config.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: redirectUri,
            }),
        })
    } else {
        const body = new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        })

        response = await fetch(config.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body,
        })
    }

    if (!response.ok) {
        throw new ServiceError('OAuth token exchange failed', 'upstream_error', response.status)
    }

    const tokenPayload = (await response.json()) as OAuthTokenResponse
    if (!tokenPayload.access_token) {
        throw new ServiceError('OAuth token response missing access_token', 'upstream_error', 502)
    }

    return tokenPayload
}

export async function getAuthenticatedUserOrThrow(): Promise<User> {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()

    if (error || !data.user) {
        throw new ServiceError('Authentication required', 'unauthorized', 401)
    }

    return data.user
}

export async function getAuthenticatedOrganisationContextOrThrow(
    userId: string
): Promise<AuthenticatedOrganisationContext> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('organisation_members')
        .select('organisation_id,role')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle<{ organisation_id: string; role: 'owner' | 'admin' | 'member' }>()

    if (error) {
        throw new ServiceError(error.message, 'database_error', 500)
    }

    if (!data?.organisation_id) {
        throw new ServiceError('User is not a member of an organisation', 'forbidden', 403)
    }

    return {
        organisationId: data.organisation_id,
        role: data.role,
    }
}

export async function upsertConnectedAccount(input: {
    organisationId: string
    actorUserId: string
    provider: IntegrationProvider
    accessToken: string
    refreshToken?: string
    expiresInSeconds?: number
    scope?: string
    externalAccountId?: string | null
    metadata?: Record<string, unknown>
}) {
    const supabase = await createClient()

    const tokenExpiresAt =
        typeof input.expiresInSeconds === 'number'
            ? new Date(Date.now() + input.expiresInSeconds * 1000).toISOString()
            : null

    // The unique index on (organisation_id, provider, external_account_id) is a partial index
    // (WHERE external_account_id IS NOT NULL), which Supabase upsert cannot target directly.
    // Instead, find an existing row and update it, or insert if none exists.
    const externalAccountId = input.externalAccountId ?? null

    let query = supabase
        .from('connected_accounts')
        .select('id')
        .eq('organisation_id', input.organisationId)
        .eq('provider', input.provider)

    if (externalAccountId !== null) {
        query = query.eq('external_account_id', externalAccountId)
    }

    const { data: existing, error: selectError } = await query.maybeSingle<{ id: string }>()

    if (selectError) {
        throw new ServiceError(selectError.message, 'database_error', 500)
    }

    const payload = {
        organisation_id: input.organisationId,
        created_by: input.actorUserId,
        provider: input.provider,
        external_account_id: externalAccountId,
        access_token_encrypted: encryptText(input.accessToken),
        refresh_token_encrypted: input.refreshToken ? encryptText(input.refreshToken) : null,
        token_expires_at: tokenExpiresAt,
        scopes: input.scope ? input.scope.split(' ').filter(Boolean) : null,
        metadata: input.metadata ?? {},
    }

    const { error } = existing
        ? await supabase.from('connected_accounts').update(payload).eq('id', existing.id)
        : await supabase.from('connected_accounts').insert(payload)

    if (error) {
        throw new ServiceError(error.message, 'database_error', 500)
    }
}
