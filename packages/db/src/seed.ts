import { faker } from "@faker-js/faker";
import { auth } from "@modticket/auth";
import { and, eq, inArray, sql } from "drizzle-orm";
import { UniqueEnforcer } from "enforce-unique";
import { db } from ".";
import * as schema from "./schema";

const USER_COUNT = 500;
const ORGANIZER_COUNT = 30;
const VENUE_COUNT = 15;
const CONCERT_COUNT = 50;
const BOOKING_COUNT = 1000;
const SHOWTIMES_PER_CONCERT = 3;
const MAX_SEATS_PER_ZONE = 200;
const MAX_SEATS_PER_BOOKING = 6;
const DEFAULT_PASSWORD = "password123";
const ADMIN_USER = {
  name: "Admin",
  email: "admin@modticket.com",
  password: DEFAULT_PASSWORD,
  role: "admin",
  phone: "+66000000000",
  birthDate: new Date("1990-01-01"),
  gender: "male",
} as const;

type Seat = typeof schema.seat.$inferSelect;
type Showtime = typeof schema.showtime.$inferSelect;
type Venue = typeof schema.venue.$inferSelect;
type Zone = typeof schema.zone.$inferSelect;

const uniqueEnforcerEmail = new UniqueEnforcer();
const uniqueEnforcerPhone = new UniqueEnforcer();
const uniqueEnforcerTransactionRef = new UniqueEnforcer();

function createRandomUser() {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const email = uniqueEnforcerEmail.enforce(() =>
    faker.internet.email({ firstName, lastName })
  );
  const phone = uniqueEnforcerPhone.enforce(() =>
    faker.phone.number({ style: "international" })
  );
  return {
    name: `${firstName} ${lastName}`,
    email,
    password: DEFAULT_PASSWORD,
    role: "user",
    phone,
    birthDate: faker.date.birthdate(),
    gender: faker.helpers.arrayElement(schema.genderEnum.enumValues),
  };
}

function createVenueZones(venue: Venue) {
  const vipCapacity = Math.floor(venue.capacity * 0.1);
  const regularCapacity = Math.floor(venue.capacity * 0.6);
  const economyCapacity = venue.capacity - vipCapacity - regularCapacity;

  return [
    {
      id: crypto.randomUUID(),
      name: "VIP",
      capacity: vipCapacity,
      price: "5000.00",
      venueId: venue.id,
    },
    {
      id: crypto.randomUUID(),
      name: "Regular",
      capacity: regularCapacity,
      price: "2000.00",
      venueId: venue.id,
    },
    {
      id: crypto.randomUUID(),
      name: "Economy",
      capacity: economyCapacity,
      price: "1000.00",
      venueId: venue.id,
    },
  ] satisfies (typeof schema.zone.$inferInsert)[];
}

function createSeatsForZone(zone: Zone) {
  const seatCount = Math.min(MAX_SEATS_PER_ZONE, zone.capacity);

  return Array.from({ length: seatCount }, (_, index) => ({
    id: crypto.randomUUID(),
    seatNumber: `${zone.name[0]}${index + 1}`,
    zoneId: zone.id,
  })) satisfies (typeof schema.seat.$inferInsert)[];
}

function createTransactionRef() {
  return uniqueEnforcerTransactionRef.enforce(() =>
    faker.string.alphanumeric(10).toUpperCase()
  );
}

