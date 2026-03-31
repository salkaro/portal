'use client'

import { useCallback, useEffect, useState } from 'react'
import type { PostgrestError } from '@supabase/supabase-js'
import {
    getOrganisationInvites,
    type OrganisationInvite,
} from '@/services/supabase/employees'

export function useOrganisationInvites(organisationId: string | null | undefined) {
    const [invites, setInvites] = useState<OrganisationInvite[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<PostgrestError | null>(null)

    const refetch = useCallback(async () => {
        if (!organisationId) {
            setInvites([])
            setError(null)
            setLoading(false)
            return
        }

        setLoading(true)
        const result = await getOrganisationInvites(organisationId)
        setInvites(result.data)
        setError(result.error)
        setLoading(false)
    }, [organisationId])

    useEffect(() => {
        void refetch()
    }, [refetch])

    return { invites, loading, error, refetch }
}
