import { db } from "@modticket/db";
import { seat, venue, zone } from "@modticket/db/schema/ticket";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, publicProcedure } from "../index";

export const venueRouter = {
  list: publicProcedure.handler(async () => await db.select().from(venue)),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const [item] = await db
        .select()
        .from(venue)
        .where(eq(venue.id, input.id));

      if (!item) {
        throw new ORPCError("NOT_FOUND", { message: "Venue not found" });
      }

      return item;
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        location: z.string().min(1),
        capacity: z.number().int().positive(),
      })
    )
    .handler(async ({ input }) => {
      const id = crypto.randomUUID();
      const [item] = await db
        .insert(venue)
        .values({
          id,
          ...input,
        })
        .returning();
      return item;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        location: z.string().min(1).optional(),
        capacity: z.number().int().positive().optional(),
      })
    )
    .handler(async ({ input }) => {
      const { id, ...data } = input;
      const [item] = await db
        .update(venue)
        .set(data)
        .where(eq(venue.id, id))
        .returning();

      if (!item) {
        throw new ORPCError("NOT_FOUND", { message: "Venue not found" });
      }

      return item;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const [item] = await db
        .delete(venue)
        .where(eq(venue.id, input.id))
        .returning();

      if (!item) {
        throw new ORPCError("NOT_FOUND", { message: "Venue not found" });
      }

      return item;
    }),

  listZones: publicProcedure
    .input(z.object({ venueId: z.string() }))
    .handler(
      async ({ input }) =>
        await db.select().from(zone).where(eq(zone.venueId, input.venueId))
    ),

  createZone: adminProcedure
    .input(
      z.object({
        venueId: z.string(),
        name: z.string().min(1),
        capacity: z.number().int().positive(),
        price: z.string(),
      })
    )
    .handler(async ({ input }) => {
      const id = crypto.randomUUID();
      const [item] = await db
        .insert(zone)
        .values({
          id,
          ...input,
        })
        .returning();
      return item;
    }),

  updateZone: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        capacity: z.number().int().positive().optional(),
        price: z.string().optional(),
      })
    )
    .handler(async ({ input }) => {
      const { id, ...data } = input;
      const [item] = await db
        .update(zone)
        .set(data)
        .where(eq(zone.id, id))
        .returning();

      if (!item) {
        throw new ORPCError("NOT_FOUND", { message: "Zone not found" });
      }

      return item;
    }),

  deleteZone: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const [item] = await db
        .delete(zone)
        .where(eq(zone.id, input.id))
        .returning();

      if (!item) {
        throw new ORPCError("NOT_FOUND", { message: "Zone not found" });
      }

      return item;
    }),

  listSeats: publicProcedure
    .input(z.object({ zoneId: z.string() }))
    .handler(
      async ({ input }) =>
        await db.select().from(seat).where(eq(seat.zoneId, input.zoneId))
    ),

  createSeats: adminProcedure
    .input(
      z.object({
        zoneId: z.string(),
        seatNumbers: z.array(z.string().min(1)),
      })
    )
    .handler(async ({ input }) => {
      const values = input.seatNumbers.map((seatNumber) => ({
        id: crypto.randomUUID(),
        zoneId: input.zoneId,
        seatNumber,
      }));

      return await db.insert(seat).values(values).returning();
    }),
};
