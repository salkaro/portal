import { ServiceError } from '@/services/service-error'
import type { MondayBoardColumn, MondayBoard } from '@/services/monday'
import type { PortalAccessType } from '@/types/portal'

type PortalSummary = {
    id: string
    name: string
    access_type: PortalAccessType
}

type MondaySourceResponse = {
    boards: MondayBoard[]
    columns: MondayBoardColumn[]
}

type PublicPortalResponse = {
    id: string
    name: string
    import_config: {
        boardId: string
        boardName: string
        selectedColumnIds: string[]
    } | null
    customization: {
        tagline: string | null
        showStatusSection: boolean
        showTimelineSection: boolean
        showOwnersSection: boolean
    } | null
    access_type: PortalAccessType
    hasInstantAccess: boolean
}

export async function findPortalsByEmail(email: string): Promise<{ portals: PortalSummary[] }> {
    const response = await fetch('/api/portals/public/find-by-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    })

    if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null
        throw new ServiceError(
            errorPayload?.message ?? 'Unable to find portals',
            'upstream_error',
            response.status
        )
    }

    return (await response.json()) as { portals: PortalSummary[] }
}

export async function findPortalByCode(code: string): Promise<{ portal: PortalSummary }> {
    const response = await fetch('/api/portals/public/find-by-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
    })

    if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null
        throw new ServiceError(
            errorPayload?.message ?? 'Unable to verify access code',
            'upstream_error',
            response.status
        )
    }

    return (await response.json()) as { portal: PortalSummary }
}

export async function fetchMondaySource(input: {
    connectionId: string
    boardId?: string
}): Promise<MondaySourceResponse> {
    const response = await fetch('/api/portals/monday-source', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
    })

    if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null
        throw new ServiceError(
            errorPayload?.message ?? 'Unable to load monday source data',
            'upstream_error',
            response.status
        )
    }

    return (await response.json()) as MondaySourceResponse
}

export async function fetchPublicPortal(portalId: string): Promise<PublicPortalResponse> {
    const response = await fetch(`/api/portals/public?portal_id=${encodeURIComponent(portalId)}`)

    if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null
        throw new ServiceError(
            errorPayload?.message ?? 'Unable to load portal',
            'upstream_error',
            response.status
        )
    }

    return (await response.json()) as PublicPortalResponse
}

export async function requestPortalOtp(input: {
    portalId: string
    email: string
}): Promise<{ devOtp?: string }> {
    const response = await fetch('/api/portals/public/request-otp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
    })

    if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null
        throw new ServiceError(
            errorPayload?.message ?? 'Unable to send OTP',
            'upstream_error',
            response.status
        )
    }

    return (await response.json()) as { devOtp?: string }
}

export async function verifyPortalOtp(input: {
    portalId: string
    email: string
    otp: string
}): Promise<PublicPortalResponse> {
    const response = await fetch('/api/portals/public/verify-otp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
    })

    if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null
        throw new ServiceError(
            errorPayload?.message ?? 'Invalid OTP',
            'upstream_error',
            response.status
        )
    }

    return (await response.json()) as PublicPortalResponse
}

export async function verifyPortalCode(input: {
    portalId: string
    code: string
}): Promise<PublicPortalResponse> {
    const response = await fetch('/api/portals/public/verify-code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
    })

    if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null
        throw new ServiceError(
            errorPayload?.message ?? 'Invalid code',
            'upstream_error',
            response.status
        )
    }

    return (await response.json()) as PublicPortalResponse
}
