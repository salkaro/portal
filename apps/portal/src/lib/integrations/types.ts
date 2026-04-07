import type { IntegrationProvider } from '@/constants/integrations'

export type Board = {
    id: string
    name: string
}

export type BoardItem = {
    id: string
    name: string
}

export type Status = {
    id: string
    label: string
}

export interface Integration {
    id: IntegrationProvider
    getBoards(token: string): Promise<Board[]>
    getItems(token: string, boardId: string): Promise<BoardItem[]>
    getStatuses(token: string, boardId: string): Promise<Status[]>
}
