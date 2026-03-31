import type { PostgrestError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export type OrganisationMember = {
    organisation_id: string
    user_id: string
    role: 'owner' | 'admin' | 'member'
    created_at: string
    full_name: string | null
    email: string | null
    avatar_url: string | null
}

export type OrganisationInvite = {
    id: string
    organisation_id: string
    code: string
    role: 'admin' | 'member'
    uses_left: number
    email: string | null
    active: boolean
    created_at: string
}

type Result<T> = {
    data: T
    error: PostgrestError | null
}

function generateInviteCode(length = 8): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let result = ''

    for (let index = 0; index < length; index += 1) {
        result += chars[Math.floor(Math.random() * chars.length)]
    }

    return result
}

export async function getOrganisationMembers(
    organisationId: string
): Promise<Result<OrganisationMember[]>> {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('get_organisation_members_details', {
        p_organisation_id: organisationId,
    })

    return {
        data: (data as OrganisationMember[] | null) ?? [],
        error,
    }
}

export async function updateOrganisationMemberRole(input: {
    organisationId: string
    userId: string
    role: 'admin' | 'member'
}): Promise<Result<OrganisationMember | null>> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('organisation_members')
        .update({ role: input.role })
        .eq('organisation_id', input.organisationId)
        .eq('user_id', input.userId)
        .select('organisation_id,user_id,role,created_at')
        .single()

    return {
        data: (data as OrganisationMember | null) ?? null,
        error,
    }
}

export async function removeOrganisationMember(input: {
    organisationId: string
    userId: string
}): Promise<Result<null>> {
    const supabase = createClient()
    const { error } = await supabase
        .from('organisation_members')
        .delete()
        .eq('organisation_id', input.organisationId)
        .eq('user_id', input.userId)

    return { data: null, error }
}

export async function getOrganisationInvites(
    organisationId: string
): Promise<Result<OrganisationInvite[]>> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('organisation_invites')
        .select('id,organisation_id,code,role,uses_left,email,active,created_at')
        .eq('organisation_id', organisationId)
        .eq('active', true)
        .order('created_at', { ascending: false })

    return {
        data: (data as OrganisationInvite[] | null) ?? [],
        error,
    }
}

export async function createOrganisationInvite(input: {
    organisationId: string
    role: 'admin' | 'member'
    usesLeft: number
    email: string | null
}): Promise<Result<OrganisationInvite | null>> {
    const supabase = createClient()

    for (let attempt = 0; attempt < 3; attempt += 1) {
        const code = generateInviteCode(8)
        const { data, error } = await supabase
            .from('organisation_invites')
            .insert({
                organisation_id: input.organisationId,
                code,
                role: input.role,
                uses_left: input.usesLeft,
                email: input.email,
                active: true,
            })
            .select('id,organisation_id,code,role,uses_left,email,active,created_at')
            .single()

        if (!error) {
            return {
                data: (data as OrganisationInvite | null) ?? null,
                error: null,
            }
        }

        if (!error.message.toLowerCase().includes('duplicate')) {
            return { data: null, error }
        }
    }

    const { error } = await supabase.from('organisation_invites').select('id').limit(1)
    return { data: null, error }
}

export async function deleteOrganisationInvite(input: {
    organisationId: string
    inviteId: string
}): Promise<Result<null>> {
    const supabase = createClient()

    const { error } = await supabase
        .from('organisation_invites')
        .delete()
        .eq('organisation_id', input.organisationId)
        .eq('id', input.inviteId)

    return { data: null, error }
}
