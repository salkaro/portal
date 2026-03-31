import type { PostgrestError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { IntegrationProvider } from '@/constants/integrations'

export type ConnectedAccount = {
    id: string
    provider: IntegrationProvider
    external_account_id: string | null
    token_expires_at: string | null
    scopes: string[] | null
    metadata: Record<string, unknown>
    created_at: string
}

type ConnectedAccountsResult = {
    data: ConnectedAccount[]
    error: PostgrestError | null
}

type DeleteConnectedAccountResult = {
    error: PostgrestError | null
}

type UpdateConnectedAccountDisplayNameResult = {
    error: PostgrestError | null
}

export async function getConnectedAccounts(
    organisationId: string
): Promise<ConnectedAccountsResult> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('connected_accounts')
        .select('id,provider,external_account_id,token_expires_at,scopes,metadata,created_at')
        .eq('organisation_id', organisationId)
        .order('created_at', { ascending: false })

    return {
        data: (data as ConnectedAccount[] | null) ?? [],
        error,
    }
}

export async function deleteConnectedAccount(input: {
    organisationId: string
    connectionId: string
}): Promise<DeleteConnectedAccountResult> {
    const supabase = createClient()

    const { error } = await supabase
        .from('connected_accounts')
        .delete()
        .eq('organisation_id', input.organisationId)
        .eq('id', input.connectionId)

    return { error }
}

export async function updateConnectedAccountDisplayName(input: {
    organisationId: string
    connectionId: string
    displayName: string
    existingMetadata: Record<string, unknown>
}): Promise<UpdateConnectedAccountDisplayNameResult> {
    const supabase = createClient()

    const metadata = {
        ...input.existingMetadata,
        integrationDisplayName: input.displayName,
    }

    const { error } = await supabase
        .from('connected_accounts')
        .update({ metadata })
        .eq('organisation_id', input.organisationId)
        .eq('id', input.connectionId)

    return { error }
}
