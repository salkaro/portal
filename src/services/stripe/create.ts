"use server";

import { isProduction, ROOT_URL } from '@/constants/site';
import Stripe from 'stripe';


export async function createBillingPortalUrl({ customerId }: { customerId: string }) {
    const stripeAPIKey = isProduction ? process.env.STRIPE_API_KEY as string : process.env.TEST_STRIPE_API_KEY as string;

    if (!stripeAPIKey) {
        throw new Error('Stripe api key not found');
    }

    const stripe = new Stripe(stripeAPIKey);

    try {
        const billingPortal = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${ROOT_URL}`
        })

        return billingPortal["url"]
    } catch (error) {
        console.error('Error retrieving customer:', error);
        throw error;
    }
};



export async function createStripeCustomer({ email }: { email: string }) {
    const stripeAPIKey = isProduction ? process.env.STRIPE_API_KEY as string : process.env.TEST_STRIPE_API_KEY as string;

    if (!stripeAPIKey) {
        throw new Error('Stripe API key not found');
    }

    const stripe = new Stripe(stripeAPIKey);

    try {
        let customer;

        // If customerId was not provided or customer was not found, check by email
        const customers = await stripe.customers.list({
            email: email,
            limit: 1,
        });

        if (customers.data.length > 0) {
            customer = customers.data[0];
            return customer.id;
        } else {
            // Create a new customer since one doesn't exist with the provided email
            customer = await stripe.customers.create({
                email: email
            });
            return customer.id;
        }
    } catch (error) {
        console.error('Error retrieving customer:', error);
        throw error;
    }
};


export async function createCustomerSession({ customerId }: { customerId: string }) {
    const stripeAPIKey = isProduction ? process.env.STRIPE_API_KEY as string: process.env.TEST_STRIPE_API_KEY as string;

    if (!stripeAPIKey) {
        throw new Error('Stripe API key not found');
    }

    const stripe = new Stripe(stripeAPIKey);

    try {
        const session = await stripe.customerSessions.create({
            customer: customerId,
            components: { pricing_table: { enabled: true } },
        })

        return session.client_secret;
    } catch (error) {
        console.error('Error creating customer session:', error);
        throw error;
    }
}