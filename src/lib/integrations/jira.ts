import { ServiceError } from '@/services/service-error'
import type { Integration } from '@/lib/integrations/types'

export const JiraIntegration: Integration = {
    id: 'jira',
    getBoards: async () => {
        throw new ServiceError('Jira integration not implemented yet', 'not_implemented', 501)
    },
    getItems: async () => {
        throw new ServiceError('Jira integration not implemented yet', 'not_implemented', 501)
    },
    getStatuses: async () => {
        throw new ServiceError('Jira integration not implemented yet', 'not_implemented', 501)
    },
}
