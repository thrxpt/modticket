import { db } from "@modticket/db";
import { ticket } from "@modticket/db/schema/ticket";
import { adminProcedure } from "../index";

export const ticketRouter = {
  /** Admin: list all tickets in the system. */
  listAll: adminProcedure.handler(async () => await db.select().from(ticket)),
};
