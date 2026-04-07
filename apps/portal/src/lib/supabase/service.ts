import { createClient } from '@supabase/supabase-js'

// Service role client — bypasses RLS. SERVER ONLY.
// Never import this in components or client-side code.
export function createServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!,
    )
}
