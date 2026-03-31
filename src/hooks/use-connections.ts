'use client'

import { useCallback, useEffect, useState } from 'react'
import type { PostgrestError } from '@supabase/supabase-js'
import { useOrganisation } from '@/hooks/use-organisation'
import {
    getConnectedAccounts,
    type ConnectedAccount,
} from '@/services/supabase/connections'

type UseConnectionsResult = {
    connections: ConnectedAccount[]
    loading: boolean
    error: PostgrestError | null
    refetch: () => Promise<void>
}

export function useConnections(): UseConnectionsResult {
    const { organisation, loading: organisationLoading } = useOrganisation()
    const organisationId = organisation?.id ?? null
    const [connections, setConnections] = useState<ConnectedAccount[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<PostgrestError | null>(null)

    const refetch = useCallback(async () => {
        if (!organisationId) {
            setConnections([])
            setError(null)
            setLoading(false)
            return
        }

        setLoading(true)
        const result = await getConnectedAccounts(organisationId)
        setConnections(result.data)
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
        connections,
        loading,
        error,
        refetch,
    }
}
