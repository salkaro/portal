import type { PortalBoardData } from '@/types/portal-view'

export const DEMO_ACCESS_CODE = `DEMO${new Date().getFullYear()}`

export const DEMO_PORTAL_NAME = 'Meridian Creative - Brand Refresh'

export const DEMO_CUSTOMIZATION = {
    tagline: 'Full brand identity redesign and digital presence overhaul.',
    showStatusSection: true,
    showTimelineSection: true,
    showOwnersSection: true,
    projectOwner: 'James Hartley',
    organisationName: 'Salkaro Agency',
}

export const DEMO_BOARD_DATA: PortalBoardData = {
    columns: [
        { id: 'status', title: 'Status', type: 'status' },
        { id: 'timeline', title: 'Timeline', type: 'timeline' },
        { id: 'owner', title: 'Owner', type: 'people' },
        { id: 'notes', title: 'Notes', type: 'text' },
    ],
    items: [
        // --- Discovery & Strategy ---
        {
            id: '1',
            name: 'Brand discovery workshop',
            groupId: 'discovery',
            groupTitle: 'Discovery & Strategy',
            columnValues: [
                { columnId: 'status', title: 'Status', type: 'status', text: 'Done', value: null },
                { columnId: 'timeline', title: 'Timeline', type: 'timeline', text: '2026-02-03 - 2026-02-07', value: null },
                { columnId: 'owner', title: 'Owner', type: 'people', text: 'James Hartley', value: null },
                { columnId: 'notes', title: 'Notes', type: 'text', text: 'Completed with all stakeholders present', value: null },
            ],
            subitems: [],
        },
        {
            id: '2',
            name: 'Competitor audit',
            groupId: 'discovery',
            groupTitle: 'Discovery & Strategy',
            columnValues: [
                { columnId: 'status', title: 'Status', type: 'status', text: 'Done', value: null },
                { columnId: 'timeline', title: 'Timeline', type: 'timeline', text: '2026-02-10 - 2026-02-14', value: null },
                { columnId: 'owner', title: 'Owner', type: 'people', text: 'Sofia Reyes', value: null },
                { columnId: 'notes', title: 'Notes', type: 'text', text: '12 competitors reviewed', value: null },
            ],
            subitems: [],
        },
        {
            id: '3',
            name: 'Brand positioning document',
            groupId: 'discovery',
            groupTitle: 'Discovery & Strategy',
            columnValues: [
                { columnId: 'status', title: 'Status', type: 'status', text: 'Done', value: null },
                { columnId: 'timeline', title: 'Timeline', type: 'timeline', text: '2026-02-17 - 2026-02-21', value: null },
                { columnId: 'owner', title: 'Owner', type: 'people', text: 'James Hartley', value: null },
                { columnId: 'notes', title: 'Notes', type: 'text', text: 'Approved by client', value: null },
            ],
            subitems: [],
        },

        // --- Visual Identity ---
        {
            id: '4',
            name: 'Logo concepts (3 directions)',
            groupId: 'identity',
            groupTitle: 'Visual Identity',
            columnValues: [
                { columnId: 'status', title: 'Status', type: 'status', text: 'Done', value: null },
                { columnId: 'timeline', title: 'Timeline', type: 'timeline', text: '2026-03-03 - 2026-03-14', value: null },
                { columnId: 'owner', title: 'Owner', type: 'people', text: 'Lena Brandt', value: null },
                { columnId: 'notes', title: 'Notes', type: 'text', text: 'Direction B selected', value: null },
            ],
            subitems: [],
        },
        {
            id: '5',
            name: 'Logo refinement & final files',
            groupId: 'identity',
            groupTitle: 'Visual Identity',
            columnValues: [
                { columnId: 'status', title: 'Status', type: 'status', text: 'Done', value: null },
                { columnId: 'timeline', title: 'Timeline', type: 'timeline', text: '2026-03-17 - 2026-03-28', value: null },
                { columnId: 'owner', title: 'Owner', type: 'people', text: 'Lena Brandt', value: null },
                { columnId: 'notes', title: 'Notes', type: 'text', text: 'SVG, PNG, PDF delivered', value: null },
            ],
            subitems: [],
        },
        {
            id: '6',
            name: 'Colour palette & typography system',
            groupId: 'identity',
            groupTitle: 'Visual Identity',
            columnValues: [
                { columnId: 'status', title: 'Status', type: 'status', text: 'In Progress', value: null },
                { columnId: 'timeline', title: 'Timeline', type: 'timeline', text: '2026-04-01 - 2026-04-11', value: null },
                { columnId: 'owner', title: 'Owner', type: 'people', text: 'Lena Brandt', value: null },
                { columnId: 'notes', title: 'Notes', type: 'text', text: 'Font pairing under review', value: null },
            ],
            subitems: [
                { id: '6-1', name: 'Define primary & secondary colours', status: 'Done' },
                { id: '6-2', name: 'Select heading typeface', status: 'Done' },
                { id: '6-3', name: 'Select body typeface', status: 'In Progress' },
                { id: '6-4', name: 'Accessibility contrast check', status: 'Not Started' },
            ],
        },
        {
            id: '7',
            name: 'Brand guidelines document',
            groupId: 'identity',
            groupTitle: 'Visual Identity',
            columnValues: [
                { columnId: 'status', title: 'Status', type: 'status', text: 'Working on it', value: null },
                { columnId: 'timeline', title: 'Timeline', type: 'timeline', text: '2026-04-14 - 2026-04-25', value: null },
                { columnId: 'owner', title: 'Owner', type: 'people', text: 'Sofia Reyes', value: null },
                { columnId: 'notes', title: 'Notes', type: 'text', text: 'First draft due 18 Apr', value: null },
            ],
            subitems: [],
        },

        // --- Website ---
        {
            id: '8',
            name: 'Sitemap & content architecture',
            groupId: 'website',
            groupTitle: 'Website Redesign',
            columnValues: [
                { columnId: 'status', title: 'Status', type: 'status', text: 'Done', value: null },
                { columnId: 'timeline', title: 'Timeline', type: 'timeline', text: '2026-03-10 - 2026-03-14', value: null },
                { columnId: 'owner', title: 'Owner', type: 'people', text: 'James Hartley', value: null },
                { columnId: 'notes', title: 'Notes', type: 'text', text: '7 pages confirmed', value: null },
            ],
            subitems: [],
        },
        {
            id: '9',
            name: 'Wireframes — all pages',
            groupId: 'website',
            groupTitle: 'Website Redesign',
            columnValues: [
                { columnId: 'status', title: 'Status', type: 'status', text: 'Done', value: null },
                { columnId: 'timeline', title: 'Timeline', type: 'timeline', text: '2026-03-17 - 2026-03-28', value: null },
                { columnId: 'owner', title: 'Owner', type: 'people', text: 'Lena Brandt', value: null },
                { columnId: 'notes', title: 'Notes', type: 'text', text: 'Approved in Figma', value: null },
            ],
            subitems: [],
        },
        {
            id: '10',
            name: 'High-fidelity designs',
            groupId: 'website',
            groupTitle: 'Website Redesign',
            columnValues: [
                { columnId: 'status', title: 'Status', type: 'status', text: 'In Progress', value: null },
                { columnId: 'timeline', title: 'Timeline', type: 'timeline', text: '2026-04-01 - 2026-04-18', value: null },
                { columnId: 'owner', title: 'Owner', type: 'people', text: 'Lena Brandt, Sofia Reyes', value: null },
                { columnId: 'notes', title: 'Notes', type: 'text', text: 'Homepage & about done, 5 remaining', value: null },
            ],
            subitems: [
                { id: '10-1', name: 'Homepage', status: 'Done' },
                { id: '10-2', name: 'About us', status: 'Done' },
                { id: '10-3', name: 'Services', status: 'In Progress' },
                { id: '10-4', name: 'Case studies', status: 'In Progress' },
                { id: '10-5', name: 'Contact', status: 'Not Started' },
                { id: '10-6', name: 'Blog index', status: 'Not Started' },
                { id: '10-7', name: 'Blog post template', status: 'Not Started' },
            ],
        },
        {
            id: '11',
            name: 'Development handoff',
            groupId: 'website',
            groupTitle: 'Website Redesign',
            columnValues: [
                { columnId: 'status', title: 'Status', type: 'status', text: 'Not Started', value: null },
                { columnId: 'timeline', title: 'Timeline', type: 'timeline', text: '2026-04-28 - 2026-05-02', value: null },
                { columnId: 'owner', title: 'Owner', type: 'people', text: 'James Hartley', value: null },
                { columnId: 'notes', title: 'Notes', type: 'text', text: '', value: null },
            ],
            subitems: [],
        },
        {
            id: '12',
            name: 'Website build & QA',
            groupId: 'website',
            groupTitle: 'Website Redesign',
            columnValues: [
                { columnId: 'status', title: 'Status', type: 'status', text: 'Not Started', value: null },
                { columnId: 'timeline', title: 'Timeline', type: 'timeline', text: '2026-05-05 - 2026-05-23', value: null },
                { columnId: 'owner', title: 'Owner', type: 'people', text: 'James Hartley', value: null },
                { columnId: 'notes', title: 'Notes', type: 'text', text: '', value: null },
            ],
            subitems: [],
        },

        // --- Collateral ---
        {
            id: '13',
            name: 'Business card & letterhead',
            groupId: 'collateral',
            groupTitle: 'Print Collateral',
            columnValues: [
                { columnId: 'status', title: 'Status', type: 'status', text: 'Working on it', value: null },
                { columnId: 'timeline', title: 'Timeline', type: 'timeline', text: '2026-04-07 - 2026-04-18', value: null },
                { columnId: 'owner', title: 'Owner', type: 'people', text: 'Sofia Reyes', value: null },
                { columnId: 'notes', title: 'Notes', type: 'text', text: 'Awaiting final logo files', value: null },
            ],
            subitems: [
                { id: '13-1', name: 'Business card — front', status: 'Working on it' },
                { id: '13-2', name: 'Business card — back', status: 'Not Started' },
                { id: '13-3', name: 'A4 letterhead', status: 'Not Started' },
                { id: '13-4', name: 'Email footer signature', status: 'Not Started' },
            ],
        },
        {
            id: '14',
            name: 'Email signature templates',
            groupId: 'collateral',
            groupTitle: 'Print Collateral',
            columnValues: [
                { columnId: 'status', title: 'Status', type: 'status', text: 'Not Started', value: null },
                { columnId: 'timeline', title: 'Timeline', type: 'timeline', text: '2026-04-22 - 2026-04-25', value: null },
                { columnId: 'owner', title: 'Owner', type: 'people', text: 'Sofia Reyes', value: null },
                { columnId: 'notes', title: 'Notes', type: 'text', text: '', value: null },
            ],
            subitems: [],
        },
        {
            id: '15',
            name: 'Social media templates',
            groupId: 'collateral',
            groupTitle: 'Print Collateral',
            columnValues: [
                { columnId: 'status', title: 'Status', type: 'status', text: 'Not Started', value: null },
                { columnId: 'timeline', title: 'Timeline', type: 'timeline', text: '2026-04-28 - 2026-05-09', value: null },
                { columnId: 'owner', title: 'Owner', type: 'people', text: 'Lena Brandt', value: null },
                { columnId: 'notes', title: 'Notes', type: 'text', text: '12 formats: IG, LinkedIn, X', value: null },
            ],
            subitems: [],
        },
    ],
}
