"use server";

import Stripe from 'stripe';
import { isProduction } from '@/constants/site';

export type StripeSubscriptionStatus = {
    status: Stripe.Subscription.Status;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string;
    nextBillingDate: string;
} | null;

export async function getSubscriptionStatus({ customerId }: { customerId: string }): Promise<StripeSubscriptionStatus> {
    const stripeSecretKey = isProduction
        ? process.env.STRIPE_SECRET_KEY
        : process.env.STRIPE_SECRET_KEY_TEST;

    if (!stripeSecretKey) return null;

    const stripe = new Stripe(stripeSecretKey);

    const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        limit: 1,
        status: 'all',
    });

    const subscription: Stripe.Subscription = subscriptions.data[0];
    if (!subscription) return null;

    const formatDate = (ts: number) =>
        new Date(ts * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

    const isCancelling = subscription.cancel_at !== null || subscription.cancel_at_period_end;
    const cancelDate = subscription.cancel_at ? formatDate(subscription.cancel_at) : null;
    const nextBillingDate = subscription.billing_cycle_anchor ? formatDate(subscription.billing_cycle_anchor) : '';

    return {
        status: subscription.status,
        cancelAtPeriodEnd: isCancelling,
        currentPeriodEnd: cancelDate ?? '',
        nextBillingDate,
    };
}
