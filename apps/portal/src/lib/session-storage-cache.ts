export function readSessionCache<T>(key: string): T | null {
    if (typeof window === 'undefined') return null

    const raw = window.sessionStorage.getItem(key)
    if (!raw) return null

    try {
        return JSON.parse(raw) as T
    } catch {
        return null
    }
}

export function writeSessionCache<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return

    try {
        window.sessionStorage.setItem(key, JSON.stringify(value))
    } catch {
        // Ignore sessionStorage quota/security errors.
    }
}

export function removeSessionCache(key: string): void {
    if (typeof window === 'undefined') return

    try {
        window.sessionStorage.removeItem(key)
    } catch {
        // Ignore sessionStorage quota/security errors.
    }
}
