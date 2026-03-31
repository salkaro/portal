import { ServiceError } from '@/services/service-error'
import type { Integration } from '@/lib/integrations/types'

export const LinearIntegration: Integration = {
    id: 'linear',
    getBoards: async () => {
        throw new ServiceError('Linear integration not implemented yet', 'not_implemented', 501)
    },
    getItems: async () => {
        throw new ServiceError('Linear integration not implemented yet', 'not_implemented', 501)
    },
    getStatuses: async () => {
        throw new ServiceError('Linear integration not implemented yet', 'not_implemented', 501)
    },
}
