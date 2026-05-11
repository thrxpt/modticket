import type { RouterClient } from "@orpc/server";

import { publicProcedure } from "../index";
import { bookingRouter } from "./booking";
import { concertRouter } from "./concert";
import { organizerRouter } from "./organizer";
import { paymentRouter } from "./payment";
import { showtimeRouter } from "./showtime";
import { venueRouter } from "./venue";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  booking: bookingRouter,
  concert: concertRouter,
  organizer: organizerRouter,
  payment: paymentRouter,
  showtime: showtimeRouter,
  venue: venueRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
