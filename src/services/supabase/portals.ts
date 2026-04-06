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
import { emitInternalEvent } from '@/services/activity'

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
    const data = new TextEncoder().encode(code.trim().toUpperCase())
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
    ).sort((left, right) => left.localeCompare(right))
}

function arraysEqual(valuesA: string[], valuesB: string[]): boolean {
    if (valuesA.length !== valuesB.length) return false
    return valuesA.every((value, index) => value === valuesB[index])
}

function isSameImportConfig(current: PortalImportConfig, next: PortalImportConfig): boolean {
    return (
        current.boardId === next.boardId &&
        current.boardName === next.boardName &&
        arraysEqual(current.selectedColumnIds, next.selectedColumnIds)
    )
}

function isSameCustomization(current: PortalCustomization, next: PortalCustomization): boolean {
    return (
        (current.tagline ?? null) === (next.tagline ?? null) &&
        (current.projectOwner ?? null) === (next.projectOwner ?? null) &&
        (current.organisationName ?? null) === (next.organisationName ?? null) &&
        current.showStatusSection === next.showStatusSection &&
        current.showTimelineSection === next.showTimelineSection &&
        current.showOwnersSection === next.showOwnersSection
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

    emitInternalEvent({
        portalId: data.id,
        eventType: 'portal.created',
        metadata: { portalName: data.name },
    })

    return { data, error: null }
}

export async function updatePortalName(input: {
    organisationId: string
    portalId: string
    name: string
}): Promise<UpdatePortalNameResult> {
    const supabase = createClient()
    const nextName = input.name.trim()

    const { data: currentPortal, error: currentError } = await supabase
        .from('portals')
        .select(PORTAL_SELECT)
        .eq('organisation_id', input.organisationId)
        .eq('id', input.portalId)
        .single<Portal>()

    if (currentError) {
        return { data: null, error: currentError }
    }

    if (currentPortal.name === nextName) {
        return { data: currentPortal, error: null }
    }

    const { data, error } = await supabase
        .from('portals')
        .update({
            name: nextName,
        })
        .eq('organisation_id', input.organisationId)
        .eq('id', input.portalId)
        .select(PORTAL_SELECT)
        .single<Portal>()

    if (error) {
        return { data: null, error }
    }

    emitInternalEvent({
        portalId: data.id,
        eventType: 'portal.updated',
        metadata: { portalName: data.name },
    })

    return { data, error: null }
}

export async function deletePortal(input: {
    organisationId: string
    portalId: string
    portalName?: string
}): Promise<DeletePortalResult> {
    const supabase = createClient()

    const { error } = await supabase
        .from('portals')
        .delete()
        .eq('organisation_id', input.organisationId)
        .eq('id', input.portalId)

    if (!error) {
        emitInternalEvent({
            portalId: input.portalId,
            eventType: 'portal.deleted',
            metadata: input.portalName ? { portalName: input.portalName } : null,
        })
    }

    return { error }
}

export async function updatePortalStatus(input: {
    organisationId: string
    portalId: string
    status: 'draft' | 'active'
}): Promise<{ data: Portal | null; error: PostgrestError | null }> {
    const supabase = createClient()

    const { data: currentPortal, error: currentError } = await supabase
        .from('portals')
        .select(PORTAL_SELECT)
        .eq('organisation_id', input.organisationId)
        .eq('id', input.portalId)
        .single<Portal>()

    if (currentError) return { data: null, error: currentError }

    if (currentPortal.status === input.status) {
        return { data: currentPortal, error: null }
    }

    const { data, error } = await supabase
        .from('portals')
        .update({ status: input.status })
        .eq('organisation_id', input.organisationId)
        .eq('id', input.portalId)
        .select(PORTAL_SELECT)
        .single<Portal>()

    if (error) return { data: null, error }

    emitInternalEvent({
        portalId: input.portalId,
        eventType: 'portal.status_changed',
        metadata: { portalName: data.name, status: input.status },
    })

    return { data, error: null }
}

export async function updatePortalImportConfig(input: {
    organisationId: string
    portalId: string
    importConfig: PortalImportConfig
}): Promise<{ data: Portal | null; error: PostgrestError | null }> {
    const supabase = createClient()

    const { data: currentPortal, error: currentError } = await supabase
        .from('portals')
        .select(PORTAL_SELECT)
        .eq('organisation_id', input.organisationId)
        .eq('id', input.portalId)
        .single<Portal>()

    if (currentError) return { data: null, error: currentError }

    if (isSameImportConfig(currentPortal.import_config, input.importConfig)) {
        return { data: currentPortal, error: null }
    }

    const { data, error } = await supabase
        .from('portals')
        .update({ import_config: input.importConfig })
        .eq('organisation_id', input.organisationId)
        .eq('id', input.portalId)
        .select(PORTAL_SELECT)
        .single<Portal>()

    if (error) return { data: null, error }

    emitInternalEvent({
        portalId: data.id,
        eventType: 'portal.fields_updated',
        metadata: {
            portalName: data.name,
            selectedFieldsCount: input.importConfig.selectedColumnIds.length,
        },
    })

    return { data, error: null }
}

export async function updatePortalCustomization(input: {
    organisationId: string
    portalId: string
    customization: PortalCustomization
}): Promise<{ data: Portal | null; error: PostgrestError | null }> {
    const supabase = createClient()

    const { data: currentPortal, error: currentError } = await supabase
        .from('portals')
        .select(PORTAL_SELECT)
        .eq('organisation_id', input.organisationId)
        .eq('id', input.portalId)
        .single<Portal>()

    if (currentError) return { data: null, error: currentError }

    if (isSameCustomization(currentPortal.customization, input.customization)) {
        return { data: currentPortal, error: null }
    }

    const { data, error } = await supabase
        .from('portals')
        .update({ customization: input.customization })
        .eq('organisation_id', input.organisationId)
        .eq('id', input.portalId)
        .select(PORTAL_SELECT)
        .single<Portal>()

    if (error) return { data: null, error }

    emitInternalEvent({
        portalId: data.id,
        eventType: 'portal.sections_updated',
        metadata: {
            portalName: data.name,
            showStatusSection: input.customization.showStatusSection,
            showTimelineSection: input.customization.showTimelineSection,
            showOwnersSection: input.customization.showOwnersSection,
        },
    })

    return { data, error: null }
}

export async function updatePortalAccess(input: UpdatePortalAccessInput): Promise<UpdatePortalAccessResult> {
    const supabase = createClient()

    const { data: currentPortal, error: currentError } = await supabase
        .from('portals')
        .select(PORTAL_SELECT)
        .eq('organisation_id', input.organisationId)
        .eq('id', input.portalId)
        .single<Portal>()

    if (currentError) {
        return { data: null, error: currentError }
    }

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

    const isUnchanged =
        currentPortal.access_type === updatePayload.access_type &&
        arraysEqual(currentPortal.access_email_allowlist, updatePayload.access_email_allowlist) &&
        currentPortal.access_code_hash === updatePayload.access_code_hash

    if (isUnchanged) {
        return { data: currentPortal, error: null }
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

    emitInternalEvent({
        portalId: data.id,
        eventType: 'portal.access_updated',
        metadata: {
            portalName: data.name,
            accessType: input.accessType,
            allowlistCount: updatePayload.access_email_allowlist.length,
        },
    })

    return { data, error: null }
}
