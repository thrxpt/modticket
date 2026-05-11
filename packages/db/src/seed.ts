import { faker } from "@faker-js/faker";
import { auth } from "@modticket/auth";
import { sql } from "drizzle-orm";
import { UniqueEnforcer } from "enforce-unique";
import { db } from ".";
import * as schema from "./schema";

const USER_COUNT = 50;
const ORGANIZER_COUNT = 5;
const VENUE_COUNT = 3;
const CONCERT_COUNT = 10;
const BOOKING_COUNT = 100;

const uniqueEnforcerEmail = new UniqueEnforcer();
const uniqueEnforcerPhone = new UniqueEnforcer();

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
    password: "password123",
    role: "user",
    phone,
    birthDate: faker.date.birthdate(),
    gender: faker.helpers.arrayElement(schema.genderEnum.enumValues),
  };
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
      name: "Admin",
      email: "admin@modticket.com",
      password: "password123",
      role: "admin",
      data: {
        phone: "+66000000000",
        birthDate: new Date("1990-01-01"),
        gender: "male",
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
  const allSeats: (typeof schema.seat.$inferSelect)[] = [];
  const venueZones: Map<string, (typeof schema.zone.$inferSelect)[]> =
    new Map();

  for (const venue of venues) {
    const zones = await db
      .insert(schema.zone)
      .values([
        {
          id: crypto.randomUUID(),
          name: "VIP",
          capacity: Math.floor(venue.capacity * 0.1),
          price: "5000.00",
          venueId: venue.id,
        },
        {
          id: crypto.randomUUID(),
          name: "Regular",
          capacity: Math.floor(venue.capacity * 0.6),
          price: "2000.00",
          venueId: venue.id,
        },
        {
          id: crypto.randomUUID(),
          name: "Economy",
          capacity: Math.floor(venue.capacity * 0.3),
          price: "1000.00",
          venueId: venue.id,
        },
      ])
      .returning();

    venueZones.set(venue.id, zones);

    for (const zone of zones) {
      // Create a few seats for each zone (not filling entirely to keep seed fast)
      const seatCount = Math.min(20, zone.capacity);
      const seats = await db
        .insert(schema.seat)
        .values(
          Array.from({ length: seatCount }).map((_, i) => ({
            id: crypto.randomUUID(),
            seatNumber: `${zone.name[0]}${i + 1}`,
            zoneId: zone.id,
          }))
        )
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
  const showtimes: (typeof schema.showtime.$inferSelect)[] = [];
  for (const concert of concerts) {
    const concertShowtimes = await db
      .insert(schema.showtime)
      .values(
        Array.from({ length: 2 }).map((_, _i) => ({
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
    const zonesInVenue = venueZones.get(concert.venueId) || [];
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
  for (let i = 0; i < BOOKING_COUNT; i++) {
    const user = faker.helpers.arrayElement(userIds);
    const showtime = faker.helpers.arrayElement(showtimes);

    // Get available seats for this showtime
    const availableSeats = await db
      .select()
      .from(schema.showtimeSeat)
      .where(
        sql`${schema.showtimeSeat.showtimeId} = ${showtime.id} AND ${schema.showtimeSeat.isAvailable} = true`
      )
      .limit(faker.number.int({ min: 1, max: 4 }));

    if (availableSeats.length === 0) {
      continue;
    }

    // Get zone info for prices
    const seatsInfo = await db
      .select({
        id: schema.seat.id,
        price: schema.zone.price,
      })
      .from(schema.seat)
      .innerJoin(schema.zone, sql`${schema.seat.zoneId} = ${schema.zone.id}`)
      .where(sql`${schema.seat.id} IN ${availableSeats.map((s) => s.seatId)}`);

    const totalAmount = seatsInfo.reduce((sum, s) => sum + Number(s.price), 0);

    const [booking] = await db
      .insert(schema.booking)
      .values({
        id: crypto.randomUUID(),
        showtimeId: showtime.id,
        userId: user,
        totalAmount: totalAmount.toFixed(2),
        status: "confirmed",
        bookingDate: new Date(),
      })
      .returning();

    // Create payment
    await db.insert(schema.payment).values({
      id: crypto.randomUUID(),
      amount: totalAmount.toFixed(2),
      bookingId: booking.id,
      paymentDate: new Date(),
      paymentMethod: faker.helpers.arrayElement(
        schema.paymentMethodEnum.enumValues
      ),
      paymentStatus: "paid",
      transactionRef: faker.string.alphanumeric(10).toUpperCase(),
    });

    // Create tickets and update showtime seats
    for (const seat of seatsInfo) {
      await db.insert(schema.ticket).values({
        id: crypto.randomUUID(),
        bookingId: booking.id,
        seatId: seat.id,
        showtimeId: showtime.id,
      });

      await db
        .update(schema.showtimeSeat)
        .set({ isAvailable: false })
        .where(
          sql`${schema.showtimeSeat.showtimeId} = ${showtime.id} AND ${schema.showtimeSeat.seatId} = ${seat.id}`
        );
    }
  }
  console.log(`✅ ${BOOKING_COUNT} bookings created`);

  console.log("✨ Seeding completed successfully!");
}

try {
  await seed();
} catch (error) {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
}
