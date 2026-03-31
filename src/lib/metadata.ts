import type { Metadata } from 'next'

export const SITE_NAME = 'Salkaro Portal'
export const DEFAULT_SITE_DESCRIPTION =
    'Client portal software for agencies to share live project updates with clients.'

export function pageMetadata(title: string, description: string): Metadata {
    return {
        title,
        description,
    }
}
