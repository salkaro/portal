'use client'

import { useCallback, useEffect, useState } from 'react'
import type { PostgrestError } from '@supabase/supabase-js'
import { readSessionCache, writeSessionCache } from '@/lib/session-storage-cache'
import {
    getOrganisationMembers,
    type OrganisationMember,
} from '@/services/supabase/employees'

const cache = new Map<string, OrganisationMember[]>()

function getMembersCacheKey(organisationId: string): string {
    return `cache:organisation-members:${organisationId}`
}

export function useOrganisationMembers(organisationId: string | null | undefined) {
    const cacheKey = organisationId ? getMembersCacheKey(organisationId) : null
    const cached = organisationId
        ? (cache.get(organisationId) ?? readSessionCache<OrganisationMember[]>(getMembersCacheKey(organisationId)))
        : null

    if (organisationId && cached) {
        cache.set(organisationId, cached)
    }

    const [members, setMembers] = useState<OrganisationMember[]>(cached ?? [])
    const [loading, setLoading] = useState(cached === null)
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

        if (!result.error) {
            cache.set(organisationId, result.data)
            writeSessionCache(getMembersCacheKey(organisationId), result.data)
        }

        setMembers(result.data)
        setError(result.error)
        setLoading(false)
    }, [organisationId])

    useEffect(() => {
        if (organisationId && cache.has(organisationId)) {
            setMembers(cache.get(organisationId) ?? [])
            setLoading(false)
            return
        }

        if (!organisationId && cacheKey) {
            setMembers([])
            setLoading(false)
        }

        void refetch()
    }, [cacheKey, organisationId, refetch])

    return { members, loading, error, refetch }
}
