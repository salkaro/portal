import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'
import { ROUTES } from '@/constants/routes'

const PUBLIC_ROUTES = new Set<string>([
    ROUTES.HOME,
    ROUTES.LOGIN,
    ROUTES.GET_STARTED,
    '/view',
])

const PROTECTED_ROUTE_PREFIXES = [
    ROUTES.DASHBOARD,
    ROUTES.PORTALS,
    ROUTES.CLIENTS,
    ROUTES.ACTIVITY,
    ROUTES.EMPLOYEES,
    ROUTES.INTEGRATIONS,
    ROUTES.SETTINGS,
]

export async function proxy(request: NextRequest) {
    const { response, user } = await updateSession(request);

    const { pathname } = request.nextUrl

    // Redirect authenticated users away from login/signup pages.
    if (user && (pathname === ROUTES.LOGIN || pathname === ROUTES.GET_STARTED)) {
        return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url))
    }

    // Allow public routes and portal token routes through
    if (PUBLIC_ROUTES.has(pathname as typeof ROUTES[keyof typeof ROUTES]) || pathname.startsWith('/portal/')) {
        return response
    }

    // Protect all application routes.
    const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some((routePrefix) =>
        pathname === routePrefix || pathname.startsWith(`${routePrefix}/`)
    )

    if (!user && isProtectedRoute) {
        return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url))
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico, sitemap.xml, robots.txt
         * - public folder assets
         */
        '/((?!api|_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
