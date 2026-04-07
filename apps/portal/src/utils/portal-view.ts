import type { PortalItem } from '@/types/portal-view'

export type StatusCount = { label: string; count: number; color: string }
export type OwnerCount = { name: string; count: number }

const STATUS_DONE_LABELS = ['done', 'complete', 'completed', 'closed', 'finished']
const STATUS_IN_PROGRESS_LABELS = ['in progress', 'working on it', 'in review', 'stuck']

function isStatusDone(label: string): boolean {
    return STATUS_DONE_LABELS.includes(label.toLowerCase().trim())
}

function isStatusInProgress(label: string): boolean {
    return STATUS_IN_PROGRESS_LABELS.includes(label.toLowerCase().trim())
}

function getEffectiveStatus(item: PortalItem): string {
    if (item.subitems.length > 0) {
        const subDone = item.subitems.filter((s) => isStatusDone(s.status ?? '')).length
        if (subDone === item.subitems.length) return 'Done'
        if (subDone > 0) return 'In Progress'
        return 'In Progress'
    }
    return item.columnValues.find((cv) => cv.type === 'status')?.text?.trim() || 'No status'
}

export function getStatusCounts(items: PortalItem[]): StatusCount[] {
    const counts: Record<string, number> = {}

    for (const item of items) {
        const label = getEffectiveStatus(item)
        counts[label] = (counts[label] ?? 0) + 1
    }

    return Object.entries(counts)
        .map(([label, count]) => ({
            label,
            count,
            color: isStatusDone(label)
                ? 'bg-green-500'
                : isStatusInProgress(label)
                ? 'bg-blue-500'
                : label === 'No status'
                ? 'bg-muted'
                : 'bg-amber-500',
        }))
        .sort((a, b) => b.count - a.count)
}

export function getCompletionStats(items: PortalItem[]): {
    total: number
    done: number
    inProgress: number
    donePercent: number
} {
    const total = items.length
    let doneScore = 0
    let inProgress = 0

    for (const item of items) {
        if (item.subitems.length > 0) {
            const subDone = item.subitems.filter((s) => isStatusDone(s.status ?? '')).length
            doneScore += subDone / item.subitems.length
            if (subDone < item.subitems.length) inProgress++
        } else {
            const statusCol = item.columnValues.find((cv) => cv.type === 'status')
            const label = statusCol?.text?.trim() ?? ''
            if (isStatusDone(label)) doneScore += 1
            else if (isStatusInProgress(label)) inProgress++
        }
    }

    const done = Math.round(doneScore)

    return {
        total,
        done,
        inProgress,
        donePercent: total > 0 ? Math.round((doneScore / total) * 100) : 0,
    }
}

export function getOverdueItems(items: PortalItem[]): PortalItem[] {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    return items.filter((item) => {
        // Skip items that are already done
        if (isStatusDone(getEffectiveStatus(item))) return false

        const dateCol = item.columnValues.find((cv) => cv.type === 'date' || cv.type === 'timeline')
        if (!dateCol?.text) return false

        // Timeline text is like "2026-03-01 - 2026-03-15", take end date
        const dateStr = dateCol.text.includes(' - ')
            ? dateCol.text.split(' - ')[1]
            : dateCol.text

        const date = new Date(dateStr)
        return !isNaN(date.getTime()) && date < now
    })
}

export function getUpcomingItems(items: PortalItem[], days = 30): PortalItem[] {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() + days)

    return items.filter((item) => {
        const dateCol = item.columnValues.find((cv) => cv.type === 'date' || cv.type === 'timeline')
        if (!dateCol?.text) return false

        const dateStr = dateCol.text.includes(' - ')
            ? dateCol.text.split(' - ')[1]
            : dateCol.text

        const date = new Date(dateStr)
        return !isNaN(date.getTime()) && date >= now && date <= cutoff
    })
}

export function getOwnerCounts(items: PortalItem[]): OwnerCount[] {
    const counts: Record<string, number> = {}

    for (const item of items) {
        const peopleCol = item.columnValues.find((cv) => cv.type === 'people')
        if (!peopleCol?.text) continue

        // Monday people text is comma-separated names
        const names = peopleCol.text.split(',').map((n) => n.trim()).filter(Boolean)
        for (const name of names) {
            counts[name] = (counts[name] ?? 0) + 1
        }
    }

    return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
}
