export type ServiceErrorCode =
    | 'invalid_request'
    | 'unauthorized'
    | 'forbidden'
    | 'not_found'
    | 'rate_limited'
    | 'upstream_error'
    | 'invalid_provider'
    | 'not_implemented'
    | 'configuration_error'
    | 'database_error'
    | 'unknown_error'

export class ServiceError extends Error {
    readonly code: ServiceErrorCode
    readonly status: number
    readonly meta?: Record<string, unknown>

    constructor(
        message: string,
        code: ServiceErrorCode = 'unknown_error',
        status = 500,
        meta?: Record<string, unknown>
    ) {
        super(message)
        this.name = 'ServiceError'
        this.code = code
        this.status = status
        this.meta = meta
    }
}
