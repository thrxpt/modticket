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
import { useMemo } from "react";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_admin/bookings")({
  component: BookingsComponent,
});

function BookingsComponent() {
  const { data: bookings, isLoading } = useQuery(
    orpc.booking.listAll.queryOptions()
  );

  type Booking = NonNullable<typeof bookings>[number];

  const columns = useMemo<ColumnDef<Booking>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Booking ID",
        cell: ({ row }) => (
          <div className="font-mono text-xs">{row.getValue("id")}</div>
        ),
      },
      {
        accessorKey: "userId",
        header: "User ID",
        cell: ({ row }) => (
          <div className="font-mono text-xs">{row.getValue("userId")}</div>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: "Total Amount",
        cell: ({ row }) => (
          <div className="font-medium">${row.getValue("totalAmount")}</div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold text-xs capitalize ${
                status === "confirmed"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              {status}
            </span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) => {
          const date = row.getValue("createdAt") as string | number | Date;
          return (
            <div className="text-muted-foreground text-sm">
              {date ? format(new Date(date), "PPp") : "N/A"}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-bold text-3xl tracking-tight">
          Bookings & Tickets
        </h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              Loading bookings...
            </div>
          ) : (
            <DataTable columns={columns} data={bookings ?? []} searchKey="id" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
