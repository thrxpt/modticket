import { relations } from "drizzle-orm";

import { account, session, user } from "./auth";
import {
  booking,
  concert,
  organizer,
  payment,
  seat,
  showtime,
  showtimeSeat,
  ticket,
  venue,
  zone,
} from "./ticket";

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  bookings: many(booking),
  sessions: many(session),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const organizerRelations = relations(organizer, ({ many }) => ({
  concerts: many(concert),
}));

export const venueRelations = relations(venue, ({ many }) => ({
  showtimes: many(showtime),
  zones: many(zone),
}));

export const concertRelations = relations(concert, ({ one, many }) => ({
  organizer: one(organizer, {
    fields: [concert.organizedBy],
    references: [organizer.id],
  }),
  venue: one(venue, {
    fields: [concert.venueId],
    references: [venue.id],
  }),
  showtimes: many(showtime),
}));

export const zoneRelations = relations(zone, ({ one, many }) => ({
  seats: many(seat),
  venue: one(venue, {
    fields: [zone.venueId],
    references: [venue.id],
  }),
}));

export const seatRelations = relations(seat, ({ one, many }) => ({
  showtimeSeats: many(showtimeSeat),
  tickets: many(ticket),
  zone: one(zone, {
    fields: [seat.zoneId],
    references: [zone.id],
  }),
}));

export const showtimeRelations = relations(showtime, ({ one, many }) => ({
  bookings: many(booking),
  concert: one(concert, {
    fields: [showtime.concertId],
    references: [concert.id],
  }),
  showtimeSeats: many(showtimeSeat),
  tickets: many(ticket),
  venue: one(venue, {
    fields: [showtime.venueId],
    references: [venue.id],
  }),
}));

export const showtimeSeatRelations = relations(showtimeSeat, ({ one }) => ({
  seat: one(seat, {
    fields: [showtimeSeat.seatId],
    references: [seat.id],
  }),
  showtime: one(showtime, {
    fields: [showtimeSeat.showtimeId],
    references: [showtime.id],
  }),
}));

export const bookingRelations = relations(booking, ({ one, many }) => ({
  payments: many(payment),
  showtime: one(showtime, {
    fields: [booking.showtimeId],
    references: [showtime.id],
  }),
  tickets: many(ticket),
  user: one(user, {
    fields: [booking.userId],
    references: [user.id],
  }),
}));

export const ticketRelations = relations(ticket, ({ one }) => ({
  booking: one(booking, {
    fields: [ticket.bookingId],
    references: [booking.id],
  }),
  seat: one(seat, {
    fields: [ticket.seatId],
    references: [seat.id],
  }),
  showtime: one(showtime, {
    fields: [ticket.showtimeId],
    references: [showtime.id],
  }),
}));

export const paymentRelations = relations(payment, ({ one }) => ({
  booking: one(booking, {
    fields: [payment.bookingId],
    references: [booking.id],
  }),
}));
