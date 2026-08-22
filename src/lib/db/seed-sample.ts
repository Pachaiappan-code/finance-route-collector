import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import { getDayOfWeek } from "../calculations/cycle";

const SAMPLE_ROUTE_NAME = "Route 1";

const SAMPLE_CUSTOMERS = [
  { name: "Ravi Kumar", phone: "9876500001", area: "Anna Nagar", principal: 10000, interest: 2000, collection: 1500 },
  { name: "Meena Devi", phone: "9876500002", area: "Anna Nagar", principal: 8000, interest: 1600, collection: 1200 },
  { name: "Suresh Babu", phone: "9876500003", area: "Kilpauk", principal: 15000, interest: 3000, collection: 2000 },
  { name: "Lakshmi Priya", phone: "9876500004", area: "Kilpauk", principal: 6000, interest: 1200, collection: 900 },
  { name: "Arun Prasad", phone: "9876500005", area: "Villivakkam", principal: 12000, interest: 2400, collection: 1800 },
  { name: "Kavitha Rani", phone: "9876500006", area: "Villivakkam", principal: 9000, interest: 1800, collection: 1300 },
  { name: "Mani Shankar", phone: "9876500007", area: "Perambur", principal: 20000, interest: 4000, collection: 2500 },
  { name: "Deepa Selvam", phone: "9876500008", area: "Perambur", principal: 7000, interest: 1400, collection: 1000 },
  { name: "Bala Murugan", phone: "9876500009", area: "Ambattur", principal: 11000, interest: 2200, collection: 1600 },
  { name: "Priya Dharshini", phone: "9876500010", area: "Ambattur", principal: 5000, interest: 1000, collection: 800 },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set.");
  }
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  const [business] = await db.select().from(schema.businesses).limit(1);
  if (!business) {
    throw new Error("No business found — run `npm run db:seed` first.");
  }

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const todayDow = getDayOfWeek(today);

  let [route] = await db
    .select()
    .from(schema.routes)
    .where(eq(schema.routes.name, SAMPLE_ROUTE_NAME))
    .limit(1);

  if (!route) {
    [route] = await db
      .insert(schema.routes)
      .values({
        businessId: business.id,
        name: SAMPLE_ROUTE_NAME,
        dayOfWeek: todayDow,
        routeOrder: 0,
        description: "Sample route for testing",
      })
      .returning();
    console.log(`Created route: ${route.name} (${route.id})`);
  } else {
    console.log(`Route already exists: ${route.name} (${route.id})`);
  }

  const [existingCustomerOnRoute] = await db
    .select({ id: schema.customers.id })
    .from(schema.customers)
    .where(eq(schema.customers.routeId, route.id))
    .limit(1);

  if (existingCustomerOnRoute) {
    console.log("Sample route already has customers — skipping (idempotent). Delete them first if you want to regenerate.");
    return;
  }

  for (let i = 0; i < SAMPLE_CUSTOMERS.length; i++) {
    const c = SAMPLE_CUSTOMERS[i];
    const totalRepayment = c.principal + c.interest;

    const codeCountRows = await db.select().from(schema.customers);
    const customerCode = `CUS-${String(codeCountRows.length + 1).padStart(4, "0")}`;

    const [customer] = await db
      .insert(schema.customers)
      .values({
        businessId: business.id,
        customerCode,
        name: c.name,
        phone: c.phone,
        area: c.area,
        routeId: route.id,
        routeSequence: i,
        principalAmount: String(c.principal),
        interestAmount: String(c.interest),
        totalRepaymentAmount: String(totalRepayment),
        collectionAmount: String(c.collection),
        outstandingAmount: String(totalRepayment),
        cycleDays: 7,
        startDate: todayStr,
      })
      .returning();

    await db.insert(schema.collectionSchedules).values({
      customerId: customer.id,
      routeId: route.id,
      scheduledDate: todayStr,
      expectedAmount: String(c.collection),
      cycleNumber: 1,
      status: "pending",
    });

    console.log(`Created customer: ${customer.name} (${customer.customerCode})`);
  }

  console.log(`\nDone. ${SAMPLE_CUSTOMERS.length} sample customers created on "${route.name}" for ${todayStr}.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Sample seed failed:", err);
    process.exit(1);
  });
