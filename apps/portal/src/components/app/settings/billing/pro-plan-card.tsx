"use client";

import { useState } from "react";
import { CheckIcon, ZapIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@salkaro/ui";
import { Spinner } from "@salkaro/ui";
import { Separator } from "@salkaro/ui";
import { createCheckoutUrl } from "@/services/stripe/checkout";

const FEATURES = [
    "Unlimited portals",
    "Up to 10 team members",
    "Unlimited integrations",
    "Custom branding",
    "25 invite slots",
    "100 activity events",
];

type ProPlanCardProps = {
    email: string;
    organisationId: string;
    stripeCustomerId: string | null;
    monthlyPriceId: string;
    yearlyPriceId: string;
    interval: string;
};

export function ProPlanCard({ email, organisationId, stripeCustomerId, monthlyPriceId, yearlyPriceId, interval }: ProPlanCardProps) {
    const [loading, setLoading] = useState(false);

    async function handleUpgrade() {
        setLoading(true);
        try {
            const priceId = interval === "monthly" ? monthlyPriceId : yearlyPriceId;
            const url = await createCheckoutUrl({ email, organisationId, stripeCustomerId, priceId });
            window.open(url, "_blank");
        } catch {
            toast.error("Failed to start checkout. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full max-w-xs rounded-lg border border-border bg-card">
            {/* Header */}
            <div className="space-y-3 px-4 pt-4 pb-3">
                <div className="flex items-center gap-2">
                    <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                        <ZapIcon className="size-3.5" />
                    </div>
                    <p className="text-sm font-semibold">Pro</p>
                </div>

                {/* Price */}
                {interval === "monthly" ? (
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">$29</span>
                        <span className="text-xs text-muted-foreground">/ month</span>
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold">$24</span>
                            <span className="text-xs text-muted-foreground">/ month</span>
                        </div>
                        <p className="text-xs text-muted-foreground">$290 billed yearly</p>
                    </div>
                )}
            </div>

            <Separator />

            {/* Features */}
            <ul className="space-y-1.5 px-4 py-3">
                {FEATURES.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckIcon className="size-3.5 shrink-0 text-primary" />
                        {feature}
                    </li>
                ))}
            </ul>

            <Separator />

            {/* CTA */}
            <div className="px-4 py-3">
                <Button
                    className="w-full"
                    disabled={loading}
                    onClick={() => void handleUpgrade()}
                >
                    {loading && <Spinner className="size-3.5" />}
                    {loading ? "Redirecting…" : "Upgrade"}
                </Button>
                <p className="mt-2 text-center text-[0.65rem] text-muted-foreground">
                    Coupon codes accepted at checkout
                </p>
            </div>
        </div>
    );
}
