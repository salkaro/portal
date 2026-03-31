export type OrganisationSubscription = 'free' | 'pro'

export type Organisation = {
    id: string
    name: string
    icon_url: string | null
    stripe_customer_id: string | null
    subscription: OrganisationSubscription
    created_at: string
    updated_at: string
}
