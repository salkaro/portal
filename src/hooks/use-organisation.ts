'use client'

import { useEffect, useMemo, useState } from 'react'
import type { PostgrestError } from '@supabase/supabase-js'
import { useCurrentUser } from '@/hooks/use-current-user'
import {
    createOrganisationForUser,
    getCurrentUserOrganisation,
    joinOrganisationByCode,
    updateOrganisation,
} from '@/services/supabase/organisations'
import {
    readSessionCache,
    removeSessionCache,
    writeSessionCache,
} from '@/lib/session-storage-cache'
import type { Organisation } from '@/types/organisation'

type UseOrganisationResult = {
    organisation: Organisation | null
    pendingApproval: boolean
    loading: boolean
    userLoading: boolean
    error: PostgrestError | null
    createOrganisation: (input?: {
        name?: string
        iconUrl?: string | null
    }) => Promise<{ organisation: Organisation | null; error: PostgrestError | null }>
    joinByCode: (input: {
        code: string
    }) => Promise<{ organisation: Organisation | null; error: PostgrestError | null }>
    saveOrganisation: (input: {
        name: string
        iconUrl: string | null
        stripeCustomerId: string | null
        subscription: 'free' | 'pro'
    }) => Promise<{ organisation: Organisation | null; error: PostgrestError | null }>
    refetch: () => Promise<void>
}

// Module-level cache — survives client-side navigation
let cachedOrganisation: Organisation | null = null
let cachedApproved: boolean = true
let cacheUserId: string | null = null

function getOrganisationCacheKey(userId: string): string {
    return `cache:organisation:${userId}`
}

type CachedOrganisationState = {
    organisation: Organisation | null
    approved: boolean
}

function hydrateCacheFromSession(userId: string): void {
    const cached = readSessionCache<CachedOrganisationState>(getOrganisationCacheKey(userId))
    if (!cached) return

    cachedOrganisation = cached.organisation
    cachedApproved = cached.approved
    cacheUserId = userId
}

function persistOrganisationCache(userId: string, organisation: Organisation | null, approved: boolean): void {
    cachedOrganisation = organisation
    cachedApproved = approved
    cacheUserId = userId
    writeSessionCache(getOrganisationCacheKey(userId), { organisation, approved })
}

function clearOrganisationCache(userId: string | null): void {
    if (userId) {
        removeSessionCache(getOrganisationCacheKey(userId))
    }

    cachedOrganisation = null
    cachedApproved = true
    cacheUserId = null
}

export function useOrganisation(): UseOrganisationResult {
    const { user, loading: userLoading } = useCurrentUser()

    if (user?.id && user.id !== cacheUserId) {
        hydrateCacheFromSession(user.id)
    }

    const isCacheValid = user?.id === cacheUserId && cachedOrganisation !== undefined

    const [organisation, setOrganisation] = useState<Organisation | null>(
        isCacheValid ? cachedOrganisation : null
    )
    const [pendingApproval, setPendingApproval] = useState<boolean>(
        isCacheValid ? !cachedApproved : false
    )
    const [loading, setLoading] = useState(!isCacheValid)
    const [error, setError] = useState<PostgrestError | null>(null)

    const defaultName = useMemo(() => {
        const fullName = (user?.user_metadata?.full_name as string | undefined)?.trim()
        if (fullName) {
            return `${fullName}'s Organisation`
        }

        const emailPrefix = user?.email?.split('@')[0]
        if (emailPrefix) {
            return `${emailPrefix}'s Organisation`
        }

        return 'My Organisation'
    }, [user])

    async function refetch() {
        if (!user) {
            clearOrganisationCache(cacheUserId)
            setOrganisation(null)
            setPendingApproval(false)
            setError(null)
            setLoading(false)
            return
        }

        setLoading(true)
        const result = await getCurrentUserOrganisation(user.id)

        if (!result.error) {
            persistOrganisationCache(user.id, result.data, result.approved)
        }

        setOrganisation(result.data)
        setPendingApproval(!result.approved && result.data !== null)
        setError(result.error)
        setLoading(false)
    }

    useEffect(() => {
        if (userLoading) return

        let cancelled = false

        // Serve from cache immediately if valid
        if (user?.id === cacheUserId && cachedOrganisation !== undefined) {
            queueMicrotask(() => {
                if (cancelled) return
                setOrganisation(cachedOrganisation)
                setPendingApproval(!cachedApproved && cachedOrganisation !== null)
                setLoading(false)
            })
            return () => { cancelled = true }
        }

        const run = async () => {
            await Promise.resolve()

            if (!user) {
                if (!cancelled) {
                    setOrganisation(null)
                    setPendingApproval(false)
                    setError(null)
                    setLoading(false)
                }
                return
            }

            if (!cancelled) setLoading(true)

            const result = await getCurrentUserOrganisation(user.id)

            if (!cancelled) {
                if (!result.error) {
                    persistOrganisationCache(user.id, result.data, result.approved)
                }
                setOrganisation(result.data)
                setPendingApproval(!result.approved && result.data !== null)
                setError(result.error)
                setLoading(false)
            }
        }

        void run()

        return () => { cancelled = true }
    }, [user, userLoading])

    async function createOrganisation(input?: {
        name?: string
        iconUrl?: string | null
    }) {
        if (!user) {
            return { organisation: null, error: null }
        }

        const result = await createOrganisationForUser({
            userId: user.id,
            name: input?.name?.trim() || defaultName,
            iconUrl: input?.iconUrl ?? null,
        })

        if (result.data && user) {
            persistOrganisationCache(user.id, result.data, true)
            setOrganisation(result.data)
            setPendingApproval(false)
            setError(null)
        }

        return { organisation: result.data, error: result.error }
    }

    async function joinByCode(input: { code: string }) {
        const result = await joinOrganisationByCode({ code: input.code })

        if (result.data && user) {
            persistOrganisationCache(user.id, result.data, false)
            setOrganisation(result.data)
            setPendingApproval(true)
            setError(null)
        }

        return { organisation: result.data, error: result.error }
    }

    async function saveOrganisation(input: {
        name: string
        iconUrl: string | null
        stripeCustomerId: string | null
        subscription: 'free' | 'pro'
    }) {
        if (!organisation) {
            return { organisation: null, error: null }
        }

        const result = await updateOrganisation({
            organisationId: organisation.id,
            name: input.name,
            iconUrl: input.iconUrl,
            stripeCustomerId: input.stripeCustomerId,
            subscription: input.subscription,
        })

        if (result.data && user) {
            persistOrganisationCache(user.id, result.data, cachedApproved)
            setOrganisation(result.data)
        }

        if (result.error) {
            setError(result.error)
        }

        return { organisation: result.data, error: result.error }
    }

    return {
        organisation,
        pendingApproval,
        loading,
        userLoading,
        error,
        createOrganisation,
        joinByCode,
        saveOrganisation,
        refetch,
    }
}
