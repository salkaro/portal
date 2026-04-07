import type { PortalEvent } from '@/app/api/activity/route'
import { ServiceError } from '@/services/service-error'

// ----------------------------------------------------------------
// Internal event emitter — call after successful client-side mutations.
// Fire-and-forget: never throws, never blocks.
// ----------------------------------------------------------------

type EmitInternalEventInput = {
    portalId?: string | null
    eventType: string
    actorLabel?: string | null
    metadata?: Record<string, unknown> | null
}

export function emitInternalEvent(input: EmitInternalEventInput): void {
    void fetch('/api/activity/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    })
}

// ----------------------------------------------------------------
// Fetch activity log (pro plan only)
// ----------------------------------------------------------------

export async function fetchActivityEvents(): Promise<PortalEvent[]> {
    const response = await fetch('/api/activity')

    if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null
        throw new ServiceError(
            errorPayload?.message ?? 'Unable to load activity',
            'upstream_error',
            response.status
        )
    }

    const { events } = (await response.json()) as { events: PortalEvent[] }
    return events
}
