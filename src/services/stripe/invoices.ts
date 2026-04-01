"use server";

import Stripe from 'stripe';
import { isProduction } from '@/constants/site';

export type StripeRefund = {
    id: string;
    amount: string;
    date: string;
    reason: string | null;
};

export type StripeInvoice = {
    id: string;
    date: string;
    amount: string;
    status: "paid" | "pending" | "failed";
    receiptUrl: string | null;
    refunds: StripeRefund[];
};

export async function getInvoices({ customerId }: { customerId: string }): Promise<StripeInvoice[]> {
    const stripeSecretKey = isProduction
        ? process.env.STRIPE_SECRET_KEY
        : process.env.STRIPE_SECRET_KEY_TEST;

    if (!stripeSecretKey) return [];

    const stripe = new Stripe(stripeSecretKey);

    const [invoicesRes, chargesRes] = await Promise.all([
        stripe.invoices.list({ customer: customerId, limit: 24 }),
        stripe.charges.list({ customer: customerId, limit: 24, expand: ['data.refunds'] }),
    ]);

    // Build a map of payment_intent_id -> refunds from charges
    // Charges are matched to invoices by created timestamp (same second)
    const refundsByCreated = new Map<number, StripeRefund[]>();

    for (const charge of chargesRes.data) {
        const refundData = charge.refunds?.data ?? [];
        if (refundData.length === 0) continue;

        const refunds: StripeRefund[] = refundData.map((r) => ({
            id: r.id,
            amount: new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: (r.currency ?? charge.currency).toUpperCase(),
            }).format(r.amount / 100),
            date: new Date(r.created * 1000).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            }),
            reason: r.reason ?? null,
        }));

        // Charge is typically created 0-1 seconds after the invoice — index both
        refundsByCreated.set(charge.created, refunds);
        refundsByCreated.set(charge.created - 1, refunds);
    }

    const statusMap: Record<string, StripeInvoice['status']> = {
        paid: 'paid',
        open: 'pending',
        uncollectible: 'failed',
        void: 'failed',
    };

    const formatDate = (ts: number) =>
        new Date(ts * 1000).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });

    return invoicesRes.data.map((invoice) => ({
        id: invoice.number ?? invoice.id,
        date: formatDate(invoice.created),
        amount: invoice.total != null
            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency.toUpperCase() }).format(invoice.total / 100)
            : '—',
        status: statusMap[invoice.status ?? ''] ?? 'pending',
        receiptUrl: invoice.hosted_invoice_url ?? null,
        refunds: refundsByCreated.get(invoice.created) ?? [],
    }));
}
