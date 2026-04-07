import { ServiceError } from '@/services/service-error'

export async function fetchAsanaProjects(_accessToken: string) {
    throw new ServiceError('Asana service not implemented yet', 'not_implemented', 501)
}
