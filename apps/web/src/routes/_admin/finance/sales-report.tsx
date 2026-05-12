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
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_admin/finance/sales-report")({
  component: SalesReportComponent,
});

function SalesReportComponent() {
  const { data: payments, isLoading } = useQuery(
    orpc.payment.listAll.queryOptions()
  );

  const totalRevenue =
    payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0;
  const paidCount =
    payments?.filter((p) => p.paymentStatus === "paid").length || 0;

  const methodStats =
    payments?.reduce(
      (acc, p) => {
        acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + Number(p.amount);
        return acc;
      },
      {} as Record<string, number>
    ) || {};

  type Payment = NonNullable<typeof payments>[number];

  const columns = useMemo<ColumnDef<Payment>[]>(
    () => [
      {
        accessorKey: "paymentDate",
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
        cell: ({ row }) => {
          const date = row.getValue("paymentDate") as string | number | Date;
          return (
            <div className="text-muted-foreground text-sm">
              {date ? format(new Date(date), "MMM d, HH:mm") : "N/A"}
            </div>
          );
        },
      },
      {
        accessorKey: "paymentMethod",
        header: "Method",
        cell: ({ row }) => (
          <div className="capitalize">{row.getValue("paymentMethod")}</div>
        ),
      },
      {
        accessorKey: "paymentStatus",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("paymentStatus") as string;
          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold text-xs capitalize ${
                status === "paid"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
              }`}
            >
              {status}
            </span>
          );
        },
      },
      {
        accessorKey: "transactionRef",
        header: "Ref",
        cell: ({ row }) => (
          <div className="font-mono text-xs">
            {row.getValue("transactionRef")}
          </div>
        ),
      },
      {
        accessorKey: "amount",
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
        cell: ({ row }) => (
          <div className="text-right font-medium">
            ${row.getValue("amount")}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-bold text-3xl tracking-tight">Sales Report</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Revenue</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">${totalRevenue.toFixed(2)}</div>
            <p className="text-muted-foreground text-xs">
              Across {payments?.length || 0} transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Paid Bookings</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">+{paidCount}</div>
            <p className="text-muted-foreground text-xs">
              Successfully processed payments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Card Payments</CardTitle>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              ${(methodStats.card || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Bank Transfers
            </CardTitle>
            <Banknote className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              ${(methodStats.transfer || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            A detailed list of all payments processed.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
  );
}