async function seed() {
  console.log("🧹 Cleaning existing data...");
  await db.execute(sql`
    TRUNCATE TABLE 
      "user", "session", "account", "verification",
      "organizer", "venue", "concert", "zone", "seat",
      "showtime", "showtime_seat", "booking", "payment", "ticket"
    CASCADE;
  `);

  console.log("👑 Creating admin...");
  const admin = await auth.api.createUser({
    body: {
      name: ADMIN_USER.name,
      email: ADMIN_USER.email,
      password: ADMIN_USER.password,
      role: ADMIN_USER.role,
      data: {
        phone: ADMIN_USER.phone,
        birthDate: ADMIN_USER.birthDate,
        gender: ADMIN_USER.gender,
      },
    },
  });
  console.log("✅ Admin created successfully:", admin.user.email);

  console.log(`👥 Creating ${USER_COUNT} users...`);
  const userIds: string[] = [];
  for (let i = 0; i < USER_COUNT; i++) {
    const userData = createRandomUser();
    const result = await auth.api.createUser({
      body: {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: "user",
        data: {
          phone: userData.phone,
          birthDate: userData.birthDate,
          gender: userData.gender,
        },
      },
    });
    userIds.push(result.user.id);
  }
  console.log(`✅ ${USER_COUNT} users created`);

  console.log(`🏢 Creating ${ORGANIZER_COUNT} organizers...`);
  const organizers = await db
    .insert(schema.organizer)
    .values(
      Array.from({ length: ORGANIZER_COUNT }).map(() => ({
        id: crypto.randomUUID(),
        name: faker.company.name(),
        email: uniqueEnforcerEmail.enforce(() => faker.internet.email()),
        phone: uniqueEnforcerPhone.enforce(() =>
          faker.phone.number({ style: "international" })
        ),
      }))
    )
    .returning();
  console.log(`✅ ${ORGANIZER_COUNT} organizers created`);

  console.log(`🏟️ Creating ${VENUE_COUNT} venues...`);
  const venues = await db
    .insert(schema.venue)
    .values(
      Array.from({ length: VENUE_COUNT }).map(() => ({
        id: crypto.randomUUID(),
        name: `${faker.company.name()} Arena`,
        location: `${faker.location.streetAddress()}, ${faker.location.city()}`,
        capacity: faker.number.int({ min: 1000, max: 50_000 }),
      }))
    )
    .returning();
  console.log(`✅ ${VENUE_COUNT} venues created`);

  console.log("📍 Creating zones and seats for each venue...");
  const allSeats: Seat[] = [];
  const venueZones = new Map<string, Zone[]>();

  for (const venue of venues) {
    const zones = await db
      .insert(schema.zone)
      .values(createVenueZones(venue))
      .returning();

    venueZones.set(venue.id, zones);

    for (const zone of zones) {
      // Create a few seats for each zone (not filling entirely to keep seed fast)
      const seats = await db
        .insert(schema.seat)
        .values(createSeatsForZone(zone))
        .returning();
      allSeats.push(...seats);
    }
  }
  console.log(`✅ Zones and ${allSeats.length} seats created`);

  console.log(`🎤 Creating ${CONCERT_COUNT} concerts...`);
  const concerts = await db
    .insert(schema.concert)
    .values(
      Array.from({ length: CONCERT_COUNT }).map(() => {
        const venue = faker.helpers.arrayElement(venues);
        return {
          id: crypto.randomUUID(),
          name: `${faker.music.songName()} Live Tour`,
          description: faker.lorem.paragraphs(2),
          posterUrl: faker.image.url({
            width: 400,
            height: 600,
          }),
          status: "published" as const,
          organizedBy: faker.helpers.arrayElement(organizers).id,
          venueId: venue.id,
        };
      })
    )
    .returning();
  console.log(`✅ ${CONCERT_COUNT} concerts created`);

  console.log("📅 Creating showtimes and showtime seats...");
  const showtimes: Showtime[] = [];
  for (const concert of concerts) {
    const concertShowtimes = await db
      .insert(schema.showtime)
      .values(
        Array.from({ length: SHOWTIMES_PER_CONCERT }).map(() => ({
          id: crypto.randomUUID(),
          showDatetime: faker.date.future(),
          status: "upcoming" as const,
          concertId: concert.id,
          venueId: concert.venueId,
        }))
      )
      .returning();

    showtimes.push(...concertShowtimes);

    // Create showtime seats for each showtime
    // Find seats belonging to the venue of this concert
    const zonesInVenue = venueZones.get(concert.venueId) ?? [];
    const zoneIds = zonesInVenue.map((z) => z.id);
    const seatsInVenue = allSeats.filter((s) => zoneIds.includes(s.zoneId));

    for (const showtime of concertShowtimes) {
      await db.insert(schema.showtimeSeat).values(
        seatsInVenue.map((seat) => ({
          showtimeId: showtime.id,
          seatId: seat.id,
          isAvailable: true,
        }))
      );
    }
  }
  console.log(`✅ ${showtimes.length} showtimes and their seats created`);

  console.log(`🎟️ Creating ${BOOKING_COUNT} bookings...`);
  let createdBookingCount = 0;
  for (let i = 0; i < BOOKING_COUNT; i++) {
    const user = faker.helpers.arrayElement(userIds);
    const showtime = faker.helpers.arrayElement(showtimes);
    const seatsRequested = faker.number.int({
      min: 1,
      max: MAX_SEATS_PER_BOOKING,
    });

    // Get available seats for this showtime
    const availableSeats = await db
      .select()
      .from(schema.showtimeSeat)
      .where(
        and(
          eq(schema.showtimeSeat.showtimeId, showtime.id),
          eq(schema.showtimeSeat.isAvailable, true)
        )
      )
      .limit(seatsRequested);

    if (availableSeats.length === 0) {
      continue;
    }

    const availableSeatIds = availableSeats.map((seat) => seat.seatId);

    // Get zone info for prices
    const seatsInfo = await db
      .select({
        id: schema.seat.id,
        price: schema.zone.price,
      })
      .from(schema.seat)
      .innerJoin(schema.zone, eq(schema.seat.zoneId, schema.zone.id))
      .where(inArray(schema.seat.id, availableSeatIds));

    const totalAmount = seatsInfo.reduce((sum, s) => sum + Number(s.price), 0);
    const formattedTotalAmount = totalAmount.toFixed(2);

    await db.transaction(async (tx) => {
      const [booking] = await tx
        .insert(schema.booking)
        .values({
          id: crypto.randomUUID(),
          showtimeId: showtime.id,
          userId: user,
          totalAmount: formattedTotalAmount,
          status: "confirmed",
          bookingDate: new Date(),
        })
        .returning();

      if (!booking) {
        throw new Error("Booking insert did not return a row.");
      }

      await tx.insert(schema.payment).values({
        id: crypto.randomUUID(),
        amount: formattedTotalAmount,
        bookingId: booking.id,
        paymentDate: new Date(),
        paymentMethod: faker.helpers.arrayElement(
          schema.paymentMethodEnum.enumValues
        ),
        paymentStatus: "paid",
        transactionRef: createTransactionRef(),
      });

      await tx.insert(schema.ticket).values(
        seatsInfo.map((seat) => ({
          id: crypto.randomUUID(),
          bookingId: booking.id,
          seatId: seat.id,
          showtimeId: showtime.id,
        }))
      );

      await tx
        .update(schema.showtimeSeat)
        .set({ isAvailable: false })
        .where(
          and(
            eq(schema.showtimeSeat.showtimeId, showtime.id),
            inArray(schema.showtimeSeat.seatId, availableSeatIds)
          )
        );
    });

    createdBookingCount++;
  }
  console.log(`✅ ${createdBookingCount} bookings created`);

  console.log("✨ Seeding completed successfully!");
}

try {
  await seed();
} catch (error) {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
}
