"use client";

import React, { useEffect } from "react";
import { isProduction } from "@/constants/site";

const STRIPE_PRICING_SCRIPT_SRC = "https://js.stripe.com/v3/pricing-table.js";

const StripePricingTable = () => {
  useEffect(() => {
    if (document.querySelector(`script[src="${STRIPE_PRICING_SCRIPT_SRC}"]`)) {
      return;
    }

    const script = document.createElement("script");
    script.src = STRIPE_PRICING_SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const lightModePricingId = isProduction
    ? process.env.NEXT_PUBLIC_LIGHT_PRICING_TABLE_ID
    : process.env.NEXT_PUBLIC_TEST_LIGHT_PRICING_TABLE_ID;
  const publishableKey = isProduction
    ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    : process.env.NEXT_PUBLIC_TEST_STRIPE_PUBLISHABLE_KEY;

  if (!lightModePricingId || !publishableKey) {
    return (
      <p className="text-xs text-muted-foreground">
        Pricing table is not configured yet.
      </p>
    );
  }

  return React.createElement("stripe-pricing-table", {
    "pricing-table-id": lightModePricingId,
    "publishable-key": publishableKey,
  });
};

export default StripePricingTable;
