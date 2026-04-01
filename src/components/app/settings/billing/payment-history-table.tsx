"use client";

import { DownloadIcon, CornerDownRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SalkaroTable } from "@/components/ui/salkaro-table";
import type { StripeInvoice } from "@/services/stripe/invoices";

type PaymentHistoryTableProps = {
  invoices: StripeInvoice[];
};

export function PaymentHistoryTable({ invoices }: PaymentHistoryTableProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Payment history</p>
      <p className="text-xs text-muted-foreground">
        Recent subscription invoices and charges.
      </p>
      <SalkaroTable
        rows={invoices}
        rowKey={(p) => p.id}
        emptyMessage="No payment history available yet."
        columns={[
          {
            key: "id",
            label: "Invoice",
            render: (p) => (
              <div className="space-y-1.5">
                <span className="font-medium">{p.id}</span>
                {p.refunds.map((r) => (
                  <div key={r.id} className="flex items-center gap-1.5 text-muted-foreground">
                    <CornerDownRightIcon className="size-3 shrink-0" />
                    <span>Refund</span>
                  </div>
                ))}
              </div>
            ),
          },
          {
            key: "date",
            label: "Date",
            render: (p) => (
              <div className="space-y-1.5">
                <span>{p.date}</span>
                {p.refunds.map((r) => (
                  <div key={r.id} className="text-muted-foreground">{r.date}</div>
                ))}
              </div>
            ),
          },
          {
            key: "amount",
            label: "Amount",
            render: (p) => (
              <div className="space-y-1.5">
                <span>{p.amount}</span>
                {p.refunds.map((r) => (
                  <div key={r.id} className="text-muted-foreground">−{r.amount}</div>
                ))}
              </div>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (p) => (
              <div className="space-y-1.5">
                <Badge variant="outline">{p.status}</Badge>
                {p.refunds.map((r) => (
                  <div key={r.id}>
                    <Badge variant="secondary">{r.reason ?? "refunded"}</Badge>
                  </div>
                ))}
              </div>
            ),
          },
          {
            key: "receipt",
            label: "Receipt",
            labelPosition: "right",
            render: (p) => (
              <div className="flex flex-col items-end gap-1.5">
                {p.receiptUrl ? (
                  <Button variant="ghost" size="icon-sm" asChild>
                    <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer">
                      <DownloadIcon className="size-3.5" />
                    </a>
                  </Button>
                ) : (
                  <div className="size-6" />
                )}
                {p.refunds.map((r) => (
                  <div key={r.id} className="size-6" />
                ))}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
