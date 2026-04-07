import { ServiceError } from '@/services/service-error'

export async function fetchClickupSpaces(_accessToken: string) {
    throw new ServiceError('ClickUp service not implemented yet', 'not_implemented', 501)
}
