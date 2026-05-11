import { db } from "@modticket/db";
import {
  booking,
  seat,
  showtime,
  showtimeSeat,
  ticket,
  zone,
} from "@modticket/db/schema/ticket";
import { ORPCError } from "@orpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, protectedProcedure } from "../index";

export const bookingRouter = {
  /**
   * Create a booking for one or more seats in a showtime.
   * Runs inside a transaction to prevent double-booking.
   */
  create: protectedProcedure
    .input(
      z.object({
        showtimeId: z.string(),
        seatIds: z.array(z.string()).min(1),
      })
    )
    .handler(async ({ context, input }) => {
      const { session } = context;
      const userId = session.user.id;

      return await db.transaction(async (tx) => {
        // 1. Verify showtime exists
        const [st] = await tx
          .select()
          .from(showtime)
          .where(eq(showtime.id, input.showtimeId));
        if (!st) {
          throw new ORPCError("NOT_FOUND", { message: "Showtime not found" });
        }

        if (st.status === "ended" || st.status === "cancelled") {
          throw new ORPCError("CONFLICT", {
            message: `Cannot book for a showtime with status: ${st.status}`,
          });
        }

        // 2. Check seats exist and are available for this showtime
        const availableSeats = await tx
          .select({
            seatId: showtimeSeat.seatId,
            price: zone.price,
          })
          .from(showtimeSeat)
          .innerJoin(seat, eq(showtimeSeat.seatId, seat.id))
          .innerJoin(zone, eq(seat.zoneId, zone.id))
          .where(
            and(
              eq(showtimeSeat.showtimeId, input.showtimeId),
              inArray(showtimeSeat.seatId, input.seatIds),
              eq(showtimeSeat.isAvailable, true)
            )
          );

        if (availableSeats.length !== input.seatIds.length) {
          throw new ORPCError("CONFLICT", {
            message: "One or more seats are not available",
          });
        }

        // 3. Calculate total amount
        const totalAmount = availableSeats
          .reduce((sum, s) => sum + Number(s.price), 0)
          .toFixed(2);

        // 4. Create booking
        const bookingId = crypto.randomUUID();
        const [newBooking] = await tx
          .insert(booking)
          .values({
            id: bookingId,
            userId,
            showtimeId: input.showtimeId,
            totalAmount,
            status: "confirmed",
          })
          .returning();

        // 5. Create tickets (one per seat)
        const ticketValues = input.seatIds.map((seatId) => ({
          id: crypto.randomUUID(),
          bookingId,
          showtimeId: input.showtimeId,
          seatId,
        }));
        await tx.insert(ticket).values(ticketValues);

        // 6. Mark seats as unavailable
        await tx
          .update(showtimeSeat)
          .set({ isAvailable: false })
          .where(
            and(
              eq(showtimeSeat.showtimeId, input.showtimeId),
              inArray(showtimeSeat.seatId, input.seatIds)
            )
          );

        return newBooking;
      });
    }),

  /** Get the current user's booking history. */
  listMine: protectedProcedure.handler(
    async ({ context }) =>
      await db
        .select()
        .from(booking)
        .where(eq(booking.userId, context.session.user.id))
  ),

  /**
   * Get full details of a booking including tickets.
   * Users can only view their own bookings; admins can view all.
   */
  getDetails: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      const [b] = await db
        .select()
        .from(booking)
        .where(eq(booking.id, input.id));

      if (!b) {
        throw new ORPCError("NOT_FOUND", { message: "Booking not found" });
      }

      const isAdmin = context.session.user.role === "admin";
      if (!isAdmin && b.userId !== context.session.user.id) {
        throw new ORPCError("FORBIDDEN");
      }

      const tickets = await db
        .select({
          ticketId: ticket.id,
          seatNumber: seat.seatNumber,
          zoneName: zone.name,
          price: zone.price,
        })
        .from(ticket)
        .innerJoin(seat, eq(ticket.seatId, seat.id))
        .innerJoin(zone, eq(seat.zoneId, zone.id))
        .where(eq(ticket.bookingId, input.id));

      return { ...b, tickets };
    }),

  /**
   * Admin: cancel a booking.
   * Updates status to "cancelled" with an optional reason.
   */
  cancel: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string().optional(),
      })
    )
    .handler(async ({ context, input }) => {
      const { session } = context;

      const [b] = await db
        .select()
        .from(booking)
        .where(eq(booking.id, input.id));

      if (!b) {
        throw new ORPCError("NOT_FOUND", { message: "Booking not found" });
      }

      const isAdmin = session.user.role === "admin";
      if (!isAdmin && b.userId !== session.user.id) {
        throw new ORPCError("FORBIDDEN");
      }

      if (b.status === "cancelled") {
        throw new ORPCError("CONFLICT", {
          message: "Booking is already cancelled",
        });
      }

      return await db.transaction(async (tx) => {
        // Release the seats back to available
        const bookedTickets = await tx
          .select({ seatId: ticket.seatId })
          .from(ticket)
          .where(eq(ticket.bookingId, input.id));

        if (bookedTickets.length > 0) {
          await tx
            .update(showtimeSeat)
            .set({ isAvailable: true })
            .where(
              and(
                eq(showtimeSeat.showtimeId, b.showtimeId),
                inArray(
                  showtimeSeat.seatId,
                  bookedTickets.map((t) => t.seatId)
                )
              )
            );
        }

        const [updated] = await tx
          .update(booking)
          .set({ status: "cancelled", cancelReason: input.reason })
          .where(eq(booking.id, input.id))
          .returning();

        return updated;
      });
    }),

  /** Admin: list all bookings in the system. */
  listAll: adminProcedure.handler(async () => await db.select().from(booking)),
};
