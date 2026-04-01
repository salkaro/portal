import { createHash } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { emitPortalEvent } from '@/services/emit-event'
import { ServiceError } from '@/services/service-error'

type VerifyOtpBody = {
    portalId?: string
    email?: string
    otp?: string
}

function hashOtp(input: { portalId: string; email: string; otp: string }): string {
    return createHash('sha256')
        .update(`${input.portalId}:${input.email.toLowerCase().trim()}:${input.otp}`)
        .digest('hex')
}

export async function POST(request: NextRequest) {
    try {
        const payload = (await request.json()) as VerifyOtpBody

        if (!payload.portalId || !payload.email || !payload.otp) {
            throw new ServiceError('portalId, email, and otp are required', 'invalid_request', 400)
        }

        const normalizedEmail = payload.email.toLowerCase().trim()
        const otpHash = hashOtp({
            portalId: payload.portalId,
            email: normalizedEmail,
            otp: payload.otp,
        })

        const supabase = await createClient()
        const { data, error } = await supabase.rpc('verify_portal_email_otp', {
            p_portal_id: payload.portalId,
            p_email: normalizedEmail,
            p_otp_hash: otpHash,
        })

        if (error) {
            throw new ServiceError(error.message, 'forbidden', 403)
        }

        if (!data) {
            throw new ServiceError('Invalid or expired OTP', 'forbidden', 403)
        }

        const { data: portal, error: portalError } = await supabase.rpc('get_public_portal_by_id', {
            p_portal_id: payload.portalId,
        })

        if (portalError) {
            throw new ServiceError(portalError.message, 'database_error', 500)
        }

        const normalizedPortal = Array.isArray(portal) ? portal[0] : null

        if (!normalizedPortal) {
            throw new ServiceError('Portal not found', 'not_found', 404)
        }

        // Resolve organisation_id for event (security definer query via service client)
        const serviceClient = createServiceClient()
        const { data: portalRow } = await serviceClient
            .from('portals')
            .select('organisation_id')
            .eq('id', payload.portalId)
            .maybeSingle<{ organisation_id: string }>()

        if (portalRow?.organisation_id) {
            await emitPortalEvent({
                organisationId: portalRow.organisation_id,
                portalId: payload.portalId,
                eventType: 'portal.otp_verified',
                actorType: 'external',
                actorLabel: normalizedEmail,
            })
        }

        return NextResponse.json({
            ...normalizedPortal,
            hasInstantAccess: true,
        })
    } catch (error) {
        const message = error instanceof ServiceError ? error.message : 'Unable to verify OTP'
        const statusCode = error instanceof ServiceError ? error.status : 500

        return NextResponse.json({ message }, { status: statusCode })
    }
}
