import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { ServiceError } from '@/services/service-error'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { email } = body

        if (!email || typeof email !== 'string') {
            throw new ServiceError('Email is required', 'invalid_request', 400)
        }

        const service = createServiceClient()

        const { data } = await service
            .from('waitlist')
            .select('access_granted')
            .eq('email', email.toLowerCase().trim())
            .maybeSingle<{ access_granted: boolean }>()

        if (!data?.access_granted) {
            throw new ServiceError(
                'This email is not on the early access list. Join the waitlist at /waitlist.',
                'forbidden',
                403
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        const message = error instanceof ServiceError ? error.message : 'Unable to verify access'
        const statusCode = error instanceof ServiceError ? error.status : 500
        return NextResponse.json({ message }, { status: statusCode })
    }
}
