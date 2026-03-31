import type { PostgrestError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import {
    DEFAULT_PORTAL_CUSTOMIZATION,
    type PortalAccessType,
    type Portal,
    type PortalCustomization,
    type PortalImportConfig,
} from '@/types/portal'
import { withRandomSuffix } from '@/utils/string'

type PortalsResult = {
    data: Portal[]
    error: PostgrestError | null
}

type CreatePortalResult = {
    data: Portal | null
    error: PostgrestError | null
}

type UpdatePortalNameResult = {
    data: Portal | null
    error: PostgrestError | null
}

type DeletePortalResult = {
    error: PostgrestError | null
}

type UpdatePortalAccessInput =
    | {
        organisationId: string
        portalId: string
        accessType: 'anyone_with_link'
    }
    | {
        organisationId: string
        portalId: string
        accessType: 'email_otp'
        emails: string[]
    }
    | {
        organisationId: string
        portalId: string
        accessType: 'anyone_with_code'
        code: string
    }

type UpdatePortalAccessResult = {
    data: Portal | null
    error: PostgrestError | null
}

type CreatePortalInput = {
    organisationId: string
    connectionId: string
    name: string
    importConfig: PortalImportConfig
    customization?: Partial<PortalCustomization>
}

const PORTAL_SELECT =
    'id,organisation_id,name,slug,provider,connection_id,status,access_type,access_email_allowlist,access_code_hash,import_config,customization,created_at,updated_at'

async function hashPortalAccessCode(code: string): Promise<string> {
    const data = new TextEncoder().encode(code.trim())
    const digestBuffer = await crypto.subtle.digest('SHA-256', data)

    return Array.from(new Uint8Array(digestBuffer))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('')
}

function normalizeEmailList(emails: string[]): string[] {
    return Array.from(
        new Set(
            emails
                .map((email) => email.trim().toLowerCase())
                .filter((email) => email.length > 0)
        )
    )
}

export async function getPortals(organisationId: string): Promise<PortalsResult> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('portals')
        .select(PORTAL_SELECT)
        .eq('organisation_id', organisationId)
        .order('created_at', { ascending: false })

    return {
        data: (data as Portal[] | null) ?? [],
        error,
    }
}

export async function createPortal(input: CreatePortalInput): Promise<CreatePortalResult> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('portals')
        .insert({
            organisation_id: input.organisationId,
            name: input.name.trim(),
            slug: withRandomSuffix(input.name, 'portal'),
            provider: 'monday',
            connection_id: input.connectionId,
            status: 'draft',
            access_type: 'anyone_with_link',
            access_email_allowlist: [],
            access_code_hash: null,
            import_config: input.importConfig,
            customization: {
                ...DEFAULT_PORTAL_CUSTOMIZATION,
                ...(input.customization ?? {}),
            },
        })
        .select(PORTAL_SELECT)
        .single<Portal>()

    if (error) {
        return { data: null, error }
    }

    return { data, error: null }
}

export async function updatePortalName(input: {
    organisationId: string
    portalId: string
    name: string
}): Promise<UpdatePortalNameResult> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('portals')
        .update({
            name: input.name.trim(),
        })
        .eq('organisation_id', input.organisationId)
        .eq('id', input.portalId)
        .select(PORTAL_SELECT)
        .single<Portal>()

    if (error) {
        return { data: null, error }
    }

    return { data, error: null }
}

export async function deletePortal(input: {
    organisationId: string
    portalId: string
}): Promise<DeletePortalResult> {
    const supabase = createClient()

    const { error } = await supabase
        .from('portals')
        .delete()
        .eq('organisation_id', input.organisationId)
        .eq('id', input.portalId)

    return { error }
}

export async function updatePortalStatus(input: {
    organisationId: string
    portalId: string
    status: 'draft' | 'active'
}): Promise<{ data: Portal | null; error: PostgrestError | null }> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('portals')
        .update({ status: input.status })
        .eq('organisation_id', input.organisationId)
        .eq('id', input.portalId)
        .select(PORTAL_SELECT)
        .single<Portal>()

    if (error) return { data: null, error }
    return { data, error: null }
}

export async function updatePortalAccess(input: UpdatePortalAccessInput): Promise<UpdatePortalAccessResult> {
    const supabase = createClient()

    const updatePayload: {
        access_type: PortalAccessType
        access_email_allowlist: string[]
        access_code_hash: string | null
    } = {
        access_type: input.accessType,
        access_email_allowlist: [],
        access_code_hash: null,
    }

    if (input.accessType === 'email_otp') {
        updatePayload.access_email_allowlist = normalizeEmailList(input.emails)
    }

    if (input.accessType === 'anyone_with_code') {
        updatePayload.access_code_hash = await hashPortalAccessCode(input.code)
    }

    const { data, error } = await supabase
        .from('portals')
        .update(updatePayload)
        .eq('organisation_id', input.organisationId)
        .eq('id', input.portalId)
        .select(PORTAL_SELECT)
        .single<Portal>()

    if (error) {
        return { data: null, error }
    }

    return { data, error: null }
}
