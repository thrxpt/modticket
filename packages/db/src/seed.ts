import { faker } from "@faker-js/faker";
import { auth } from "@modticket/auth";
import { sql } from "drizzle-orm";
import { UniqueEnforcer } from "enforce-unique";
import { db } from ".";
import { genderEnum } from "./schema";

const USER_COUNT = 1000;
const CONCURRENCY = 50;

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
    password: faker.internet.password(),
    role: "user",
    data: {
      phone,
      birthDate: faker.date.birthdate(),
      gender: faker.helpers.arrayElement(genderEnum.enumValues),
    },
  };
}

async function seed() {
  console.log("🧹 Cleaning existing data...");
  await db.execute(sql`
    TRUNCATE TABLE 
      "user", "session", "account", "verification" 
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
      },
    },
  });
  console.log("✅ Admin created successfully:", admin.user.email);

  console.log(
    `👥 Creating ${USER_COUNT} users in batches of ${CONCURRENCY}...`
  );
  for (let i = 0; i < USER_COUNT; i += CONCURRENCY) {
    const batchSize = Math.min(CONCURRENCY, USER_COUNT - i);
    const promises = Array.from({ length: batchSize }).map(async () => {
      const user = createRandomUser();
      return await auth.api.createUser({
        body: {
          name: user.name,
          email: user.email,
          password: user.password,
          role: "user",
          data: {
            phone: user.data.phone,
            birthDate: user.data.birthDate,
            gender: user.data.gender,
          },
        },
      });
    });
    await Promise.all(promises);
    console.log(`✅ Progress: ${i + batchSize}/${USER_COUNT} users created`);
  }

  console.log("✨ Seeding completed successfully!");
}

try {
  await seed();
} catch (error) {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
}
