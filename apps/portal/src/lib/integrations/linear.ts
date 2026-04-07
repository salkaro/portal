import {
    fetchLinearTeams,
    fetchLinearIssues,
    fetchLinearWorkflowStates,
} from '@/services/linear'
import type { Integration } from '@/lib/integrations/types'

export const LinearIntegration: Integration = {
    id: 'linear',
    getBoards: async (token) => fetchLinearTeams(token),
    getItems: async (token, teamId) => fetchLinearIssues(token, teamId),
    getStatuses: async (token, teamId) => fetchLinearWorkflowStates(token, teamId),
}
