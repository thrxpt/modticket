import { db } from "@modticket/db";
import { booking, concert, showtime } from "@modticket/db/schema/ticket";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, publicProcedure } from "../index";

export const concertRouter = {
  /** Public: list all concerts. */
  list: publicProcedure.handler(async () => await db.select().from(concert)),

  /** Public: get a single concert by ID. */
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const [item] = await db
        .select()
        .from(concert)
        .where(eq(concert.id, input.id));

      if (!item) {
        throw new ORPCError("NOT_FOUND", { message: "Concert not found" });
      }

      return item;
    }),

  /**
   * Admin: create a new concert.
   * Requires an existing organizer and venue to be referenced.
   */
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        posterUrl: z.string().url().optional(),
        organizedBy: z.string(),
        venueId: z.string(),
      })
    )
    .handler(async ({ input }) => {
      const id = crypto.randomUUID();
      const [item] = await db
        .insert(concert)
        .values({
          id,
          name: input.name,
          description: input.description,
          posterUrl: input.posterUrl,
          organizedBy: input.organizedBy,
          venueId: input.venueId,
        })
        .returning();
      return item;
    }),

  /** Admin: update concert metadata or status. */
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        posterUrl: z.string().url().optional(),
        status: z
          .enum(["draft", "published", "completed", "cancelled"])
          .optional(),
        organizedBy: z.string().optional(),
        venueId: z.string().optional(),
      })
    )
    .handler(async ({ input }) => {
      const { id, ...data } = input;
      const [item] = await db
        .update(concert)
        .set(data)
        .where(eq(concert.id, id))
        .returning();

      if (!item) {
        throw new ORPCError("NOT_FOUND", { message: "Concert not found" });
      }

      return item;
    }),

  /**
   * Admin: delete a concert.
   * Business rule: cannot delete if any showtime of this concert has bookings.
   */
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      // Check for any bookings across all showtimes of this concert
      const [existingBooking] = await db
        .select({ id: booking.id })
        .from(booking)
        .innerJoin(showtime, eq(booking.showtimeId, showtime.id))
        .where(eq(showtime.concertId, input.id));

      if (existingBooking) {
        throw new ORPCError("CONFLICT", {
          message: "Cannot delete a concert that has existing bookings",
        });
      }

      const [item] = await db
        .delete(concert)
        .where(eq(concert.id, input.id))
        .returning();

      if (!item) {
        throw new ORPCError("NOT_FOUND", { message: "Concert not found" });
      }

      return item;
    }),
};
