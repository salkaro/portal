"use server";

import Stripe from 'stripe';
import { isProduction, ROOT_URL } from '@/constants/site';
import { SETTINGS_ROUTES } from '@/constants/routes';
import { createServiceClient } from '@/lib/supabase/service';
import { createStripeCustomer } from './create';

export async function createCheckoutUrl({ email, stripeCustomerId, organisationId, priceId }: {
    email: string;
    stripeCustomerId: string | null;
    organisationId: string;
    priceId: string;
}): Promise<string> {
    const stripeSecretKey = isProduction
        ? process.env.STRIPE_SECRET_KEY
        : process.env.STRIPE_SECRET_KEY_TEST;

    if (!stripeSecretKey) {
        throw new Error('Stripe is not configured.');
    }

    const stripe = new Stripe(stripeSecretKey);

    let customerId = stripeCustomerId;
    if (!customerId) {
        customerId = await createStripeCustomer({ email });
        await createServiceClient()
            .from('organisations')
            .update({ stripe_customer_id: customerId })
            .eq('id', organisationId);
    }

    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        allow_promotion_codes: true,
        success_url: `${ROOT_URL}${SETTINGS_ROUTES.BILLING}?upgraded=true`,
        cancel_url: `${ROOT_URL}${SETTINGS_ROUTES.BILLING}`,
    });

    if (!session.url) {
        throw new Error('Failed to create checkout session.');
    }

    return session.url;
}
