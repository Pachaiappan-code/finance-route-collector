import { config } from "dotenv";
config({ path: ".env.local" });

import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "worldconnect.dm@gmail.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "VtcaFleEWT5";
const BUSINESS_NAME = process.env.SEED_BUSINESS_NAME ?? "EMF";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set.");
  }
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  const [existingBusiness] = await db
    .select()
    .from(schema.businesses)
    .limit(1);

  const business =
    existingBusiness ??
    (
      await db
        .insert(schema.businesses)
        .values({ name: BUSINESS_NAME })
        .returning()
    )[0];

  console.log(`Business: ${business.name} (${business.id})`);

  const [existingUser] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, ADMIN_EMAIL.toLowerCase()))
    .limit(1);

  if (existingUser) {
    console.log(`Admin user already exists: ${existingUser.email}`);
    return;
  }

  const passwordHash = await hash(ADMIN_PASSWORD, 12);

  const [user] = await db
    .insert(schema.users)
    .values({
      businessId: business.id,
      name: "Owner",
      email: ADMIN_EMAIL.toLowerCase(),
      passwordHash,
      role: "owner",
    })
    .returning();

  console.log(`Created admin user: ${user.email}`);
  console.log(
    "Initial password: whatever SEED_ADMIN_PASSWORD was set to (or the script's built-in default) — not printed here to keep it out of shell/CI logs.",
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
