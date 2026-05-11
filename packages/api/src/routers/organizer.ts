import { organizer } from "@modticket/db/schema/ticket";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure, publicProcedure } from "../index";

export const organizerRouter = {
  list: publicProcedure.handler(
    async ({ context }) => await context.db.select().from(organizer)
  ),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      const [item] = await context.db
        .select()
        .from(organizer)
        .where(eq(organizer.id, input.id));

      if (!item) {
        throw new ORPCError("NOT_FOUND", { message: "Organizer not found" });
      }

      return item;
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(1),
      })
    )
    .handler(async ({ context, input }) => {
      const id = crypto.randomUUID();
      const [item] = await context.db
        .insert(organizer)
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
        email: z.string().email().optional(),
        phone: z.string().min(1).optional(),
      })
    )
    .handler(async ({ context, input }) => {
      const { id, ...data } = input;
      const [item] = await context.db
        .update(organizer)
        .set(data)
        .where(eq(organizer.id, id))
        .returning();

      if (!item) {
        throw new ORPCError("NOT_FOUND", { message: "Organizer not found" });
      }

      return item;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      const [item] = await context.db
        .delete(organizer)
        .where(eq(organizer.id, input.id))
        .returning();

      if (!item) {
        throw new ORPCError("NOT_FOUND", { message: "Organizer not found" });
      }

      return item;
    }),
};
