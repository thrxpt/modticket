import { db } from "@modticket/db";
import {
  booking,
  concert,
  payment,
  showtime,
} from "@modticket/db/schema/ticket";
import { and, desc, eq, sql } from "drizzle-orm";
import { adminProcedure, o } from "../index";

export const analyticsRouter = o.router({
  getMonthlyRevenue: adminProcedure.handler(async () => {
    const results = await db
      .select({
        month: sql<string>`to_char(${payment.paymentDate}, 'YYYY-MM')`,
        revenue: sql<number>`sum(${payment.amount})`,
      })
      .from(payment)
      .where(eq(payment.paymentStatus, "paid"))
      .groupBy(sql`to_char(${payment.paymentDate}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${payment.paymentDate}, 'YYYY-MM')`);

    return results.map((r: { month: string; revenue: number }) => ({
      month: r.month,
      revenue: Number(r.revenue || 0),
    }));
  }),

  getConcertRevenue: adminProcedure.handler(async () => {
    const results = await db
      .select({
        concertId: concert.id,
        concertName: concert.name,
        revenue: sql<number>`sum(${payment.amount})`,
      })
      .from(payment)
      .innerJoin(booking, eq(payment.bookingId, booking.id))
      .innerJoin(showtime, eq(booking.showtimeId, showtime.id))
      .innerJoin(concert, eq(showtime.concertId, concert.id))
      .where(eq(payment.paymentStatus, "paid"))
      .groupBy(concert.id, concert.name)
      .orderBy(desc(sql`sum(${payment.amount})`));

    return results.map(
      (r: { concertId: string; concertName: string; revenue: number }) => ({
        concertId: r.concertId,
        concertName: r.concertName,
        revenue: Number(r.revenue || 0),
      })
    );
  }),

  getBusinessComparisons: adminProcedure.handler(async () => {
    // Current vs Previous Month Revenue
    const currentDate = new Date();
    const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;

    const previousDate = new Date();
    previousDate.setMonth(previousDate.getMonth() - 1);
    const previousMonthStr = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, "0")}`;

    const monthlyStats = await db
      .select({
        month: sql<string>`to_char(${payment.paymentDate}, 'YYYY-MM')`,
        revenue: sql<number>`sum(${payment.amount})`,
      })
      .from(payment)
      .where(
        and(
          eq(payment.paymentStatus, "paid"),
          sql`to_char(${payment.paymentDate}, 'YYYY-MM') IN (${currentMonthStr}, ${previousMonthStr})`
        )
      )
      .groupBy(sql`to_char(${payment.paymentDate}, 'YYYY-MM')`);

    let currentMonthRevenue = 0;
    let previousMonthRevenue = 0;

    for (const stat of monthlyStats) {
      if (stat.month === currentMonthStr) {
        currentMonthRevenue = Number(stat.revenue || 0);
      } else if (stat.month === previousMonthStr) {
        previousMonthRevenue = Number(stat.revenue || 0);
      }
    }

    const growth =
      previousMonthRevenue === 0
        ? 100
        : ((currentMonthRevenue - previousMonthRevenue) /
            previousMonthRevenue) *
          100;

    return {
      currentMonthRevenue,
      previousMonthRevenue,
      growthPercentage: Number(growth.toFixed(2)),
    };
  }),
});
