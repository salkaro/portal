'use client'

import { useOrganisation } from '@/hooks/use-organisation'
import { usePortals } from '@/hooks/use-portals'
import type { Portal } from '@/types/portal'

type UsePortalResult = {
    portal: Portal | null
    loading: boolean
    error: import('@supabase/supabase-js').PostgrestError | null
    refetch: (silent?: boolean) => Promise<void>
}

export function usePortal(id: string): UsePortalResult {
    const { portals, loading, error, refetch } = usePortals()
    const { loading: organisationLoading } = useOrganisation()
    const portal = portals.find((p) => p.id === id) ?? null
    return { portal, loading: loading || organisationLoading, error, refetch }
}
