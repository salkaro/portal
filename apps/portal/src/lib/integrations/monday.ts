import {
    fetchMondayBoards,
    fetchMondayItems,
    fetchMondayStatuses,
} from '@/services/monday'
import type { Integration } from '@/lib/integrations/types'

export const MondayIntegration: Integration = {
    id: 'monday',
    getBoards: async (token) => fetchMondayBoards(token),
    getItems: async (token, boardId) => fetchMondayItems(token, boardId),
    getStatuses: async (token, boardId) => fetchMondayStatuses(token, boardId),
}
