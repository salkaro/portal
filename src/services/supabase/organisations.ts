import type { PostgrestError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Organisation } from '@/types/organisation'

type OrganisationResult = {
    data: Organisation | null
    error: PostgrestError | null
}

type OrganisationWithApprovalResult = {
    data: Organisation | null
    approved: boolean
    error: PostgrestError | null
}

type CreateOrganisationInput = {
    userId: string
    name: string
    iconUrl?: string | null
}

type UpdateOrganisationInput = {
    organisationId: string
    name: string
    iconUrl: string | null
    stripeCustomerId: string | null
    subscription: 'free' | 'pro'
}

type OrganisationMembershipRow = {
    organisation: Organisation | null
    approved: boolean
}

const ORGANISATION_SELECT =
    'id,name,icon_url,stripe_customer_id,subscription,created_at,updated_at'

function normalizeJoinCode(code: string): string {
    return code.trim().toUpperCase()
}

export async function getCurrentUserOrganisation(userId: string): Promise<OrganisationWithApprovalResult> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('organisation_members')
        .select(`organisation:organisations(${ORGANISATION_SELECT}), approved`)
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle<OrganisationMembershipRow>()

    if (error) return { data: null, approved: false, error }
    return { data: data?.organisation ?? null, approved: data?.approved ?? false, error: null }
}

export async function createOrganisationForUser(
    input: CreateOrganisationInput
): Promise<OrganisationResult> {
    const supabase = createClient()
    const organisationId = crypto.randomUUID()

    const { error: organisationError } = await supabase.from('organisations').insert({
        id: organisationId,
        name: input.name,
        icon_url: input.iconUrl ?? null,
        subscription: 'free',
    })

    if (organisationError) {
        return { data: null, error: organisationError }
    }

    const { error: membershipError } = await supabase.from('organisation_members').insert({
        organisation_id: organisationId,
        user_id: input.userId,
        role: 'owner',
        approved: true,
    })

    if (membershipError) {
        return { data: null, error: membershipError }
    }

    const { data: organisation, error: selectError } = await supabase
        .from('organisations')
        .select(ORGANISATION_SELECT)
        .eq('id', organisationId)
        .single<Organisation>()

    if (selectError) {
        return { data: null, error: selectError }
    }

    return { data: organisation, error: null }
}

export async function joinOrganisationByCode(input: {
    code: string
}): Promise<OrganisationWithApprovalResult> {
    const supabase = createClient()

    const { data, error } = await supabase.rpc('join_organisation_by_code', {
        p_join_code: normalizeJoinCode(input.code),
    })

    if (error) return { data: null, approved: false, error }

    const organisation = Array.isArray(data) ? (data[0] as Organisation | undefined) : null
    // Joined members always start pending — approved: false
    return { data: organisation ?? null, approved: false, error: null }
}

export async function updateOrganisation(
    input: UpdateOrganisationInput
): Promise<OrganisationResult> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('organisations')
        .update({
            name: input.name,
            icon_url: input.iconUrl,
            stripe_customer_id: input.stripeCustomerId,
            subscription: input.subscription,
        })
        .eq('id', input.organisationId)
        .select(ORGANISATION_SELECT)
        .single<Organisation>()

    if (error) return { data: null, error }
    return { data, error: null }
}
