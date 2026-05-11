import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const concertStatusEnum = pgEnum("concert_status", [
  "draft",
  "published",
  "completed",
  "cancelled",
]);

export const showtimeStatusEnum = pgEnum("showtime_status", [
  "upcoming",
  "ongoing",
  "ended",
  "cancelled",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "transfer",
  "card",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "cancelled",
]);

export const organizer = pgTable("organizer", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const venue = pgTable("venue", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  capacity: integer("capacity").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const concert = pgTable("concert", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  posterUrl: text("poster_url"),
  status: concertStatusEnum("status").default("draft").notNull(),
  organizedBy: text("organized_by")
    .notNull()
    .references(() => organizer.id, { onDelete: "restrict" }),
  venueId: text("venue_id")
    .notNull()
    .references(() => venue.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const zone = pgTable("zone", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  venueId: text("venue_id")
    .notNull()
    .references(() => venue.id, { onDelete: "restrict" }),
});

export const seat = pgTable(
  "seat",
  {
    id: text("id").primaryKey(),
    seatNumber: text("seat_number").notNull(),
    zoneId: text("zone_id")
      .notNull()
      .references(() => zone.id, { onDelete: "restrict" }),
  },
  (table) => [
    unique("seat_zone_number_unique").on(table.zoneId, table.seatNumber),
  ]
);

export const showtime = pgTable("showtime", {
  id: text("id").primaryKey(),
  showDatetime: timestamp("show_datetime", { withTimezone: true }).notNull(),
  status: showtimeStatusEnum("status").notNull(),
  concertId: text("concert_id")
    .notNull()
    .references(() => concert.id, { onDelete: "restrict" }),
  venueId: text("venue_id")
    .notNull()
    .references(() => venue.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const showtimeSeat = pgTable(
  "showtime_seat",
  {
    isAvailable: boolean("is_available").notNull(),
    seatId: text("seat_id")
      .notNull()
      .references(() => seat.id),
    showtimeId: text("showtime_id")
      .notNull()
      .references(() => showtime.id),
  },
  (table) => [
    primaryKey({ columns: [table.showtimeId, table.seatId] }),
    index("showtime_seat_showtime_id_idx").on(table.showtimeId),
    index("showtime_seat_seat_id_idx").on(table.seatId),
  ]
);

export const booking = pgTable(
  "booking",
  {
    id: text("id").primaryKey(),
    showtimeId: text("showtime_id")
      .notNull()
      .references(() => showtime.id, { onDelete: "restrict" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
    status: bookingStatusEnum("status").default("pending").notNull(),
    cancelReason: text("cancel_reason"),
    bookingDate: timestamp("booking_date", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("booking_user_id_idx").on(table.userId),
    index("booking_showtime_id_idx").on(table.showtimeId),
  ]
);

export const payment = pgTable(
  "payment",
  {
    id: text("id").primaryKey(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => booking.id, { onDelete: "restrict" }),
    paymentDate: timestamp("payment_date", { withTimezone: true }).notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    paymentStatus: paymentStatusEnum("payment_status").notNull(),
    bankName: text("bank_name"),
    transactionRef: text("transaction_ref").notNull().unique(),
  },
  (table) => [index("payment_booking_id_idx").on(table.bookingId)]
);

export const ticket = pgTable(
  "ticket",
  {
    id: text("id").primaryKey(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => booking.id),
    seatId: text("seat_id")
      .notNull()
      .references(() => seat.id, { onDelete: "restrict" }),
    showtimeId: text("showtime_id")
      .notNull()
      .references(() => showtime.id, { onDelete: "restrict" }),
  },
  (table) => [
    unique("ticket_showtime_seat_unique").on(table.showtimeId, table.seatId),
    index("ticket_booking_id_idx").on(table.bookingId),
    index("ticket_showtime_id_idx").on(table.showtimeId),
    index("ticket_seat_id_idx").on(table.seatId),
  ]
);
