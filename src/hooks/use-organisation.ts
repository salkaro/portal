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

export function useOrganisation(): UseOrganisationResult {
    const { user, loading: userLoading } = useCurrentUser()

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
            cachedOrganisation = null
            cachedApproved = true
            cacheUserId = null
            setOrganisation(null)
            setPendingApproval(false)
            setError(null)
            setLoading(false)
            return
        }

        setLoading(true)
        const result = await getCurrentUserOrganisation(user.id)

        if (!result.error) {
            cachedOrganisation = result.data
            cachedApproved = result.approved
            cacheUserId = user.id
        }

        setOrganisation(result.data)
        setPendingApproval(!result.approved && result.data !== null)
        setError(result.error)
        setLoading(false)
    }

    useEffect(() => {
        if (userLoading) return

        // Serve from cache immediately if valid
        if (user?.id === cacheUserId && cachedOrganisation !== undefined) {
            setOrganisation(cachedOrganisation)
            setPendingApproval(!cachedApproved && cachedOrganisation !== null)
            setLoading(false)
            return
        }

        let cancelled = false

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
                    cachedOrganisation = result.data
                    cachedApproved = result.approved
                    cacheUserId = user.id
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
            cachedOrganisation = result.data
            cachedApproved = true
            cacheUserId = user.id
            setOrganisation(result.data)
            setPendingApproval(false)
            setError(null)
        }

        return { organisation: result.data, error: result.error }
    }

    async function joinByCode(input: { code: string }) {
        const result = await joinOrganisationByCode({ code: input.code })

        if (result.data && user) {
            cachedOrganisation = result.data
            cachedApproved = false
            cacheUserId = user.id
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
            cachedOrganisation = result.data
            cacheUserId = user.id
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
