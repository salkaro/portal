export function limitInput(value: string, max: number): string {
    const safeMax = Number.isFinite(max) ? Math.max(0, Math.floor(max)) : 0

    if (safeMax === 0) {
        return ''
    }

    // Array.from truncates by Unicode code points, so emoji and other
    // surrogate pairs are not split into invalid characters.
    return Array.from(value).slice(0, safeMax).join('')
}

export function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

export function withRandomSuffix(value: string, fallbackPrefix: string): string {
    const slug = slugify(value)
    const suffix = crypto.randomUUID().slice(0, 6)

    if (!slug) {
        return `${fallbackPrefix}-${suffix}`
    }

    return `${slug}-${suffix}`
}
