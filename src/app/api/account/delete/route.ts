import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getAuthenticatedUserOrThrow } from '@/services/oauth'
import { ServiceError } from '@/services/service-error'

export async function DELETE() {
    try {
        const user = await getAuthenticatedUserOrThrow()

        // Use server client (with RLS) only to verify membership — reads are fine
        const supabase = await createClient()
        const { data: membership } = await supabase
            .from('organisation_members')
            .select('organisation_id,role')
            .eq('user_id', user.id)
            .maybeSingle<{ organisation_id: string; role: 'owner' | 'admin' | 'member' }>()

        // All mutations use service client to bypass RLS
        const service = createServiceClient()
        const isOwner = membership?.role === 'owner'

        if (isOwner && membership?.organisation_id) {
            // Delete all portals for the organisation (cascades related data)
            const { error: portalsError } = await service
                .from('portals')
                .delete()
                .eq('organisation_id', membership.organisation_id)

            if (portalsError) {
                throw new ServiceError(portalsError.message, 'database_error', 500)
            }

            // Delete the organisation (cascades connected_accounts, invites, members, events)
            const { error: orgError } = await service
                .from('organisations')
                .delete()
                .eq('id', membership.organisation_id)

            if (orgError) {
                throw new ServiceError(orgError.message, 'database_error', 500)
            }
        } else if (membership?.organisation_id) {
            // Non-owner: just remove them from the organisation
            const { error: memberError } = await service
                .from('organisation_members')
                .delete()
                .eq('organisation_id', membership.organisation_id)
                .eq('user_id', user.id)

            if (memberError) {
                throw new ServiceError(memberError.message, 'database_error', 500)
            }
        }
        const { error: authError } = await service.auth.admin.deleteUser(user.id)

        if (authError) {
            throw new ServiceError(authError.message, 'database_error', 500)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        const message = error instanceof ServiceError ? error.message : 'Unable to delete account'
        const statusCode = error instanceof ServiceError ? error.status : 500
        return NextResponse.json({ message }, { status: statusCode })
    }
}
