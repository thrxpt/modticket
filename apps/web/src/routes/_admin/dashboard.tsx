import { Button, buttonVariants } from "@modticket/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@modticket/ui/components/card";
import { DataTable } from "@modticket/ui/components/data-table";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Banknote,
  CalendarDays,
  Crown,
  MapPin,
  Music,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";
import { type ReactNode, useMemo } from "react";
import { orpc } from "@/utils/orpc";

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

const percentageFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export const Route = createFileRoute("/_admin/dashboard")({
  component: RouteComponent,
});

function formatCurrency(value: number): string {
  if (Math.abs(value) >= COMPACT_CURRENCY_THRESHOLD) {
    return compactCurrencyFormatter.format(value);
  }

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
  description,
  icon,
  title,
  value,
}: {
  description: string;
  icon: ReactNode;
  title: string;
  value: string;
}) {
  return (
    <Card className="rounded-lg border-border/70 bg-card shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.16em]">
              {title}
            </p>
            <p className="font-semibold text-3xl text-foreground tabular-nums">
              {value}
            </p>
            <p className="text-muted-foreground text-sm leading-6">
              {description}
            </p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border/70 bg-muted/50 text-muted-foreground">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-medium text-foreground text-sm tabular-nums">
        {value}
      </span>
    </div>
  );
}

interface EventStats {
  id: string;
  name: string;
  revenue: number;
  status: string;
  ticketsSold: number;
  totalCapacity: number;
}

function getOccupancy(event: EventStats): number {
  if (event.totalCapacity <= 0) {
    return 0;
  }

  return Math.min(100, (event.ticketsSold / event.totalCapacity) * 100);
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

  const concertStats = new Map<string, EventStats>();

  for (const concert of concerts || []) {
    concertStats.set(concert.id, {
      id: concert.id,
      name: concert.name,
      revenue: 0,
      status: concert.status,
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
  const topRevenueEvent = [...rankedEvents].sort(
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

  const columns = useMemo<ColumnDef<EventStats>[]>(
    () => [
      {
        accessorKey: "name",
        cell: ({ row }) => {
          const event = row.original;
          const occupancy = Math.round(getOccupancy(event));

          return (
            <div className="min-w-52 space-y-2">
              <div>
                <p className="font-medium text-foreground">{event.name}</p>
                <p className="text-muted-foreground text-xs">
                  {occupancy}% occupancy
                </p>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground"
                  style={{ width: `${occupancy}%` }}
                />
              </div>
            </div>
          );
        },
        header: "Concert",
      },
      {
        accessorKey: "status",
        cell: ({ row }) => <StatusPill status={row.getValue("status")} />,
        header: "Status",
      },
      {
        accessorKey: "ticketsSold",
        cell: ({ row }) => (
          <div className="text-right text-foreground tabular-nums">
            {row.getValue("ticketsSold")}
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
              Sold
              <ArrowUpDown className="ml-2 size-4" />
            </Button>
          </div>
        ),
      },
      {
        accessorKey: "totalCapacity",
        cell: ({ row }) => (
          <div className="text-right text-foreground tabular-nums">
            {row.getValue("totalCapacity")}
          </div>
        ),
        header: () => <div className="text-right">Capacity</div>,
      },
      {
        accessorKey: "revenue",
        cell: ({ row }) => (
          <div className="text-right text-foreground tabular-nums">
            {formatCurrency(row.getValue("revenue"))}
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
              Revenue
              <ArrowUpDown className="ml-2 size-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          <div className="h-52 rounded-lg border border-border/60 bg-card" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="h-32 rounded-lg border border-border/60 bg-card" />
            <div className="h-32 rounded-lg border border-border/60 bg-card" />
            <div className="h-32 rounded-lg border border-border/60 bg-card" />
            <div className="h-32 rounded-lg border border-border/60 bg-card" />
          </div>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
            <div className="h-[30rem] rounded-lg border border-border/60 bg-card" />
            <div className="h-[30rem] rounded-lg border border-border/60 bg-card" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        <section className="grid gap-6 rounded-lg border border-border/70 bg-card p-6 shadow-sm xl:grid-cols-[minmax(0,1fr)_480px]">
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <ShieldCheck className="size-4 text-foreground" />
                Admin ticketing console
              </div>
              <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-6">
                Monitor sales, capacity, and booking quality from one calm
                workspace.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className={buttonVariants({
                  className: "h-11 rounded-md",
                })}
                to="/bookings"
              >
                Review bookings
                <Ticket className="size-4" />
              </Link>
              <Link
                className={buttonVariants({
                  className: "h-11 rounded-md",
                  variant: "outline",
                })}
                to="/concerts"
              >
                Publish schedule
                <CalendarDays className="size-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-lg bg-foreground p-5 text-background">
            <p className="text-background/60 text-sm">Live checkout preview</p>
            <h2 className="mt-2 font-semibold text-2xl">
              {topSeller?.name ?? "Waiting for ticket activity"}
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-md border border-background/15 p-3">
                <p className="text-background/55 text-xs">Sold</p>
                <p className="mt-2 font-semibold text-2xl tabular-nums">
                  {topSeller?.ticketsSold.toLocaleString() ?? "0"}
                </p>
              </div>
              <div className="rounded-md border border-background/15 p-3">
                <p className="text-background/55 text-xs">Revenue</p>
                <p className="mt-2 font-semibold text-2xl tabular-nums">
                  {formatCurrency(topSeller?.revenue ?? 0)}
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 text-background/60 text-sm">
              <MapPin className="size-4" />
              Capacity and payment data are synced.
            </div>
          </div>
        </section>

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

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.85fr)]">
          <Card className="rounded-lg border-border/70 bg-card shadow-sm">
            <CardHeader className="border-border/70 border-b px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">Concert performance</CardTitle>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Ranked by tickets sold, with revenue as the tie-breaker.
                  </p>
                </div>
                <div className="rounded-md border border-border px-3 py-2 text-muted-foreground text-sm">
                  {topSellingEvents.length} events
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <DataTable
                columns={columns}
                data={topSellingEvents}
                searchKey="name"
              />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-lg border-border/70 bg-card shadow-sm">
              <CardHeader className="border-border/70 border-b px-6 py-5">
                <CardTitle className="text-xl">Snapshot</CardTitle>
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
                  label="Top revenue"
                  value={
                    topRevenueEvent
                      ? formatCurrency(topRevenueEvent.revenue)
                      : formatCurrency(0)
                  }
                />
              </CardContent>
            </Card>

            <Card className="rounded-lg border-border/70 bg-card shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Leading event
                    </p>
                    <h2 className="mt-2 font-semibold text-xl">
                      {topSeller?.name ?? "Sales will appear here soon"}
                    </h2>
                    <p className="mt-2 text-muted-foreground text-sm leading-6">
                      {topSeller
                        ? `${formatPercentage(getOccupancy(topSeller))} occupied across assigned venue capacity.`
                        : "Create concerts and showtimes to start tracking demand."}
                    </p>
                  </div>
                  <Crown className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
