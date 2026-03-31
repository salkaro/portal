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

export function useOrganisation(): UseOrganisationResult {
    const { user, loading: userLoading } = useCurrentUser()
    const [organisation, setOrganisation] = useState<Organisation | null>(null)
    const [loading, setLoading] = useState(true)
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
            setOrganisation(null)
            setError(null)
            setLoading(false)
            return
        }

        setLoading(true)
        const result = await getCurrentUserOrganisation(user.id)

        setOrganisation(result.data)
        setError(result.error)
        setLoading(false)
    }

    useEffect(() => {
        if (userLoading) return

        let cancelled = false

        const run = async () => {
            await Promise.resolve()

            if (!user) {
                if (!cancelled) {
                    setOrganisation(null)
                    setError(null)
                    setLoading(false)
                }
                return
            }

            if (!cancelled) {
                setLoading(true)
            }

            const result = await getCurrentUserOrganisation(user.id)

            if (!cancelled) {
                setOrganisation(result.data)
                setError(result.error)
                setLoading(false)
            }
        }

        void run()

        return () => {
            cancelled = true
        }
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

        if (result.data) {
            setOrganisation(result.data)
            setError(null)
        }

        return { organisation: result.data, error: result.error }
    }

    async function joinByCode(input: { code: string }) {
        const result = await joinOrganisationByCode({ code: input.code })

        if (result.data) {
            setOrganisation(result.data)
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

        if (result.data) {
            setOrganisation(result.data)
        }

        if (result.error) {
            setError(result.error)
        }

        return { organisation: result.data, error: result.error }
    }

    return {
        organisation,
        loading,
        userLoading,
        error,
        createOrganisation,
        joinByCode,
        saveOrganisation,
        refetch,
    }
}
