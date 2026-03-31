"use client";

import Link from "next/link";
import { CreditCardIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PLANS } from "@/constants/plans";
import { SETTINGS_ROUTES } from "@/constants/routes";
import { getCurrentUserPlanFromDatabase, type PlanTier } from "@/lib/plans";
import StripePricingTable from "./pricing-table";

type PaymentHistoryItem = {
  id: string;
  date: string;
  amount: string;
  status: "paid" | "pending" | "failed";
};

const PAYMENT_HISTORY: PaymentHistoryItem[] = [];

function toPlanLabel(plan: PlanTier): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

export function BillingContent() {
  const currentPlan = getCurrentUserPlanFromDatabase();
  const isFreePlan = currentPlan === PLANS.FREE;
  const renewalCopy = isFreePlan
    ? "No active renewal while on the free plan."
    : "Your subscription will auto renew on Apr 15, 2026.";
  const cadenceCopy = isFreePlan ? "Free" : "Monthly";
  const actionLabel = isFreePlan ? "Upgrade plan" : "Adjust plan";

  return (
    <section className="space-y-6">
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
              <Badge variant={isFreePlan ? "secondary" : "default"}>
                {cadenceCopy}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{renewalCopy}</p>
          </div>
        </div>

        <Button asChild variant="outline" className="w-full md:w-auto">
          <Link
            href={
              isFreePlan
                ? `${SETTINGS_ROUTES.BILLING}#pricing-table`
                : SETTINGS_ROUTES.BILLING
            }
          >
            {actionLabel}
          </Link>
        </Button>
      </div>

      <Separator />

      {isFreePlan ? (
        <div id="pricing-table" className="space-y-2">
          <p className="text-sm font-medium">Choose a paid plan</p>
          <p className="text-xs text-muted-foreground">
            Compare plans and upgrade when you are ready.
          </p>
          <div className="pt-2">
            <StripePricingTable />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium">Payment history</p>
          <p className="text-xs text-muted-foreground">
            Recent subscription invoices and charges.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PAYMENT_HISTORY.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No payment history available yet.
                  </TableCell>
                </TableRow>
              ) : (
                PAYMENT_HISTORY.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.id}</TableCell>
                    <TableCell>{payment.date}</TableCell>
                    <TableCell>{payment.amount}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
