// Service-role event emitter used by API routes.
// Returns false on write failure so caller paths can stay resilient.

import { createServiceClient } from '@/lib/supabase/service'
import { PRO_PLAN_LIMITS } from '@/constants/plans'

type ActorType = 'internal' | 'external'

type EmitEventInput = {
    organisationId: string
    portalId?: string | null
    eventType: string
    actorType: ActorType
    actorLabel?: string | null
    actorUserId?: string | null
    metadata?: Record<string, unknown> | null
}

export async function emitPortalEvent(input: EmitEventInput): Promise<boolean> {
    const client = createServiceClient()

    const { error } = await client.rpc('insert_portal_event', {
        p_organisation_id: input.organisationId,
        p_portal_id: input.portalId ?? null,
        p_event_type: input.eventType,
        p_actor_type: input.actorType,
        p_actor_label: input.actorLabel ?? null,
        p_actor_user_id: input.actorUserId ?? null,
        p_metadata: input.metadata ?? null,
        p_limit: PRO_PLAN_LIMITS.ACTIVITY_EVENTS,
    })

    return !error
}
