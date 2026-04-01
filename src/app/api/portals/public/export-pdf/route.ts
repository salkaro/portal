import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { emitPortalEvent } from '@/services/emit-event'
import { ServiceError } from '@/services/service-error'

type ExportPdfBody = {
    portalId?: string
}

export async function POST(request: NextRequest) {
    try {
        const payload = (await request.json()) as ExportPdfBody

        if (!payload.portalId) {
            throw new ServiceError('portalId is required', 'invalid_request', 400)
        }

        const serviceClient = createServiceClient()
        const { data: portalRow, error } = await serviceClient
            .from('portals')
            .select('organisation_id')
            .eq('id', payload.portalId)
            .maybeSingle<{ organisation_id: string }>()

        if (error) {
            throw new ServiceError(error.message, 'database_error', 500)
        }

        if (!portalRow?.organisation_id) {
            throw new ServiceError('Portal not found', 'not_found', 404)
        }

        await emitPortalEvent({
            organisationId: portalRow.organisation_id,
            portalId: payload.portalId,
            eventType: 'portal.pdf_exported',
            actorType: 'external',
            actorLabel: null,
        })

        return NextResponse.json({ ok: true })
    } catch (error) {
        const message = error instanceof ServiceError ? error.message : 'Unable to record PDF export event'
        const statusCode = error instanceof ServiceError ? error.status : 500
        return NextResponse.json({ message }, { status: statusCode })
    }
}
