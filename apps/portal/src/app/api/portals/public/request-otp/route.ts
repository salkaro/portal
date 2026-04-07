import { createHash, randomInt } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { emitPortalEvent } from '@/services/emit-event'
import { ServiceError } from '@/services/service-error'

type RequestOtpBody = {
    portalId?: string
    email?: string
}

function hashOtp(input: { portalId: string; email: string; otp: string }): string {
    return createHash('sha256')
        .update(`${input.portalId}:${input.email.toLowerCase().trim()}:${input.otp}`)
        .digest('hex')
}

function generateOtp(): string {
    return randomInt(100000, 1000000).toString()
}

export async function POST(request: NextRequest) {
    try {
        const payload = (await request.json()) as RequestOtpBody

        if (!payload.portalId || !payload.email) {
            throw new ServiceError('portalId and email are required', 'invalid_request', 400)
        }

        const normalizedEmail = payload.email.toLowerCase().trim()
        const otp = generateOtp()
        const otpHash = hashOtp({
            portalId: payload.portalId,
            email: normalizedEmail,
            otp,
        })
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

        const supabase = await createClient()
        const { data: createdOtpId, error } = await supabase.rpc('create_portal_email_otp', {
            p_portal_id: payload.portalId,
            p_email: normalizedEmail,
            p_otp_hash: otpHash,
            p_expires_at: expiresAt,
        })

        if (error) {
            throw new ServiceError(error.message, 'forbidden', 403)
        }

        if (!createdOtpId) {
            throw new ServiceError('OTP could not be persisted', 'database_error', 500)
        }

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
                eventType: 'portal.otp_requested',
                actorType: 'external',
                actorLabel: normalizedEmail,
            })
        }

        const responsePayload: { message: string; devOtp?: string; devOtpId?: string } = {
            message: 'OTP sent',
        }

        if (process.env.NODE_ENV !== 'production') {
            responsePayload.devOtp = otp
            responsePayload.devOtpId = createdOtpId
        }

        return NextResponse.json(responsePayload)
    } catch (error) {
        const message = error instanceof ServiceError ? error.message : 'Unable to send OTP'
        const statusCode = error instanceof ServiceError ? error.status : 500

        return NextResponse.json({ message }, { status: statusCode })
    }
}
