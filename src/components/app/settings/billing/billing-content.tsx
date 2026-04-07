import { PLANS } from "@/constants/plans";
import { isProduction } from "@/constants/site";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserOrganisation } from "@/services/supabase/organisations";
import { getInvoices } from "@/services/stripe/invoices";
import { getSubscriptionStatus } from "@/services/stripe/subscription";
import { BillingView } from "./billing-view";
import type { PlanTier } from "@/lib/plans";

export async function BillingContent() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: organisation } = await getCurrentUserOrganisation(user.id, supabase);

    const currentPlan = (organisation?.subscription ?? PLANS.FREE) as PlanTier;
    const isFreePlan = currentPlan === PLANS.FREE;

    const stripeStatus = !isFreePlan && organisation?.stripe_customer_id
        ? await getSubscriptionStatus({ customerId: organisation.stripe_customer_id }).catch(() => null)
        : null;

    const cancelling = stripeStatus?.cancelAtPeriodEnd ?? false;
    const periodEnd = stripeStatus?.currentPeriodEnd || null;

    const cadenceCopy = isFreePlan ? "Free" : cancelling ? "Cancels" : "Monthly";
    const renewalCopy = isFreePlan
        ? "No active renewal while on the free plan."
        : cancelling
            ? `Your plan will be cancelled on ${periodEnd}. You still have full access until then.`
            : `Your subscription will auto renew on ${stripeStatus?.nextBillingDate ?? "your next billing date"}.`;

    const monthlyPriceId = isProduction
        ? process.env.STRIPE_PRICE_ID_PRO_MONTHLY ?? null
        : process.env.STRIPE_PRICE_ID_PRO_MONTHLY_TEST ?? null;

    const yearlyPriceId = isProduction
        ? process.env.STRIPE_PRICE_ID_PRO_YEARLY ?? null
        : process.env.STRIPE_PRICE_ID_PRO_YEARLY_TEST ?? null;

    const invoices = organisation?.stripe_customer_id
        ? await getInvoices({ customerId: organisation.stripe_customer_id }).catch(() => [])
        : [];

    return (
        <BillingView
            currentPlan={currentPlan}
            cadenceCopy={cadenceCopy}
            renewalCopy={renewalCopy}
            isFreePlan={isFreePlan}
            cancelling={cancelling}
            pricingConfigured={!!monthlyPriceId && !!yearlyPriceId}
            invoices={invoices}
            email={user.email ?? ""}
            organisationId={organisation?.id ?? ""}
            stripeCustomerId={organisation?.stripe_customer_id ?? null}
            monthlyPriceId={monthlyPriceId}
            yearlyPriceId={yearlyPriceId}
        />
    );
}
