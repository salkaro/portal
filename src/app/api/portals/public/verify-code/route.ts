import { createHash } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ServiceError } from '@/services/service-error'

type VerifyCodeBody = {
    portalId?: string
    code?: string
}

function hashCode(code: string): string {
    return createHash('sha256').update(code.trim()).digest('hex')
}

export async function POST(request: NextRequest) {
    try {
        const payload = (await request.json()) as VerifyCodeBody

        if (!payload.portalId || !payload.code) {
            throw new ServiceError('portalId and code are required', 'invalid_request', 400)
        }

        const codeHash = hashCode(payload.code)
        const supabase = await createClient()

        const { data, error } = await supabase.rpc('verify_portal_access_code', {
            p_portal_id: payload.portalId,
            p_code_hash: codeHash,
        })

        if (error) {
            throw new ServiceError(error.message, 'forbidden', 403)
        }

        if (!data) {
            throw new ServiceError('Invalid portal code', 'forbidden', 403)
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

        return NextResponse.json({
            ...normalizedPortal,
            hasInstantAccess: true,
        })
    } catch (error) {
        const message = error instanceof ServiceError ? error.message : 'Unable to verify portal code'
        const statusCode = error instanceof ServiceError ? error.status : 500

        return NextResponse.json({ message }, { status: statusCode })
    }
}
