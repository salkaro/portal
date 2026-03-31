import { ServiceError } from '@/services/service-error'

export async function fetchLinearTeams() {
    throw new ServiceError('Linear service not implemented yet', 'not_implemented', 501)
}
