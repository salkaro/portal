import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
    getAuthenticatedOrganisationContextOrThrow,
    getAuthenticatedUserOrThrow,
} from '@/services/oauth'
import { ServiceError } from '@/services/service-error'
import { PLAN_LIMITS, PLANS } from '@/constants/plans'
import type { PlanTier } from '@/lib/plans'

export type PortalEvent = {
    id: string
    organisation_id: string
    portal_id: string | null
    event_type: string
    actor_type: 'internal' | 'external'
    actor_label: string | null
    actor_user_id: string | null
    metadata: Record<string, unknown> | null
    created_at: string
}

export async function GET(_request: NextRequest) {
    try {
        const user = await getAuthenticatedUserOrThrow()
        const { organisationId } = await getAuthenticatedOrganisationContextOrThrow(user.id)

        const supabase = await createClient()

        // Fetch subscription to gate access
        const { data: org, error: orgError } = await supabase
            .from('organisations')
            .select('subscription')
            .eq('id', organisationId)
            .single<{ subscription: string }>()

        if (orgError || !org) {
            throw new ServiceError('Organisation not found', 'not_found', 404)
        }

        const subscription = org.subscription as PlanTier
        const limit = PLAN_LIMITS[subscription].ACTIVITY_EVENTS

        if (subscription !== PLANS.PRO || limit === 0) {
            throw new ServiceError('Activity log requires a Pro plan', 'forbidden', 403)
        }

        const { data, error } = await supabase
            .from('portal_events')
            .select('id,organisation_id,portal_id,event_type,actor_type,actor_label,actor_user_id,metadata,created_at')
            .eq('organisation_id', organisationId)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) {
            throw new ServiceError(error.message, 'database_error', 500)
        }

        return NextResponse.json({ events: data as PortalEvent[] })
    } catch (error) {
        const message = error instanceof ServiceError ? error.message : 'Unable to load activity'
        const statusCode = error instanceof ServiceError ? error.status : 500
        return NextResponse.json({ message }, { status: statusCode })
    }
}
