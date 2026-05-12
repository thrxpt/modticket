import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@modticket/ui/components/card";
import { DataTable } from "@modticket/ui/components/data-table";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { CircleCheck, Clock3, ReceiptText, Ticket } from "lucide-react";
import { useMemo } from "react";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_admin/bookings")({
  component: BookingsComponent,
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

function getBookingStatusClasses(status: string): string {
  switch (status.toLowerCase()) {
    case "confirmed":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "pending":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "cancelled":
    case "canceled":
      return "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function SummaryCard({
  description,
  icon,
  label,
  value,
}: {
  description: string;
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="rounded-lg border-border/70 bg-card shadow-sm">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.16em]">
            {label}
          </p>
          <p className="mt-2 font-semibold text-3xl tabular-nums">{value}</p>
          <p className="mt-2 text-muted-foreground text-sm">{description}</p>
        </div>
        <div className="flex size-11 items-center justify-center rounded-md border border-border/70 bg-muted/50 text-muted-foreground">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function BookingsComponent() {
  const { data: bookings, isLoading } = useQuery(
    orpc.booking.listAll.queryOptions()
  );

  type Booking = NonNullable<typeof bookings>[number];

  const totalBookings = bookings?.length ?? 0;
  const confirmedBookings =
    bookings?.filter((booking) => booking.status === "confirmed").length ?? 0;
  const pendingBookings =
    bookings?.filter((booking) => booking.status === "pending").length ?? 0;
  const totalAmount =
    bookings?.reduce((sum, booking) => sum + Number(booking.totalAmount), 0) ??
    0;

  const columns = useMemo<ColumnDef<Booking>[]>(
    () => [
      {
        accessorKey: "id",
        cell: ({ row }) => (
          <div className="max-w-40 truncate font-mono text-xs">
            {row.getValue("id")}
          </div>
        ),
        header: "Booking ID",
      },
      {
        accessorKey: "userId",
        cell: ({ row }) => (
          <div className="max-w-40 truncate font-mono text-muted-foreground text-xs">
            {row.getValue("userId")}
          </div>
        ),
        header: "User ID",
      },
      {
        accessorKey: "totalAmount",
        cell: ({ row }) => (
          <div className="font-medium tabular-nums">
            {formatCurrency(Number(row.getValue("totalAmount")))}
          </div>
        ),
        header: "Total Amount",
      },
      {
        accessorKey: "status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          return (
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 font-medium text-[11px] uppercase tracking-[0.16em] ${getBookingStatusClasses(status)}`}
            >
              {status}
            </span>
          );
        },
        header: "Status",
      },
      {
        accessorKey: "createdAt",
        cell: ({ row }) => {
          const date = row.getValue("createdAt") as string | number | Date;
          return (
            <div className="text-muted-foreground text-sm">
              {date ? format(new Date(date), "PPp") : "N/A"}
            </div>
          );
        },
        header: "Date",
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
                <Ticket className="size-4 text-foreground" />
                Bookings and ticket records
              </div>
              <p className="mt-2 text-muted-foreground text-sm">
                Track reservations from checkout to confirmation.
              </p>
            </div>
            <p className="max-w-md text-muted-foreground text-sm leading-6">
              Search by booking ID, inspect customer references, and monitor
              booking states from the operational ledger.
            </p>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            description="All reservations in the system"
            icon={<ReceiptText className="size-5" />}
            label="Total bookings"
            value={totalBookings.toLocaleString()}
          />
          <SummaryCard
            description="Ready for ticket fulfillment"
            icon={<CircleCheck className="size-5" />}
            label="Confirmed"
            value={confirmedBookings.toLocaleString()}
          />
          <SummaryCard
            description="Awaiting final state"
            icon={<Clock3 className="size-5" />}
            label="Pending"
            value={pendingBookings.toLocaleString()}
          />
          <SummaryCard
            description="Gross booking value"
            icon={<Ticket className="size-5" />}
            label="Booked value"
            value={formatCurrency(totalAmount)}
          />
        </div>

        <Card className="rounded-lg border-border/70 bg-card shadow-sm">
          <CardHeader className="border-border/70 border-b px-6 py-5">
            <CardTitle className="text-xl">All bookings</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="py-10 text-center text-muted-foreground text-sm">
                Loading bookings...
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={bookings ?? []}
                searchKey="id"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
