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

// Module-level cache — survives client-side navigation, cleared on explicit refetch
const cache = new Map<string, Portal[]>()

export function usePortals(): UsePortalsResult {
    const { organisation, loading: organisationLoading } = useOrganisation()
    const organisationId = organisation?.id ?? null

    const cached = organisationId ? (cache.get(organisationId) ?? null) : null

    const [portals, setPortals] = useState<Portal[]>(cached ?? [])
    const [loading, setLoading] = useState(cached === null)
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

        if (!result.error) {
            cache.set(organisationId, result.data)
        }

        setPortals(result.data)
        setError(result.error)
        setLoading(false)
    }, [organisationId])

    useEffect(() => {
        if (organisationLoading) return

        // If we have cached data, show it immediately and skip the loading fetch
        if (organisationId && cache.has(organisationId)) {
            setPortals(cache.get(organisationId)!)
            setLoading(false)
            return
        }

        queueMicrotask(() => { void refetch() })
    }, [organisationLoading, organisationId, refetch])

    return { portals, loading, error, refetch }
}
