"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@salkaro/ui";
import { ProPlanCard } from "./pro-plan-card";

type PricingSectionProps = {
    email: string;
    organisationId: string;
    stripeCustomerId: string | null;
    monthlyPriceId: string;
    yearlyPriceId: string;
};

export function PricingSection({ email, organisationId, stripeCustomerId, monthlyPriceId, yearlyPriceId }: PricingSectionProps) {
    const [interval, setInterval] = useState("monthly");

    return (
        <div className="flex flex-col items-center gap-4">
            <Tabs value={interval} onValueChange={setInterval}>
                <TabsList>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    <TabsTrigger value="yearly">
                        Yearly
                        <span className="ml-1 text-[0.6rem] font-semibold text-green-600 dark:text-green-400">
                            -17%
                        </span>
                    </TabsTrigger>
                </TabsList>
            </Tabs>
            <ProPlanCard
                email={email}
                organisationId={organisationId}
                stripeCustomerId={stripeCustomerId}
                monthlyPriceId={monthlyPriceId}
                yearlyPriceId={yearlyPriceId}
                interval={interval}
            />
        </div>
    );
}
