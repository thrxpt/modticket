import { Button } from "@modticket/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@modticket/ui/components/card";
import { DataTable } from "@modticket/ui/components/data-table";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import {
  ArrowUpDown,
  Banknote,
  CreditCard,
  ReceiptText,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_admin/finance/sales-report")({
  component: SalesReportComponent,
});

const currencyFormatter = new Intl.NumberFormat("th-TH", {
  currency: "THB",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});

const compactCurrencyFormatter = new Intl.NumberFormat("th-TH", {
  compactDisplay: "short",
  currency: "THB",
  maximumFractionDigits: 1,
  notation: "compact",
  style: "currency",
});

const COMPACT_CURRENCY_THRESHOLD = 100_000;

function formatCurrency(value: number): string {
  if (Math.abs(value) >= COMPACT_CURRENCY_THRESHOLD) {
    return compactCurrencyFormatter.format(value);
  }

  return currencyFormatter.format(value);
}

function getPaymentStatusClasses(status: string): string {
  switch (status.toLowerCase()) {
    case "paid":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "pending":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "failed":
      return "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function FinanceMetric({
  description,
  icon,
  title,
  value,
}: {
  description: string;
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <Card className="rounded-lg border-border/70 bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-medium text-muted-foreground text-xs uppercase tracking-[0.16em]">
          {title}
        </CardTitle>
        <div className="flex size-9 items-center justify-center rounded-md border border-border/70 bg-muted/50 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="font-semibold text-3xl tabular-nums">{value}</div>
        <p className="mt-2 text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

function SalesReportComponent() {
  const { data: payments, isLoading } = useQuery(
    orpc.payment.listAll.queryOptions()
  );

  const totalRevenue =
    payments?.reduce((acc, payment) => acc + Number(payment.amount), 0) || 0;
  const paidCount =
    payments?.filter((payment) => payment.paymentStatus === "paid").length || 0;

  const methodStats =
    payments?.reduce(
      (acc, payment) => {
        acc[payment.paymentMethod] =
          (acc[payment.paymentMethod] || 0) + Number(payment.amount);
        return acc;
      },
      {} as Record<string, number>
    ) || {};

  type Payment = NonNullable<typeof payments>[number];

  const columns = useMemo<ColumnDef<Payment>[]>(
    () => [
      {
        accessorKey: "paymentDate",
        cell: ({ row }) => {
          const date = row.getValue("paymentDate") as string | number | Date;
          return (
            <div className="text-muted-foreground text-sm">
              {date ? format(new Date(date), "MMM d, HH:mm") : "N/A"}
            </div>
          );
        },
        header: ({ column }) => (
          <Button
            className="-ml-4 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            variant="ghost"
          >
            Date
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        ),
      },
      {
        accessorKey: "paymentMethod",
        cell: ({ row }) => (
          <div className="capitalize">{row.getValue("paymentMethod")}</div>
        ),
        header: "Method",
      },
      {
        accessorKey: "paymentStatus",
        cell: ({ row }) => {
          const status = row.getValue("paymentStatus") as string;
          return (
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 font-medium text-[11px] uppercase tracking-[0.16em] ${getPaymentStatusClasses(status)}`}
            >
              {status}
            </span>
          );
        },
        header: "Status",
      },
      {
        accessorKey: "transactionRef",
        cell: ({ row }) => (
          <div className="max-w-40 truncate font-mono text-xs">
            {row.getValue("transactionRef")}
          </div>
        ),
        header: "Ref",
      },
      {
        accessorKey: "amount",
        cell: ({ row }) => (
          <div className="text-right font-medium tabular-nums">
            {formatCurrency(Number(row.getValue("amount")))}
          </div>
        ),
        header: ({ column }) => (
          <div className="text-right">
            <Button
              className="-mr-4 h-8"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              variant="ghost"
            >
              Amount
              <ArrowUpDown className="ml-2 size-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-muted/30 p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        <section className="rounded-lg border border-border/70 bg-card p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <ReceiptText className="size-4 text-foreground" />
                Finance reporting
              </div>
              <p className="mt-2 text-muted-foreground text-sm">
                Reconcile ticket revenue without losing the thread.
              </p>
            </div>
            <p className="max-w-md text-muted-foreground text-sm leading-6">
              Review payment status, transaction references, and payment method
              split from the same operational table.
            </p>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FinanceMetric
            description={`Across ${payments?.length || 0} transactions`}
            icon={<TrendingUp className="size-4" />}
            title="Total revenue"
            value={formatCurrency(totalRevenue)}
          />
          <FinanceMetric
            description="Successfully processed payments"
            icon={<ReceiptText className="size-4" />}
            title="Paid bookings"
            value={paidCount.toLocaleString()}
          />
          <FinanceMetric
            description="Captured through card rails"
            icon={<CreditCard className="size-4" />}
            title="Card payments"
            value={formatCurrency(methodStats.card || 0)}
          />
          <FinanceMetric
            description="Captured through bank transfer"
            icon={<Banknote className="size-4" />}
            title="Bank transfers"
            value={formatCurrency(methodStats.transfer || 0)}
          />
        </div>

        <Card className="rounded-lg border-border/70 bg-card shadow-sm">
          <CardHeader className="border-border/70 border-b px-6 py-5">
            <CardTitle className="text-xl">Recent transactions</CardTitle>
            <CardDescription>
              A detailed list of all payments processed.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="py-10 text-center text-muted-foreground text-sm">
                Loading transactions...
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={payments ?? []}
                searchKey="transactionRef"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
