'use client'

import { useCallback, useEffect, useState } from 'react'
import type { PostgrestError } from '@supabase/supabase-js'
import { readSessionCache, writeSessionCache } from '@/lib/session-storage-cache'
import {
    getOrganisationInvites,
    type OrganisationInvite,
} from '@/services/supabase/employees'

const cache = new Map<string, OrganisationInvite[]>()

function getInvitesCacheKey(organisationId: string): string {
    return `cache:organisation-invites:${organisationId}`
}

export function useOrganisationInvites(organisationId: string | null | undefined) {
    const cached = organisationId
        ? (cache.get(organisationId) ?? readSessionCache<OrganisationInvite[]>(getInvitesCacheKey(organisationId)))
        : null

    if (organisationId && cached) {
        cache.set(organisationId, cached)
    }

    const [invites, setInvites] = useState<OrganisationInvite[]>(cached ?? [])
    const [loading, setLoading] = useState(cached === null)
    const [error, setError] = useState<PostgrestError | null>(null)

    const refetch = useCallback(async (silent = false) => {
        if (!organisationId) {
            setInvites([])
            setError(null)
            setLoading(false)
            return
        }

        if (!silent) setLoading(true)
        const result = await getOrganisationInvites(organisationId)

        if (!result.error) {
            cache.set(organisationId, result.data)
            writeSessionCache(getInvitesCacheKey(organisationId), result.data)
        }

        setInvites(result.data)
        setError(result.error)
        setLoading(false)
    }, [organisationId])

    useEffect(() => {
        if (organisationId && cache.has(organisationId)) {
            setInvites(cache.get(organisationId) ?? [])
            setLoading(false)
            return
        }

        void refetch()
    }, [organisationId, refetch])

    return { invites, loading, error, refetch }
}
