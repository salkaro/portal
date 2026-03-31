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
