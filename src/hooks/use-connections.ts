'use client'

import { useCallback, useEffect, useState } from 'react'
import type { PostgrestError } from '@supabase/supabase-js'
import { useOrganisation } from '@/hooks/use-organisation'
import { readSessionCache, writeSessionCache } from '@/lib/session-storage-cache'
import {
    getConnectedAccounts,
    type ConnectedAccount,
} from '@/services/supabase/connections'

type UseConnectionsResult = {
    connections: ConnectedAccount[]
    loading: boolean
    error: PostgrestError | null
    refetch: (silent?: boolean) => Promise<void>
}

const cache = new Map<string, ConnectedAccount[]>()

function getConnectionsCacheKey(organisationId: string): string {
    return `cache:connections:${organisationId}`
}

export function useConnections(): UseConnectionsResult {
    const { organisation, loading: organisationLoading } = useOrganisation()
    const organisationId = organisation?.id ?? null
    const cached = organisationId
        ? (cache.get(organisationId) ?? readSessionCache<ConnectedAccount[]>(getConnectionsCacheKey(organisationId)))
        : null

    if (organisationId && cached) {
        cache.set(organisationId, cached)
    }

    const [connections, setConnections] = useState<ConnectedAccount[]>(cached ?? [])
    const [loading, setLoading] = useState(cached === null)
    const [error, setError] = useState<PostgrestError | null>(null)

    const refetch = useCallback(async (silent = false) => {
        if (!organisationId) {
            setConnections([])
            setError(null)
            setLoading(false)
            return
        }

        if (!silent) setLoading(true)
        const result = await getConnectedAccounts(organisationId)

        if (!result.error) {
            cache.set(organisationId, result.data)
            writeSessionCache(getConnectionsCacheKey(organisationId), result.data)
        }

        setConnections(result.data)
        setError(result.error)
        setLoading(false)
    }, [organisationId])

    useEffect(() => {
        if (organisationLoading) {
            return
        }

        if (organisationId && cache.has(organisationId)) {
            setConnections(cache.get(organisationId) ?? [])
            setLoading(false)
            return
        }

        queueMicrotask(() => {
            void refetch()
        })
    }, [organisationLoading, refetch])

    return {
        connections,
        loading,
        error,
        refetch,
    }
}
