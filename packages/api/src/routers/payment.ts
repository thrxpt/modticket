import { db } from "@modticket/db";
import { booking, payment } from "@modticket/db/schema/ticket";
import { ORPCError } from "@orpc/server";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, protectedProcedure } from "../index";

export const paymentRouter = {
  /**
   * Create a payment for a confirmed booking.
   * Validates ownership, ensures the booking exists and is confirmed,
   * and prevents duplicate payments.
   */
  create: protectedProcedure
    .input(
      z.object({
        bookingId: z.string(),
        amount: z.string(),
        paymentMethod: z.enum(["cash", "transfer", "card"]),
        bankName: z.string().optional(),
        transactionRef: z.string().min(1),
      })
    )
    .handler(async ({ context, input }) => {
      const { session } = context;

      // Verify booking exists and belongs to the user
      const [b] = await db
        .select()
        .from(booking)
        .where(eq(booking.id, input.bookingId));

      if (!b) {
        throw new ORPCError("NOT_FOUND", { message: "Booking not found" });
      }

      const isAdmin = session.user.role === "admin";
      if (!isAdmin && b.userId !== session.user.id) {
        throw new ORPCError("FORBIDDEN");
      }

      if (b.status !== "confirmed") {
        throw new ORPCError("CONFLICT", {
          message: "Only confirmed bookings can be paid",
        });
      }

      // Prevent duplicate payment for the same booking
      const [existingPayment] = await db
        .select()
        .from(payment)
        .where(eq(payment.bookingId, input.bookingId));

      if (existingPayment) {
        throw new ORPCError("CONFLICT", {
          message: "A payment already exists for this booking",
        });
      }

      const id = crypto.randomUUID();
      const [newPayment] = await db
        .insert(payment)
        .values({
          id,
          bookingId: input.bookingId,
          amount: input.amount,
          paymentMethod: input.paymentMethod,
          paymentStatus: "paid",
          bankName: input.bankName,
          transactionRef: input.transactionRef,
          paymentDate: new Date(),
        })
        .returning();

      return newPayment;
    }),

  /** Get a single payment by ID. Users can only see their own booking's payment. */
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      const { session } = context;

      const [p] = await db
        .select()
        .from(payment)
        .where(eq(payment.id, input.id));

      if (!p) {
        throw new ORPCError("NOT_FOUND", { message: "Payment not found" });
      }

      // Verify booking ownership
      const [b] = await db
        .select()
        .from(booking)
        .where(eq(booking.id, p.bookingId));

      const isAdmin = session.user.role === "admin";
      if (!isAdmin && b?.userId !== session.user.id) {
        throw new ORPCError("FORBIDDEN");
      }

      return p;
    }),

  /** List payments for the current user's bookings. */
  listMine: protectedProcedure.handler(async ({ context }) => {
    const { session } = context;

    const myBookings = await db
      .select({ id: booking.id })
      .from(booking)
      .where(eq(booking.userId, session.user.id));

    if (myBookings.length === 0) {
      return [];
    }

    const bookingIds = myBookings.map((b) => b.id);

    return await db
      .select()
      .from(payment)
      .where(inArray(payment.bookingId, bookingIds));
  }),

  /** Admin: list all payments. */
  listAll: adminProcedure.handler(async () => await db.select().from(payment)),

  /** Admin: update payment status (e.g. mark as refunded). */
  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]),
      })
    )
    .handler(async ({ input }) => {
      const [updated] = await db
        .update(payment)
        .set({ paymentStatus: input.paymentStatus })
        .where(eq(payment.id, input.id))
        .returning();

      if (!updated) {
        throw new ORPCError("NOT_FOUND", { message: "Payment not found" });
      }

      return updated;
    }),
};
