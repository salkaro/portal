export type PortalColumnType = 'status' | 'date' | 'timeline' | 'people' | 'text' | 'numbers'

export type PortalColumnValue = {
    columnId: string
    title: string
    type: string
    text: string
    value: string | null
}

export type PortalSubitem = {
    id: string
    name: string
    status: string | null
}

export type PortalItem = {
    id: string
    name: string
    groupId: string
    groupTitle: string
    columnValues: PortalColumnValue[]
    subitems: PortalSubitem[]
}

export type PortalColumn = {
    id: string
    title: string
    type: string
}

export type PortalBoardData = {
    columns: PortalColumn[]
    items: PortalItem[]
}
