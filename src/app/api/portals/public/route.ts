import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ServiceError } from '@/services/service-error'

export async function GET(request: NextRequest) {
    try {
        const portalId = request.nextUrl.searchParams.get('portal_id')

        if (!portalId) {
            throw new ServiceError('portal_id is required', 'invalid_request', 400)
        }

        const supabase = await createClient()

        const { data: portal, error: portalError } = await supabase.rpc('get_public_portal_by_id', {
            p_portal_id: portalId,
        })

        if (portalError) {
            throw new ServiceError(portalError.message, 'database_error', 500)
        }

        const normalizedPortal = Array.isArray(portal) ? portal[0] : null

        if (!normalizedPortal) {
            throw new ServiceError('Portal not found', 'not_found', 404)
        }

        const { data: linkAccess, error: linkAccessError } = await supabase.rpc(
            'can_access_portal_without_auth',
            {
                p_portal_id: portalId,
            }
        )

        if (linkAccessError) {
            throw new ServiceError(linkAccessError.message, 'database_error', 500)
        }

        const hasInstantAccess = Boolean(linkAccess)

        return NextResponse.json({
            ...normalizedPortal,
            import_config: hasInstantAccess ? normalizedPortal.import_config : null,
            customization: hasInstantAccess ? normalizedPortal.customization : null,
            hasInstantAccess,
        })
    } catch (error) {
        const message = error instanceof ServiceError ? error.message : 'Unable to load portal'
        const statusCode = error instanceof ServiceError ? error.status : 500

        return NextResponse.json({ message }, { status: statusCode })
    }
}
