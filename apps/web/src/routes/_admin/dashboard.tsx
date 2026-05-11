import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@modticket/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@modticket/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Banknote, Crown, Music, Ticket, Users } from "lucide-react";
import type { ReactNode } from "react";
import { orpc } from "@/utils/orpc";

const currencyFormatter = new Intl.NumberFormat("th-TH", {
  currency: "THB",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  style: "currency",
});

const percentageFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export const Route = createFileRoute("/_admin/dashboard")({
  component: RouteComponent,
});

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function formatPercentage(value: number): string {
  return `${percentageFormatter.format(value)}%`;
}

function getStatusClasses(status: string): string {
  switch (status.toLowerCase()) {
    case "published":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "draft":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "cancelled":
    case "canceled":
      return "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300";
    case "archived":
      return "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 font-medium text-[11px] uppercase tracking-[0.16em] ${getStatusClasses(status)}`}
    >
      {status}
    </span>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.18em]">
              {title}
            </p>
            <p className="font-semibold text-3xl text-foreground tabular-nums tracking-tight">
              {value}
            </p>
            <p className="text-muted-foreground text-sm leading-6">
              {description}
            </p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-muted-foreground">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-medium text-foreground text-sm tabular-nums">
        {value}
      </span>
    </div>
  );
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Dashboard aggregates several related data sources.
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
  const { data: showtimes, isLoading: isLoadingShowtimes } = useQuery(
    orpc.showtime.list.queryOptions({ input: {} })
  );
  const { data: venues, isLoading: isLoadingVenues } = useQuery(
    orpc.venue.list.queryOptions()
  );

  const isLoading =
    isLoadingPayments ||
    isLoadingTickets ||
    isLoadingConcerts ||
    isLoadingShowtimes ||
    isLoadingVenues;

  const totalRevenue =
    payments
      ?.filter((payment) => payment.paymentStatus === "paid")
      .reduce((sum, payment) => sum + Number(payment.amount), 0) ?? 0;

  const totalTickets = tickets?.length ?? 0;
  const totalConcerts = concerts?.length ?? 0;

  const bookingToShowtime = new Map<string, string>();
  for (const ticket of tickets || []) {
    bookingToShowtime.set(ticket.bookingId, ticket.showtimeId);
  }

  const showtimeToConcert = new Map<string, string>();
  for (const showtime of showtimes || []) {
    showtimeToConcert.set(showtime.id, showtime.concertId);
  }

  const venueCapacityById = new Map<string, number>();
  for (const venue of venues || []) {
    venueCapacityById.set(venue.id, venue.capacity);
  }

  const concertStats = new Map<
    string,
    {
      id: string;
      name: string;
      status: string;
      revenue: number;
      ticketsSold: number;
      totalCapacity: number;
    }
  >();

  for (const concert of concerts || []) {
    concertStats.set(concert.id, {
      id: concert.id,
      name: concert.name,
      status: concert.status,
      revenue: 0,
      ticketsSold: 0,
      totalCapacity: 0,
    });
  }

  for (const showtime of showtimes || []) {
    const stats = concertStats.get(showtime.concertId);
    const capacity = venueCapacityById.get(showtime.venueId) || 0;
    if (stats) {
      stats.totalCapacity += capacity;
    }
  }

  for (const ticket of tickets || []) {
    const concertId = showtimeToConcert.get(ticket.showtimeId);
    if (!concertId) {
      continue;
    }

    const stats = concertStats.get(concertId);
    if (stats) {
      stats.ticketsSold += 1;
    }
  }

  for (const payment of payments || []) {
    if (payment.paymentStatus !== "paid") {
      continue;
    }

    const showtimeId = bookingToShowtime.get(payment.bookingId);
    if (!showtimeId) {
      continue;
    }

    const concertId = showtimeToConcert.get(showtimeId);
    if (!concertId) {
      continue;
    }

    const stats = concertStats.get(concertId);
    if (stats) {
      stats.revenue += Number(payment.amount);
    }
  }

  const rankedEvents = Array.from(concertStats.values()).sort(
    (a, b) => b.ticketsSold - a.ticketsSold || b.revenue - a.revenue
  );

  const topSellingEvents = rankedEvents.slice(0, 5);
  const _topRevenueEvent = [...rankedEvents].sort(
    (a, b) => b.revenue - a.revenue || b.ticketsSold - a.ticketsSold
  )[0];

  const totalCapacity = rankedEvents.reduce(
    (sum, event) => sum + event.totalCapacity,
    0
  );
  const occupancyRate =
    totalCapacity > 0 ? (totalTickets / totalCapacity) * 100 : 0;
  const paidPayments = payments?.filter(
    (payment) => payment.paymentStatus === "paid"
  ).length;
  const paymentSuccessRate =
    (payments?.length ?? 0) > 0
      ? ((paidPayments ?? 0) / (payments?.length ?? 0)) * 100
      : 0;
  const soldOutEvents = rankedEvents.filter(
    (event) =>
      event.totalCapacity > 0 && event.ticketsSold >= event.totalCapacity
  ).length;
  const averageRevenuePerTicket =
    totalTickets > 0 ? totalRevenue / totalTickets : 0;
  const topSeller = topSellingEvents[0];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          <div className="h-24 rounded-2xl border border-border/60 bg-muted/40" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="h-32 rounded-2xl border border-border/60 bg-muted/40" />
            <div className="h-32 rounded-2xl border border-border/60 bg-muted/40" />
            <div className="h-32 rounded-2xl border border-border/60 bg-muted/40" />
            <div className="h-32 rounded-2xl border border-border/60 bg-muted/40" />
          </div>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
            <div className="h-[30rem] rounded-2xl border border-border/60 bg-muted/40" />
            <div className="space-y-6">
              <div className="h-48 rounded-2xl border border-border/60 bg-muted/40" />
              <div className="h-64 rounded-2xl border border-border/60 bg-muted/40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            description="Successful payments only"
            icon={<Banknote className="h-5 w-5" />}
            title="Total revenue"
            value={formatCurrency(totalRevenue)}
          />
          <MetricCard
            description="Across all concerts and showtimes"
            icon={<Ticket className="h-5 w-5" />}
            title="Total tickets"
            value={totalTickets.toLocaleString()}
          />
          <MetricCard
            description="Currently managed in the system"
            icon={<Music className="h-5 w-5" />}
            title="Total concerts"
            value={totalConcerts.toLocaleString()}
          />
          <MetricCard
            description="Filled across all venues"
            icon={<Users className="h-5 w-5" />}
            title="Capacity filled"
            value={formatPercentage(occupancyRate)}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
          <Card className="border-border/60 bg-card shadow-sm">
            <CardHeader className="border-border/60 border-b px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Top selling events</CardTitle>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Ordered by tickets sold.
                  </p>
                </div>
                <div className="text-muted-foreground text-sm">
                  {topSellingEvents.length} events
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="pl-6">Concert</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Sold</TableHead>
                    <TableHead className="text-right">Capacity</TableHead>
                    <TableHead className="pr-6 text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topSellingEvents.length === 0 ? (
                    <TableRow>
                      <TableCell
                        className="py-12 text-center text-muted-foreground"
                        colSpan={5}
                      >
                        No sales data available yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    topSellingEvents.map((event) => (
                      <TableRow
                        className="border-border/60 hover:bg-muted/30"
                        key={event.id}
                      >
                        <TableCell className="pl-6">
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">
                              {event.name}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {Math.min(
                                100,
                                event.totalCapacity > 0
                                  ? Math.round(
                                      (event.ticketsSold /
                                        event.totalCapacity) *
                                        100
                                    )
                                  : 0
                              )}
                              % occupancy
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusPill status={event.status} />
                        </TableCell>
                        <TableCell className="text-right text-foreground tabular-nums">
                          {event.ticketsSold}
                        </TableCell>
                        <TableCell className="text-right text-foreground tabular-nums">
                          {event.totalCapacity}
                        </TableCell>
                        <TableCell className="pr-6 text-right text-foreground tabular-nums">
                          {formatCurrency(event.revenue)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border/60 bg-card shadow-sm">
              <CardHeader className="border-border/60 border-b px-6 py-5">
                <CardTitle className="text-lg">Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 px-6 py-4">
                <StatRow
                  label="Payment success"
                  value={formatPercentage(paymentSuccessRate)}
                />
                <StatRow
                  label="Sold-out events"
                  value={soldOutEvents.toLocaleString()}
                />
                <StatRow
                  label="Avg. ticket value"
                  value={formatCurrency(averageRevenuePerTicket)}
                />
                <StatRow
                  label="Total concerts"
                  value={totalConcerts.toLocaleString()}
                />
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card shadow-sm">
              <CardHeader className="border-border/60 border-b px-6 py-5">
                <CardTitle className="text-lg">Leading event</CardTitle>
              </CardHeader>
              <CardContent className="px-6 py-4">
                {topSeller ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-foreground">
                          {topSeller.name}
                        </p>
                        <p className="mt-1 text-muted-foreground text-sm">
                          {topSeller.ticketsSold} tickets sold
                        </p>
                      </div>
                      <Crown className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-[0.16em]">
                          Revenue
                        </p>
                        <p className="mt-2 font-semibold text-foreground text-lg tabular-nums">
                          {formatCurrency(topSeller.revenue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-[0.16em]">
                          Occupancy
                        </p>
                        <p className="mt-2 font-semibold text-foreground text-lg tabular-nums">
                          {formatPercentage(
                            topSeller.totalCapacity > 0
                              ? (topSeller.ticketsSold /
                                  topSeller.totalCapacity) *
                                  100
                              : 0
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-foreground"
                        style={{
                          width: `${Math.min(
                            100,
                            topSeller.totalCapacity > 0
                              ? (topSeller.ticketsSold /
                                  topSeller.totalCapacity) *
                                  100
                              : 0
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Sales will appear here once tickets start moving.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
