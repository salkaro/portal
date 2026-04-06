import { NextResponse, type NextRequest } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { ROUTES } from '@/constants/routes'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null

    const supabase = await createClient()

    // Email OTP / password reset
    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type })
        if (error) {
            return NextResponse.redirect(`${origin}${ROUTES.LOGIN}?error=auth_failed`)
        }
        if (type === 'recovery') {
            return NextResponse.redirect(`${origin}${ROUTES.RESET}?verified=1`)
        }
        return NextResponse.redirect(`${origin}${ROUTES.DASHBOARD}`)
    }

    // OAuth code exchange (Google etc.) and password recovery
    if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
            return NextResponse.redirect(`${origin}${ROUTES.RESET}?error_code=otp_expired`)
        }

        // Password recovery — skip waitlist check, go straight to reset form
        if (type === 'recovery') {
            return NextResponse.redirect(`${origin}${ROUTES.RESET}?verified=1`)
        }

        // Signup gate — check waitlist access for new OAuth users
        const email = data.user?.email
        if (email) {
            const service = createServiceClient()
            const { data: entry } = await service
                .from('waitlist')
                .select('access_granted')
                .eq('email', email.toLowerCase().trim())
                .maybeSingle<{ access_granted: boolean }>()

            if (!entry?.access_granted) {
                const userId = data.user?.id
                await supabase.auth.signOut()
                if (userId) {
                    await service.auth.admin.deleteUser(userId)
                }
                return NextResponse.redirect(`${origin}${ROUTES.GET_STARTED}?error=no_access`)
            }
        }

        return NextResponse.redirect(`${origin}${ROUTES.DASHBOARD}`)
    }

    return NextResponse.redirect(`${origin}${ROUTES.LOGIN}?error=auth_failed`)
}
