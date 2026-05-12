import { db } from "@modticket/db";
import { adminProcedure } from "../index";

export const ticketRouter = {
  /** Admin: list all tickets in the system. */
  listAll: adminProcedure.handler(
    async () =>
      await db.query.ticket.findMany({
        with: {
          booking: {
            with: {
              user: true,
            },
          },
          showtime: {
            with: {
              concert: true,
            },
          },
          seat: true,
        },
      })
  ),
};
