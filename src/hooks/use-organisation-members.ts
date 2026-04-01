'use client'

import { useCallback, useEffect, useState } from 'react'
import type { PostgrestError } from '@supabase/supabase-js'
import {
    getOrganisationMembers,
    type OrganisationMember,
} from '@/services/supabase/employees'

export function useOrganisationMembers(organisationId: string | null | undefined) {
    const [members, setMembers] = useState<OrganisationMember[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<PostgrestError | null>(null)

    const refetch = useCallback(async (silent = false) => {
        if (!organisationId) {
            setMembers([])
            setError(null)
            setLoading(false)
            return
        }

        if (!silent) setLoading(true)
        const result = await getOrganisationMembers(organisationId)
        setMembers(result.data)
        setError(result.error)
        setLoading(false)
    }, [organisationId])

    useEffect(() => {
        void refetch()
    }, [refetch])

    return { members, loading, error, refetch }
}
