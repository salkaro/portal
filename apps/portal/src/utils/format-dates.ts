const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
})

export function formatDateTime(value: string | null | undefined): string {
    if (!value) {
        return 'N/A'
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return 'N/A'
    }

    return DATE_TIME_FORMATTER.format(date)
}
