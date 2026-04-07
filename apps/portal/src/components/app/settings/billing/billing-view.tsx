"use client";

import { useState } from "react";
import { ArrowLeftIcon, CreditCardIcon } from "lucide-react";
import { Badge } from "@salkaro/ui";
import { Button } from "@salkaro/ui";
import { Separator } from "@salkaro/ui";
import { Spinner } from "@salkaro/ui";
import { toast } from "sonner";
import { createBillingPortalUrl } from "@/services/stripe/create";
import { PaymentHistoryTable } from "./payment-history-table";
import { PricingSection } from "./pricing-section";
import type { StripeInvoice } from "@/services/stripe/invoices";
import type { PlanTier } from "@/lib/plans";

type BillingViewProps = {
  currentPlan: PlanTier;
  cadenceCopy: string;
  renewalCopy: string;
  isFreePlan: boolean;
  cancelling: boolean;
  pricingConfigured: boolean;
  invoices: StripeInvoice[];
  email: string;
  organisationId: string;
  stripeCustomerId: string | null;
  monthlyPriceId: string | null;
  yearlyPriceId: string | null;
};

function toPlanLabel(plan: PlanTier): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

export function BillingView({
  currentPlan,
  cadenceCopy,
  renewalCopy,
  isFreePlan,
  cancelling,
  pricingConfigured,
  invoices,
  email,
  organisationId,
  stripeCustomerId,
  monthlyPriceId,
  yearlyPriceId,
}: BillingViewProps) {
  const [showPricing, setShowPricing] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  async function handleManage() {
    if (!stripeCustomerId) return;
    setPortalLoading(true);
    try {
      const url = await createBillingPortalUrl({
        customerId: stripeCustomerId,
      });
      window.open(url, "_blank");
    } catch {
      toast.error("Failed to open billing portal. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 rounded-md border p-2.5 text-muted-foreground">
            <CreditCardIcon className="size-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">
                {toPlanLabel(currentPlan)} plan
              </h3>
              <Badge
                variant={isFreePlan || cancelling ? "secondary" : "default"}
              >
                {cadenceCopy}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{renewalCopy}</p>
          </div>
        </div>

        {isFreePlan ? (
          <Button
            variant="outline"
            className="w-full md:w-auto"
            disabled={!pricingConfigured}
            onClick={() => setShowPricing(true)}
          >
            Upgrade plan
          </Button>
        ) : (
          <Button
            variant="outline"
            className="w-full md:w-auto"
            disabled={portalLoading}
            onClick={() => void handleManage()}
          >
            {portalLoading && <Spinner className="size-3.5" />}
            {portalLoading ? "Opening…" : "Manage plan"}
          </Button>
        )}
      </div>

      <Separator />

      {/* Sliding content */}
      <div className="relative overflow-hidden">
        {/* History / empty panel */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            showPricing
              ? "-translate-x-8 opacity-0 pointer-events-none absolute inset-0"
              : "translate-x-0 opacity-100"
          }`}
        >
          <PaymentHistoryTable invoices={invoices} />
        </div>

        {/* Pricing panel */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            showPricing
              ? "translate-x-0 opacity-100"
              : "translate-x-8 opacity-0 pointer-events-none absolute inset-0"
          }`}
        >
          <div className="space-y-4">
            <button
              onClick={() => setShowPricing(false)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeftIcon className="size-3.5" />
              Back
            </button>
            {pricingConfigured && monthlyPriceId && yearlyPriceId && (
              <PricingSection
                email={email}
                organisationId={organisationId}
                stripeCustomerId={stripeCustomerId}
                monthlyPriceId={monthlyPriceId}
                yearlyPriceId={yearlyPriceId}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
