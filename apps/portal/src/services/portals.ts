import { ServiceError } from '@/services/service-error'
import type { MondayBoardColumn, MondayBoard } from '@/services/monday'
import type { PortalAccessType } from '@/types/portal'
import type { PortalBoardData } from '@/types/portal-view'

type PortalSummary = {
    id: string
    name: string
    access_type: PortalAccessType
}

type PortalSourceBoard = { id: string; name: string }
type PortalSourceSubBoard = { id: string; name: string }
type PortalSourceColumn = { id: string; title: string; type: string }

type PortalSourceResponse = {
    boards: PortalSourceBoard[]
    subBoards: PortalSourceSubBoard[]
    columns: PortalSourceColumn[]
}

// Legacy alias kept for backwards compatibility with monday-specific callers
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
        projectOwner: string | null
        organisationName: string | null
    } | null
    access_type: PortalAccessType
    hasInstantAccess: boolean
}

// De-duplicate concurrent board fetches for the same portal.
// This prevents duplicate activity events when effects are invoked twice.
const boardDataInFlight = new Map<string, Promise<PortalBoardData>>()
const verifyCodeInFlight = new Map<string, Promise<PublicPortalResponse>>()
const verifyOtpInFlight = new Map<string, Promise<PublicPortalResponse>>()

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

export async function fetchPortalSource(input: {
    connectionId: string
    boardId?: string
    subBoardId?: string
}): Promise<PortalSourceResponse> {
    const response = await fetch('/api/portals/portal-source', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
    })

    if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null
        throw new ServiceError(
            errorPayload?.message ?? 'Unable to load portal source data',
            'upstream_error',
            response.status
        )
    }

    return (await response.json()) as PortalSourceResponse
}

/** @deprecated Use fetchPortalSource instead */
export async function fetchMondaySource(input: {
    connectionId: string
    boardId?: string
}): Promise<MondaySourceResponse> {
    return fetchPortalSource(input) as Promise<MondaySourceResponse>
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
    const key = `${input.portalId}:${input.email.toLowerCase().trim()}:${input.otp.trim()}`
    const existing = verifyOtpInFlight.get(key)

    if (existing) {
        return existing
    }

    const request = (async () => {
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
    })()

    verifyOtpInFlight.set(key, request)

    try {
        return await request
    } finally {
        verifyOtpInFlight.delete(key)
    }
}

export async function verifyPortalCode(input: {
    portalId: string
    code: string
}): Promise<PublicPortalResponse> {
    const markerKey = `portal-code-verified:${input.portalId}:${input.code.trim().toUpperCase()}`
    const suppressEvent = typeof window !== 'undefined' && window.sessionStorage.getItem(markerKey) === '1'

    const key = `${input.portalId}:${input.code.trim().toUpperCase()}`
    const existing = verifyCodeInFlight.get(key)

    if (existing) {
        return existing
    }

    const request = (async () => {
        const response = await fetch('/api/portals/public/verify-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...input,
                suppressEvent,
            }),
        })

        if (!response.ok) {
            const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null
            throw new ServiceError(
                errorPayload?.message ?? 'Invalid code',
                'upstream_error',
                response.status
            )
        }

        const payload = (await response.json()) as PublicPortalResponse

        if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(markerKey, '1')
        }

        return payload
    })()

    verifyCodeInFlight.set(key, request)

    try {
        return await request
    } finally {
        verifyCodeInFlight.delete(key)
    }
}

export async function fetchPortalBoardData(portalId: string): Promise<PortalBoardData> {
    const existing = boardDataInFlight.get(portalId)
    if (existing) {
        return existing
    }

    const request = (async () => {
        const response = await fetch(`/api/portals/public/board-data?portal_id=${encodeURIComponent(portalId)}`)

        if (!response.ok) {
            const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null
            throw new ServiceError(
                errorPayload?.message ?? 'Unable to load portal data',
                'upstream_error',
                response.status
            )
        }

        return (await response.json()) as PortalBoardData
    })()

    boardDataInFlight.set(portalId, request)

    try {
        return await request
    } finally {
        boardDataInFlight.delete(portalId)
    }
}

export async function trackPortalPdfExport(portalId: string): Promise<void> {
    const response = await fetch('/api/portals/public/export-pdf', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ portalId }),
    })

    if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null
        throw new ServiceError(
            errorPayload?.message ?? 'Unable to track PDF export',
            'upstream_error',
            response.status
        )
    }
}
