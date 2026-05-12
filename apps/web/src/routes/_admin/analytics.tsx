import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@modticket/ui/components/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@modticket/ui/components/chart";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Banknote, BarChart4, TrendingDown, TrendingUp } from "lucide-react";
import { type ReactNode, useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import { orpc } from "@/utils/orpc";

const currencyFormatter = new Intl.NumberFormat("th-TH", {
  currency: "THB",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
  style: "currency",
});

const compactCurrencyFormatter = new Intl.NumberFormat("th-TH", {
  compactDisplay: "short",
  currency: "THB",
  maximumFractionDigits: 1,
  notation: "compact",
  style: "currency",
});

export const Route = createFileRoute("/_admin/analytics")({
  component: AnalyticsDashboard,
});

function MetricCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string | ReactNode;
  description: string | ReactNode;
  icon: ReactNode;
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

function AnalyticsDashboard() {
  const { data: monthlyRevenue, isLoading: isLoadingMonthly } = useQuery(
    orpc.analytics.getMonthlyRevenue.queryOptions()
  );

  const { data: concertRevenue, isLoading: isLoadingConcert } = useQuery(
    orpc.analytics.getConcertRevenue.queryOptions()
  );

  const { data: comparisons, isLoading: isLoadingComparisons } = useQuery(
    orpc.analytics.getBusinessComparisons.queryOptions()
  );

  const isLoading =
    isLoadingMonthly || isLoadingConcert || isLoadingComparisons;

  const topConcerts = useMemo(
    () => concertRevenue?.slice(0, 10) ?? [],
    [concertRevenue]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 p-4 sm:p-6 lg:p-8">
        <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
          Loading analytics data...
        </div>
      </div>
    );
  }

  const monthlyChartConfig = {
    revenue: {
      label: "Revenue",
      color: "var(--color-chart-1)",
    },
  } satisfies ChartConfig;

  const concertChartConfig = {
    revenue: {
      label: "Revenue",
      color: "var(--color-chart-1)",
    },
  } satisfies ChartConfig;

  return (
    <div className="min-h-screen bg-muted/30 p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        <section className="rounded-lg border border-border/70 bg-card p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <BarChart4 className="size-4 text-foreground" />
                Business Analytics
              </div>
              <p className="mt-2 text-muted-foreground text-sm">
                Monthly performance and per-concert revenue reports.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-3">
          <MetricCard
            description="Total earnings this month"
            icon={<Banknote className="h-5 w-5" />}
            title="Current Month Revenue"
            value={currencyFormatter.format(
              comparisons?.currentMonthRevenue ?? 0
            )}
          />
          <MetricCard
            description="Total earnings last month"
            icon={<Banknote className="h-5 w-5 text-muted-foreground" />}
            title="Previous Month Revenue"
            value={currencyFormatter.format(
              comparisons?.previousMonthRevenue ?? 0
            )}
          />
          <MetricCard
            description={
              <span className="flex items-center gap-1">
                {(comparisons?.growthPercentage ?? 0) >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-rose-500" />
                )}
                <span
                  className={
                    (comparisons?.growthPercentage ?? 0) >= 0
                      ? "text-emerald-500"
                      : "text-rose-500"
                  }
                >
                  vs previous month
                </span>
              </span>
            }
            icon={
              (comparisons?.growthPercentage ?? 0) >= 0 ? (
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-rose-500" />
              )
            }
            title="Month-over-Month Growth"
            value={`${comparisons?.growthPercentage ?? 0}%`}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="flex flex-col rounded-lg border-border/70 bg-card shadow-sm">
            <CardHeader className="border-border/70 border-b px-6 py-5">
              <CardTitle className="text-xl">Monthly Revenue Report</CardTitle>
              <CardDescription>Earnings breakdown by month</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-6">
              <ChartContainer
                className="min-h-[300px] w-full"
                config={monthlyChartConfig}
              >
                <BarChart
                  data={monthlyRevenue}
                  margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="var(--color-muted-foreground)"
                    strokeDasharray="3 3"
                    strokeOpacity={0.2}
                    vertical={false}
                  />
                  <XAxis
                    axisLine={false}
                    dataKey="month"
                    tickFormatter={(val) => {
                      const [year, month] = val.split("-");
                      const date = new Date(Number(year), Number(month) - 1);
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        year: "2-digit",
                      });
                    }}
                    tickLine={false}
                    tickMargin={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickFormatter={(value) =>
                      compactCurrencyFormatter.format(value)
                    }
                    tickLine={false}
                    width={60}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) =>
                          currencyFormatter.format(value as number)
                        }
                      />
                    }
                    cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="var(--color-revenue)"
                    maxBarSize={50}
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList
                      className="fill-foreground text-[10px]"
                      dataKey="revenue"
                      formatter={(value: number | string) =>
                        compactCurrencyFormatter.format(Number(value))
                      }
                      offset={10}
                      position="top"
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="flex flex-col rounded-lg border-border/70 bg-card shadow-sm">
            <CardHeader className="border-border/70 border-b px-6 py-5">
              <CardTitle className="text-xl">
                Top 10 Concerts by Revenue
              </CardTitle>
              <CardDescription>Highest earning events</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-6">
              <ChartContainer
                className="min-h-[300px] w-full"
                config={concertChartConfig}
              >
                <BarChart
                  data={topConcerts}
                  layout="vertical"
                  margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid
                    horizontal={false}
                    stroke="var(--color-muted-foreground)"
                    strokeDasharray="3 3"
                    strokeOpacity={0.2}
                  />
                  <XAxis
                    axisLine={false}
                    tickFormatter={(value) =>
                      compactCurrencyFormatter.format(value)
                    }
                    tickLine={false}
                    type="number"
                  />
                  <YAxis
                    axisLine={false}
                    dataKey="concertName"
                    tickFormatter={(value) =>
                      value.length > 20 ? `${value.slice(0, 20)}...` : value
                    }
                    tickLine={false}
                    tickMargin={10}
                    type="category"
                    width={120}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) =>
                          currencyFormatter.format(value as number)
                        }
                        hideLabel
                      />
                    }
                    cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="var(--color-revenue)"
                    maxBarSize={30}
                    radius={[0, 4, 4, 0]}
                  >
                    {topConcerts.map((_entry, index) => (
                      <Cell
                        fill="var(--color-revenue)"
                        fillOpacity={1 - index * 0.05}
                        key={`cell-${index}`}
                      />
                    ))}
                    <LabelList
                      className="fill-foreground text-[10px]"
                      dataKey="revenue"
                      formatter={(value: number | string) =>
                        compactCurrencyFormatter.format(Number(value))
                      }
                      offset={10}
                      position="right"
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
