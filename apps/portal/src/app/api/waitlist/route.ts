import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { ServiceError } from '@/services/service-error'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { email, agencySize, clientCount, tools, updateMethod, referralSource } = body

        if (!email || typeof email !== 'string') {
            throw new ServiceError('Email is required', 'invalid_request', 400)
        }

        const service = createServiceClient()

        // Check for duplicate email
        const { data: existing } = await service
            .from('waitlist')
            .select('id')
            .eq('email', email.toLowerCase().trim())
            .maybeSingle()

        if (existing) {
            // Treat as success — don't reveal whether email is already registered
            return NextResponse.json({ success: true })
        }

        const { error } = await service.from('waitlist').insert({
            email: email.toLowerCase().trim(),
            agency_size: agencySize ?? null,
            client_count: clientCount ?? null,
            tools_used: tools ?? [],
            update_method: updateMethod ?? null,
            referral_source: referralSource ?? null,
            access_granted: false,
        })

        if (error) {
            throw new ServiceError(error.message, 'database_error', 500)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        const message = error instanceof ServiceError ? error.message : 'Unable to join waitlist'
        const statusCode = error instanceof ServiceError ? error.status : 500
        return NextResponse.json({ message }, { status: statusCode })
    }
}
