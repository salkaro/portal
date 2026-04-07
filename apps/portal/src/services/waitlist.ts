type WaitlistResult = { success: true; error: null } | { success: false; error: string }

export async function joinWaitlist(data: {
    email: string
    agencySize: string
    clientCount: string
    tools: string[]
    updateMethod: string
    referralSource: string
}): Promise<WaitlistResult> {
    const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })

    if (!res.ok) {
        const json = await res.json()
        return { success: false, error: json.message ?? 'Something went wrong. Please try again.' }
    }

    return { success: true, error: null }
}

export async function checkWaitlistAccess(email: string): Promise<WaitlistResult> {
    const res = await fetch('/api/waitlist/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    })

    if (!res.ok) {
        const json = await res.json()
        return { success: false, error: json.message ?? 'Access denied.' }
    }

    return { success: true, error: null }
}
