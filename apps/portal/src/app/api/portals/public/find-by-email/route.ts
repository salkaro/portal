import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ServiceError } from '@/services/service-error'

type FindByEmailBody = {
    email?: string
}

export async function POST(request: NextRequest) {
    try {
        const payload = (await request.json()) as FindByEmailBody

        if (!payload.email) {
            throw new ServiceError('email is required', 'invalid_request', 400)
        }

        const supabase = await createClient()
        const { data, error } = await supabase.rpc('find_portals_by_email', {
            p_email: payload.email.toLowerCase().trim(),
        })

        if (error) {
            throw new ServiceError(error.message, 'database_error', 500)
        }

        const portals = Array.isArray(data) ? data : []

        if (portals.length === 0) {
            throw new ServiceError('No portals found for this email', 'not_found', 404)
        }

        return NextResponse.json({ portals })
    } catch (error) {
        const message = error instanceof ServiceError ? error.message : 'Unable to find portals'
        const statusCode = error instanceof ServiceError ? error.status : 500

        return NextResponse.json({ message }, { status: statusCode })
    }
}
