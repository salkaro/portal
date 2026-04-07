export type PortalStatus = 'draft' | 'active' | 'archived'

export type PortalAccessType = 'anyone_with_link' | 'email_otp' | 'anyone_with_code'

export type PortalImportConfig = {
    boardId: string
    boardName: string
    selectedColumnIds: string[]
    subBoardId?: string | null
    subBoardName?: string | null
}

export type PortalCustomization = {
    tagline: string | null
    showStatusSection: boolean
    showTimelineSection: boolean
    showOwnersSection: boolean
    projectOwner: string | null
    organisationName: string | null
    // Pro branding
    logoUrl: string | null
    primaryColor: string | null
    foregroundColor: string | null
    hidePoweredBy: boolean
    hidePdfBranding: boolean
}

export type Portal = {
    id: string
    organisation_id: string
    name: string
    slug: string
    provider: string
    connection_id: string
    status: PortalStatus
    access_type: PortalAccessType
    access_email_allowlist: string[]
    access_code_hash: string | null
    import_config: PortalImportConfig
    customization: PortalCustomization
    created_at: string
    updated_at: string
}

export const DEFAULT_PORTAL_CUSTOMIZATION: PortalCustomization = {
    tagline: null,
    showStatusSection: true,
    showTimelineSection: true,
    showOwnersSection: false,
    projectOwner: null,
    organisationName: null,
    logoUrl: null,
    primaryColor: null,
    foregroundColor: null,
    hidePoweredBy: false,
    hidePdfBranding: false,
}
