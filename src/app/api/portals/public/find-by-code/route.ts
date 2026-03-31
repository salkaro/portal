import { createHash } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ServiceError } from '@/services/service-error'

type FindByCodeBody = {
    code?: string
}

function hashCode(code: string): string {
    return createHash('sha256').update(code.trim()).digest('hex')
}

export async function POST(request: NextRequest) {
    try {
        const payload = (await request.json()) as FindByCodeBody

        if (!payload.code) {
            throw new ServiceError('code is required', 'invalid_request', 400)
        }

        const codeHash = hashCode(payload.code)
        const supabase = await createClient()

        const { data, error } = await supabase.rpc('find_portal_by_access_code', {
            p_code_hash: codeHash,
        })

        if (error) {
            throw new ServiceError(error.message, 'database_error', 500)
        }

        const portals = Array.isArray(data) ? data : []
        const portal = portals[0] ?? null

        if (!portal) {
            throw new ServiceError('Invalid access code', 'not_found', 404)
        }

        return NextResponse.json({ portal })
    } catch (error) {
        const message = error instanceof ServiceError ? error.message : 'Unable to verify access code'
        const statusCode = error instanceof ServiceError ? error.status : 500

        return NextResponse.json({ message }, { status: statusCode })
    }
}
