'use client'

import { useCallback, useEffect, useState } from 'react'
import type { PortalEvent } from '@/app/api/activity/route'
import { PLANS } from '@/constants/plans'
import { useOrganisation } from '@/hooks/use-organisation'
import { readSessionCache, writeSessionCache } from '@/lib/session-storage-cache'
import { fetchActivityEvents } from '@/services/activity'

type UseActivityEventsResult = {
    events: PortalEvent[]
    loading: boolean
    error: Error | null
    refetch: () => Promise<void>
}

// Module-level cache for smoother navigation
const cache = new Map<string, PortalEvent[]>()

function getActivityCacheKey(organisationId: string): string {
    return `cache:activity:${organisationId}`
}

export function useActivityEvents(): UseActivityEventsResult {
    const { organisation, loading: organisationLoading } = useOrganisation()
    const organisationId = organisation?.id ?? null
    const subscription = organisation?.subscription

    const cached = organisationId
        ? (cache.get(organisationId) ?? readSessionCache<PortalEvent[]>(getActivityCacheKey(organisationId)))
        : null

    if (organisationId && cached) {
        cache.set(organisationId, cached)
    }

    const [events, setEvents] = useState<PortalEvent[]>(cached ?? [])
    const [loading, setLoading] = useState(cached === null)
    const [error, setError] = useState<Error | null>(null)

    const refetch = useCallback(async () => {
        if (!organisationId) {
            setEvents([])
            setError(null)
            setLoading(false)
            return
        }

        // Free plan has no persisted activity history by design.
        if (subscription === PLANS.FREE) {
            cache.set(organisationId, [])
            writeSessionCache(getActivityCacheKey(organisationId), [])
            setEvents([])
            setError(null)
            setLoading(false)
            return
        }

        setLoading(true)

        try {
            const data = await fetchActivityEvents()
            cache.set(organisationId, data)
            writeSessionCache(getActivityCacheKey(organisationId), data)
            setEvents(data)
            setError(null)
        } catch (nextError) {
            setEvents([])
            setError(nextError as Error)
        } finally {
            setLoading(false)
        }
    }, [organisationId, subscription])

    useEffect(() => {
        if (organisationLoading) return

        if (organisationId && cache.has(organisationId)) {
            setEvents(cache.get(organisationId) ?? [])
            setLoading(false)
            return
        }

        queueMicrotask(() => {
            void refetch()
        })
    }, [organisationLoading, organisationId, refetch])

    return { events, loading, error, refetch }
}
