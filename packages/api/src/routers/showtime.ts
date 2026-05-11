import { db } from "@modticket/db";
import {
  booking,
  seat,
  showtime,
  showtimeSeat,
  zone,
} from "@modticket/db/schema/ticket";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, publicProcedure } from "../index";

export const showtimeRouter = {
  /** List all showtimes, optionally filtered by concert. */
  list: publicProcedure
    .input(z.object({ concertId: z.string().optional() }))
    .handler(async ({ input }) => {
      if (input.concertId) {
        return await db
          .select()
          .from(showtime)
          .where(eq(showtime.concertId, input.concertId));
      }
      return await db.select().from(showtime);
    }),

  /** Get a single showtime by ID. */
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const [item] = await db
        .select()
        .from(showtime)
        .where(eq(showtime.id, input.id));

      if (!item) {
        throw new ORPCError("NOT_FOUND", { message: "Showtime not found" });
      }

      return item;
    }),

  /**
   * Admin: create a new showtime.
   * Automatically initialises showtime_seat rows (is_available = true)
   * for every seat that belongs to the venue's zones.
   */
  create: adminProcedure
    .input(
      z.object({
        concertId: z.string(),
        venueId: z.string(),
        showDatetime: z.coerce.date(),
        status: z.enum(["upcoming", "ongoing", "ended", "cancelled"]),
      })
    )
    .handler(async ({ input }) => {
      const id = crypto.randomUUID();
      const [item] = await db
        .insert(showtime)
        .values({
          id,
          ...input,
        })
        .returning();

      // Initialise seat availability for this showtime
      const zones = await db
        .select()
        .from(zone)
        .where(eq(zone.venueId, input.venueId));

      for (const venueZone of zones) {
        const seats = await db
          .select()
          .from(seat)
          .where(eq(seat.zoneId, venueZone.id));

        if (seats.length > 0) {
          await db.insert(showtimeSeat).values(
            seats.map((s) => ({
              showtimeId: id,
              seatId: s.id,
              isAvailable: true,
            }))
          );
        }
      }

      return item;
    }),

  /** Admin: update showtime datetime or status. */
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        showDatetime: z.coerce.date().optional(),
        status: z
          .enum(["upcoming", "ongoing", "ended", "cancelled"])
          .optional(),
      })
    )
    .handler(async ({ input }) => {
      const { id, ...data } = input;
      const [item] = await db
        .update(showtime)
        .set(data)
        .where(eq(showtime.id, id))
        .returning();

      if (!item) {
        throw new ORPCError("NOT_FOUND", { message: "Showtime not found" });
      }

      return item;
    }),

  /**
   * Admin: delete a showtime.
   * Enforces business rule: cannot delete if bookings exist.
   */
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      // Business rule: cannot delete showtime with existing bookings
      const [existingBooking] = await db
        .select({ id: booking.id })
        .from(booking)
        .where(eq(booking.showtimeId, input.id));

      if (existingBooking) {
        throw new ORPCError("CONFLICT", {
          message: "Cannot delete a showtime that has existing bookings",
        });
      }

      const [item] = await db
        .delete(showtime)
        .where(eq(showtime.id, input.id))
        .returning();

      if (!item) {
        throw new ORPCError("NOT_FOUND", { message: "Showtime not found" });
      }

      return item;
    }),

  /**
   * Get seat availability for a specific showtime.
   * Returns seat number, zone name, price, and availability status.
   */
  getSeatStatus: publicProcedure
    .input(z.object({ showtimeId: z.string() }))
    .handler(
      async ({ input }) =>
        await db
          .select({
            seatId: showtimeSeat.seatId,
            isAvailable: showtimeSeat.isAvailable,
            seatNumber: seat.seatNumber,
            zoneName: zone.name,
            price: zone.price,
          })
          .from(showtimeSeat)
          .innerJoin(seat, eq(showtimeSeat.seatId, seat.id))
          .innerJoin(zone, eq(seat.zoneId, zone.id))
          .where(eq(showtimeSeat.showtimeId, input.showtimeId))
    ),
};
