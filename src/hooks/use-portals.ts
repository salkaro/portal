'use client'

import { useCallback, useEffect, useState } from 'react'
import type { PostgrestError } from '@supabase/supabase-js'
import { useOrganisation } from '@/hooks/use-organisation'
import { getPortals } from '@/services/supabase/portals'
import type { Portal } from '@/types/portal'

type UsePortalsResult = {
    portals: Portal[]
    loading: boolean
    error: PostgrestError | null
    refetch: () => Promise<void>
}

export function usePortals(): UsePortalsResult {
    const { organisation, loading: organisationLoading } = useOrganisation()
    const organisationId = organisation?.id ?? null
    const [portals, setPortals] = useState<Portal[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<PostgrestError | null>(null)

    const refetch = useCallback(async () => {
        if (!organisationId) {
            setPortals([])
            setError(null)
            setLoading(false)
            return
        }

        setLoading(true)
        const result = await getPortals(organisationId)
        setPortals(result.data)
        setError(result.error)
        setLoading(false)
    }, [organisationId])

    useEffect(() => {
        if (organisationLoading) {
            return
        }

        queueMicrotask(() => {
            void refetch()
        })
    }, [organisationLoading, refetch])

    return {
        portals,
        loading,
        error,
        refetch,
    }
}
