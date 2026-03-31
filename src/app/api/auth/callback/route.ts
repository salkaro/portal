import { NextResponse, type NextRequest } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
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
        return NextResponse.redirect(`${origin}${ROUTES.DASHBOARD}`)
    }

    // OAuth code exchange (Google etc.)
    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
            return NextResponse.redirect(`${origin}${ROUTES.LOGIN}?error=auth_failed`)
        }
        return NextResponse.redirect(`${origin}${ROUTES.DASHBOARD}`)
    }

    return NextResponse.redirect(`${origin}${ROUTES.LOGIN}?error=auth_failed`)
}
