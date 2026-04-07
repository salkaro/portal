'use client'

import { useCallback, useState } from 'react'
import { ServiceError } from '@/services/service-error'
import { fetchPortalSource } from '@/services/portals'

type PortalSourceBoard = { id: string; name: string }
type PortalSourceSubBoard = { id: string; name: string }
type PortalSourceColumn = { id: string; title: string; type: string }

type UsePortalSourceResult = {
    boards: PortalSourceBoard[]
    subBoards: PortalSourceSubBoard[]
    columns: PortalSourceColumn[]
    loadingBoards: boolean
    loadingSubBoards: boolean
    loadingColumns: boolean
    errorMessage: string | null
    loadBoards: (connectionId: string) => Promise<void>
    loadSubBoards: (connectionId: string, boardId: string) => Promise<void>
    loadColumns: (connectionId: string, boardId: string, subBoardId: string, bust?: boolean) => Promise<void>
}

function getBoardsCacheKey(connectionId: string): string {
    return `portal-boards:${connectionId}`
}

function getSubBoardsCacheKey(connectionId: string, boardId: string): string {
    return `portal-subboards:${connectionId}:${boardId}`
}

function getColumnsCacheKey(connectionId: string, boardId: string, subBoardId: string): string {
    return `portal-columns:${connectionId}:${boardId}:${subBoardId}`
}

export function usePortalSource(): UsePortalSourceResult {
    const [boards, setBoards] = useState<PortalSourceBoard[]>([])
    const [subBoards, setSubBoards] = useState<PortalSourceSubBoard[]>([])
    const [columns, setColumns] = useState<PortalSourceColumn[]>([])
    const [loadingBoards, setLoadingBoards] = useState(false)
    const [loadingSubBoards, setLoadingSubBoards] = useState(false)
    const [loadingColumns, setLoadingColumns] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const loadBoards = useCallback(async (connectionId: string) => {
        const cacheKey = getBoardsCacheKey(connectionId)
        const cached = sessionStorage.getItem(cacheKey)
        if (cached) {
            setBoards(JSON.parse(cached) as PortalSourceBoard[])
            return
        }

        setLoadingBoards(true)
        setErrorMessage(null)

        try {
            const response = await fetchPortalSource({ connectionId })
            setBoards(response.boards)
            sessionStorage.setItem(cacheKey, JSON.stringify(response.boards))
        } catch (error) {
            const message = error instanceof ServiceError ? error.message : 'Unable to load boards'
            setErrorMessage(message)
        } finally {
            setLoadingBoards(false)
        }
    }, [])

    const loadSubBoards = useCallback(async (connectionId: string, boardId: string) => {
        const cacheKey = getSubBoardsCacheKey(connectionId, boardId)
        const cached = sessionStorage.getItem(cacheKey)
        if (cached) {
            setSubBoards(JSON.parse(cached) as PortalSourceSubBoard[])
            // Also restore columns cached from this same request
            const columnsCacheKey = getColumnsCacheKey(connectionId, boardId, '')
            const cachedColumns = sessionStorage.getItem(columnsCacheKey)
            if (cachedColumns) setColumns(JSON.parse(cachedColumns) as PortalSourceColumn[])
            return
        }

        setLoadingSubBoards(true)
        setErrorMessage(null)

        try {
            const response = await fetchPortalSource({ connectionId, boardId })
            setSubBoards(response.subBoards)
            setColumns(response.columns)
            sessionStorage.setItem(cacheKey, JSON.stringify(response.subBoards))
            sessionStorage.setItem(getColumnsCacheKey(connectionId, boardId, ''), JSON.stringify(response.columns))
        } catch (error) {
            const message = error instanceof ServiceError ? error.message : 'Unable to load projects'
            setErrorMessage(message)
        } finally {
            setLoadingSubBoards(false)
        }
    }, [])

    const loadColumns = useCallback(async (connectionId: string, boardId: string, subBoardId: string, bust = false) => {
        const cacheKey = getColumnsCacheKey(connectionId, boardId, subBoardId)

        if (!bust) {
            const cached = sessionStorage.getItem(cacheKey)
            if (cached) {
                setColumns(JSON.parse(cached) as PortalSourceColumn[])
                return
            }
        } else {
            sessionStorage.removeItem(cacheKey)
        }

        setLoadingColumns(true)
        setErrorMessage(null)

        try {
            const response = await fetchPortalSource({ connectionId, boardId, subBoardId })
            setColumns(response.columns)
            sessionStorage.setItem(cacheKey, JSON.stringify(response.columns))
        } catch (error) {
            const message = error instanceof ServiceError ? error.message : 'Unable to load fields'
            setErrorMessage(message)
        } finally {
            setLoadingColumns(false)
        }
    }, [])

    return {
        boards,
        subBoards,
        columns,
        loadingBoards,
        loadingSubBoards,
        loadingColumns,
        errorMessage,
        loadBoards,
        loadSubBoards,
        loadColumns,
    }
}
