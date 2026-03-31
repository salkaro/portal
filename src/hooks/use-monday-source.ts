'use client'

import { useCallback, useState } from 'react'
import type { MondayBoard, MondayBoardColumn } from '@/services/monday'
import { ServiceError } from '@/services/service-error'
import { fetchMondaySource } from '@/services/portals'

type UseMondaySourceResult = {
    boards: MondayBoard[]
    columns: MondayBoardColumn[]
    loadingBoards: boolean
    loadingColumns: boolean
    errorMessage: string | null
    loadBoards: (connectionId: string) => Promise<void>
    loadColumns: (connectionId: string, boardId: string) => Promise<void>
}

function getBoardsCacheKey(connectionId: string): string {
    return `monday-boards:${connectionId}`
}

function getColumnsCacheKey(connectionId: string, boardId: string): string {
    return `monday-columns:${connectionId}:${boardId}`
}

export function useMondaySource(): UseMondaySourceResult {
    const [boards, setBoards] = useState<MondayBoard[]>([])
    const [columns, setColumns] = useState<MondayBoardColumn[]>([])
    const [loadingBoards, setLoadingBoards] = useState(false)
    const [loadingColumns, setLoadingColumns] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const loadBoards = useCallback(async (connectionId: string) => {
        const cacheKey = getBoardsCacheKey(connectionId)
        const cachedBoards = sessionStorage.getItem(cacheKey)

        if (cachedBoards) {
            setBoards(JSON.parse(cachedBoards) as MondayBoard[])
            return
        }

        setLoadingBoards(true)
        setErrorMessage(null)

        try {
            const response = await fetchMondaySource({ connectionId })
            setBoards(response.boards)
            sessionStorage.setItem(cacheKey, JSON.stringify(response.boards))
        } catch (error) {
            const message = error instanceof ServiceError ? error.message : 'Unable to load boards'
            setErrorMessage(message)
        } finally {
            setLoadingBoards(false)
        }
    }, [])

    const loadColumns = useCallback(async (connectionId: string, boardId: string) => {
        const cacheKey = getColumnsCacheKey(connectionId, boardId)
        const cachedColumns = sessionStorage.getItem(cacheKey)

        if (cachedColumns) {
            setColumns(JSON.parse(cachedColumns) as MondayBoardColumn[])
            return
        }

        setLoadingColumns(true)
        setErrorMessage(null)

        try {
            const response = await fetchMondaySource({ connectionId, boardId })
            setColumns(response.columns)
            sessionStorage.setItem(cacheKey, JSON.stringify(response.columns))
        } catch (error) {
            const message = error instanceof ServiceError ? error.message : 'Unable to load board columns'
            setErrorMessage(message)
        } finally {
            setLoadingColumns(false)
        }
    }, [])

    return {
        boards,
        columns,
        loadingBoards,
        loadingColumns,
        errorMessage,
        loadBoards,
        loadColumns,
    }
}
