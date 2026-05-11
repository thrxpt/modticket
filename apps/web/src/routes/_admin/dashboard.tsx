import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@modticket/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Banknote, Loader2, Music, Ticket } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_admin/dashboard")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data || session.data.user.role !== "admin") {
      redirect({
        to: "/login",
        throw: true,
      });
    }
    return { session: session.data };
  },
});

function RouteComponent() {
  const { data: payments, isLoading: isLoadingPayments } = useQuery(
    orpc.payment.listAll.queryOptions()
  );
  const { data: tickets, isLoading: isLoadingTickets } = useQuery(
    orpc.ticket.listAll.queryOptions()
  );
  const { data: concerts, isLoading: isLoadingConcerts } = useQuery(
    orpc.concert.list.queryOptions()
  );

  const isLoading = isLoadingPayments || isLoadingTickets || isLoadingConcerts;

  const totalRevenue =
    payments
      ?.filter((p) => p.paymentStatus === "paid")
      .reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  const totalTickets = tickets?.length ?? 0;
  const totalConcerts = concerts?.length ?? 0;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-bold text-3xl tracking-tight">Dashboard</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Revenue</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              $
              {totalRevenue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-muted-foreground text-xs">
              Total from successful payments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{totalTickets}</div>
            <p className="text-muted-foreground text-xs">
              Across all concerts and showtimes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Total Concerts
            </CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{totalConcerts}</div>
            <p className="text-muted-foreground text-xs">
              Managed in the system
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
