import { createClient } from '@/lib/supabase/client'
import type { AuthError, Session, User } from '@supabase/supabase-js'

type AuthResult<T> = { data: T; error: null } | { data: null; error: AuthError }

export async function signUpWithEmail(
    email: string,
    password: string,
    fullName: string
): Promise<AuthResult<{ user: User | null }>> {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName },
        },
    })
    if (error) return { data: null, error }
    return { data: { user: data.user }, error: null }
}

export async function signInWithEmail(
    email: string,
    password: string
): Promise<AuthResult<{ user: User | null }>> {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { data: null, error }
    return { data: { user: data.user }, error: null }
}

export async function signInWithGoogle(): Promise<AuthResult<{ url: string | null }>> {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: process.env.NEXT_PUBLIC_APP_URL + '/api/auth/callback',
        },
    })
    if (error) return { data: null, error }
    return { data: { url: data.url }, error: null }
}

export async function requestPasswordReset(email: string): Promise<{ error: AuthError | null }> {
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: process.env.NEXT_PUBLIC_APP_URL + '/api/auth/callback?type=recovery',
    })
    return { error }
}

export async function updatePassword(password: string): Promise<{ error: AuthError | null }> {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    return { error }
}

export async function signOut(): Promise<{ data: null; error: AuthError | null }> {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    return { data: null, error }
}

export async function getSession(): Promise<AuthResult<{ session: Session | null }>> {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getSession()
    if (error) return { data: null, error }
    return { data: { session: data.session }, error: null }
}

export async function getUser(): Promise<AuthResult<{ user: User | null }>> {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error) return { data: null, error }
    return { data: { user: data.user }, error: null }
}

type UpdateCurrentUserProfileInput = {
    fullName: string
    avatarUrl: string
}

function getSafeAvatarUrl(avatarUrl: string): string | null {
    if (!avatarUrl) return null
    if (avatarUrl.startsWith('data:')) return null
    return avatarUrl
}

export async function updateCurrentUserProfile(
    input: UpdateCurrentUserProfileInput
): Promise<AuthResult<{ user: User | null }>> {
    const supabase = createClient()
    const safeAvatarUrl = getSafeAvatarUrl(input.avatarUrl)
    const { data, error } = await supabase.auth.updateUser({
        data: {
            full_name: input.fullName,
            avatar_url: safeAvatarUrl,
        },
    })

    if (error) return { data: null, error }
    return { data: { user: data.user }, error: null }
}
