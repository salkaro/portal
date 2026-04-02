'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const COOLDOWN_MS = 3000

export function useRefreshCooldown(onRefresh: (silent: boolean) => Promise<void>) {
    const [refreshing, setRefreshing] = useState(false)
    const [coolingDown, setCoolingDown] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [])

    const refresh = useCallback(async () => {
        if (refreshing || coolingDown) return

        setRefreshing(true)
        try {
            await onRefresh(true)
        } finally {
            setRefreshing(false)
            setCoolingDown(true)
            timerRef.current = setTimeout(() => {
                setCoolingDown(false)
            }, COOLDOWN_MS)
        }
    }, [coolingDown, onRefresh, refreshing])

    return { refresh, refreshing, disabled: refreshing || coolingDown }
}
