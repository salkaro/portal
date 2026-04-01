import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { isProduction } from '@/constants/site';
import { PLANS } from '@/constants/plans';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
    const stripeSecretKey = isProduction
        ? process.env.STRIPE_SECRET_KEY
        : process.env.STRIPE_SECRET_KEY_TEST;

    const webhookSecret = isProduction
        ? process.env.STRIPE_WEBHOOK_SECRET
        : process.env.STRIPE_WEBHOOK_SECRET_TEST;

    if (!stripeSecretKey || !webhookSecret) {
        return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey);
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch {
        return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
    }

    const supabase = createServiceClient();

    switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;
            const isActive = subscription.status === 'active' || subscription.status === 'trialing';
            const newSubscription = isActive ? PLANS.PRO : PLANS.FREE;

            await supabase
                .from('organisations')
                .update({ subscription: newSubscription })
                .eq('stripe_customer_id', customerId);

            break;
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;

            await supabase
                .from('organisations')
                .update({ subscription: PLANS.FREE })
                .eq('stripe_customer_id', customerId);

            break;
        }

        default:
            break;
    }

    return NextResponse.json({ received: true });
}
