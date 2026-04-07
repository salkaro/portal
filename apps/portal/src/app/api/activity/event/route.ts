// Internal event ingestion endpoint — authenticated team members only.
// Called fire-and-forget from client-side service functions after successful mutations.

import { NextResponse, type NextRequest } from 'next/server'
import {
    getAuthenticatedOrganisationContextOrThrow,
    getAuthenticatedUserOrThrow,
} from '@/services/oauth'
import { emitPortalEvent } from '@/services/emit-event'
import { ServiceError } from '@/services/service-error'

type EmitEventBody = {
    portalId?: string | null
    eventType?: string
    actorLabel?: string | null
    metadata?: Record<string, unknown> | null
}

export async function POST(request: NextRequest) {
    try {
        const payload = (await request.json()) as EmitEventBody

        if (!payload.eventType) {
            throw new ServiceError('eventType is required', 'invalid_request', 400)
        }

        const user = await getAuthenticatedUserOrThrow()
        const { organisationId } = await getAuthenticatedOrganisationContextOrThrow(user.id)

        // Resolve the actor label from the user's profile
        const actorLabel =
            payload.actorLabel ??
            (user.user_metadata?.full_name as string | undefined) ??
            user.email ??
            null

        await emitPortalEvent({
            organisationId,
            portalId: payload.portalId ?? null,
            eventType: payload.eventType,
            actorType: 'internal',
            actorLabel,
            actorUserId: user.id,
            metadata: payload.metadata ?? null,
        })

        return NextResponse.json({ ok: true })
    } catch (error) {
        const message = error instanceof ServiceError ? error.message : 'Unable to record event'
        const statusCode = error instanceof ServiceError ? error.status : 500
        return NextResponse.json({ message }, { status: statusCode })
    }
}
