import type { PostgrestError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { emitInternalEvent } from '@/services/activity'

export type OrganisationMember = {
    organisation_id: string
    user_id: string
    role: 'owner' | 'admin' | 'member'
    approved: boolean
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

    if (!error) {
        emitInternalEvent({
            eventType: 'organisation.member.role_changed',
            metadata: {
                targetUserId: input.userId,
                role: input.role,
            },
        })
    }

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

    if (!error) {
        emitInternalEvent({
            eventType: 'organisation.member.removed',
            metadata: {
                targetUserId: input.userId,
            },
        })
    }

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
    inviteLimit: number
}): Promise<Result<OrganisationInvite | null>> {

    const supabase = createClient()

    // Enforce per-org active invite code limit
    const { count, error: countError } = await supabase
        .from('organisation_invites')
        .select('id', { count: 'exact', head: true })
        .eq('organisation_id', input.organisationId)
        .eq('active', true)

    if (countError) return { data: null, error: countError }

    if (Number.isFinite(input.inviteLimit) && (count ?? 0) >= input.inviteLimit) {
        return {
            data: null,
            error: {
                message: `You have reached the limit of ${input.inviteLimit} active invite codes for your plan.`,
                details: '',
                hint: '',
                code: 'invite_limit_exceeded',
            } as PostgrestError,
        }
    }

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
            emitInternalEvent({
                eventType: 'organisation.invite.created',
                metadata: {
                    role: input.role,
                    email: input.email,
                    usesLeft: input.usesLeft,
                },
            })

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

export async function approveOrganisationMember(input: {
    organisationId: string
    userId: string
}): Promise<Result<null>> {
    const supabase = createClient()
    const { error } = await supabase
        .from('organisation_members')
        .update({ approved: true })
        .eq('organisation_id', input.organisationId)
        .eq('user_id', input.userId)

    if (!error) {
        emitInternalEvent({
            eventType: 'organisation.member.approved',
            metadata: {
                targetUserId: input.userId,
            },
        })
    }

    return { data: null, error }
}

export async function getCurrentUserMembership(organisationId: string): Promise<Result<{ approved: boolean } | null>> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: null }

    const { data, error } = await supabase
        .from('organisation_members')
        .select('approved')
        .eq('organisation_id', organisationId)
        .eq('user_id', user.id)
        .maybeSingle()

    return { data: data as { approved: boolean } | null, error }
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

    if (!error) {
        emitInternalEvent({
            eventType: 'organisation.invite.deleted',
            metadata: {
                inviteId: input.inviteId,
            },
        })
    }

    return { data: null, error }
}
