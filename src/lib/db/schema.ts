import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  serial,
  numeric,
  date,
  time,
  timestamp,
  boolean,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const userRoleEnum = pgEnum("user_role", ["owner", "collector"]);

export const collectionStatusEnum = pgEnum("collection_status", [
  "pending",
  "paid",
  "partial",
  "due",
  "rescheduled",
  "cancelled",
  "overdue",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "upi",
  "bank_transfer",
  "other",
]);

export const promiseStatusEnum = pgEnum("promise_status", [
  "pending",
  "completed",
  "cancelled",
  "expired",
]);

export const reminderTypeEnum = pgEnum("reminder_type", [
  "15_min_before",
  "30_min_before",
  "1_hour_before",
  "exact_time",
]);

export const reminderStatusEnum = pgEnum("reminder_status", [
  "scheduled",
  "sent",
  "cancelled",
  "completed",
]);

export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
]);

// ---------------------------------------------------------------------------
// businesses (multi-business future scalability — V1 seeds a single row)
// ---------------------------------------------------------------------------

export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  currency: varchar("currency", { length: 8 }).notNull().default("INR"),
  timezone: varchar("timezone", { length: 64 }).notNull().default("Asia/Kolkata"),
  defaultReminderMinutesBefore: integer("default_reminder_minutes_before")
    .notNull()
    .default(15),
  defaultPaymentMethod: paymentMethodEnum("default_payment_method")
    .notNull()
    .default("cash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: userRoleEnum("role").notNull().default("owner"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)],
);

// ---------------------------------------------------------------------------
// routes
// ---------------------------------------------------------------------------

export const routes = pgTable(
  "routes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 255 }).notNull(),
    // 0 = Sunday .. 6 = Saturday
    dayOfWeek: integer("day_of_week").notNull(),
    routeOrder: integer("route_order").notNull().default(0),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("routes_business_idx").on(table.businessId),
    index("routes_day_of_week_idx").on(table.dayOfWeek),
  ],
);

// ---------------------------------------------------------------------------
// customers
// ---------------------------------------------------------------------------

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "restrict" }),
    customerCode: varchar("customer_code", { length: 32 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 32 }).notNull(),
    alternatePhone: varchar("alternate_phone", { length: 32 }),
    address: text("address"),
    area: varchar("area", { length: 255 }),
    routeId: uuid("route_id")
      .notNull()
      .references(() => routes.id, { onDelete: "restrict" }),
    routeSequence: integer("route_sequence").notNull().default(0),

    principalAmount: numeric("principal_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    interestAmount: numeric("interest_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    totalRepaymentAmount: numeric("total_repayment_amount", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),
    collectionAmount: numeric("collection_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    outstandingAmount: numeric("outstanding_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    cycleDays: integer("cycle_days").notNull().default(7),
    startDate: date("start_date").notNull(),

    isActive: boolean("is_active").notNull().default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("customers_business_code_idx").on(
      table.businessId,
      table.customerCode,
    ),
    index("customers_route_idx").on(table.routeId),
    index("customers_phone_idx").on(table.phone),
    index("customers_business_idx").on(table.businessId),
  ],
);

// ---------------------------------------------------------------------------
// collection_schedules — one row per expected collection event; never
// overwritten, only status-transitioned or superseded by a new row.
// ---------------------------------------------------------------------------

export const collectionSchedules = pgTable(
  "collection_schedules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    routeId: uuid("route_id")
      .notNull()
      .references(() => routes.id, { onDelete: "restrict" }),
    scheduledDate: date("scheduled_date").notNull(),
    expectedAmount: numeric("expected_amount", { precision: 12, scale: 2 }).notNull(),
    cycleNumber: integer("cycle_number").notNull().default(1),
    status: collectionStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("collection_schedules_customer_idx").on(table.customerId),
    index("collection_schedules_route_idx").on(table.routeId),
    index("collection_schedules_date_idx").on(table.scheduledDate),
    index("collection_schedules_status_idx").on(table.status),
  ],
);

// ---------------------------------------------------------------------------
// payments — created only when money is actually received
// ---------------------------------------------------------------------------

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    collectionScheduleId: uuid("collection_schedule_id")
      .notNull()
      .references(() => collectionSchedules.id, { onDelete: "restrict" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    paymentDate: date("payment_date").notNull(),
    paymentTime: time("payment_time").notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull().default("cash"),
    notes: text("notes"),
    // idempotency key so offline retry cannot create duplicate payments
    clientRequestId: varchar("client_request_id", { length: 64 }),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("payments_customer_idx").on(table.customerId),
    index("payments_schedule_idx").on(table.collectionScheduleId),
    uniqueIndex("payments_client_request_idx").on(table.clientRequestId),
  ],
);

// ---------------------------------------------------------------------------
// payment_promises — a promise is not a payment
// ---------------------------------------------------------------------------

export const paymentPromises = pgTable(
  "payment_promises",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    collectionScheduleId: uuid("collection_schedule_id")
      .notNull()
      .references(() => collectionSchedules.id, { onDelete: "restrict" }),
    promisedDate: date("promised_date").notNull(),
    promisedTime: time("promised_time"),
    promisedAmount: numeric("promised_amount", { precision: 12, scale: 2 }),
    reason: text("reason"),
    notes: text("notes"),
    status: promiseStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("payment_promises_customer_idx").on(table.customerId),
    index("payment_promises_schedule_idx").on(table.collectionScheduleId),
    index("payment_promises_status_idx").on(table.status),
  ],
);

// ---------------------------------------------------------------------------
// reminders — separate from the promise; tracks device notification state
// ---------------------------------------------------------------------------

export const reminders = pgTable(
  "reminders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    paymentPromiseId: uuid("payment_promise_id")
      .notNull()
      .references(() => paymentPromises.id, { onDelete: "cascade" }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    reminderType: reminderTypeEnum("reminder_type").notNull().default("15_min_before"),
    status: reminderStatusEnum("status").notNull().default("scheduled"),
    // stable numeric id used for Capacitor Local Notifications scheduling
    notificationId: serial("notification_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("reminders_customer_idx").on(table.customerId),
    index("reminders_promise_idx").on(table.paymentPromiseId),
    index("reminders_scheduled_at_idx").on(table.scheduledAt),
    uniqueIndex("reminders_notification_id_idx").on(table.notificationId),
  ],
);

// ---------------------------------------------------------------------------
// customer_notes
// ---------------------------------------------------------------------------

export const customerNotes = pgTable(
  "customer_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    note: text("note").notNull(),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("customer_notes_customer_idx").on(table.customerId)],
);

// ---------------------------------------------------------------------------
// audit_logs — minimum traceability for financial data changes
// ---------------------------------------------------------------------------

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "restrict" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    tableName: varchar("table_name", { length: 64 }).notNull(),
    recordId: uuid("record_id").notNull(),
    action: auditActionEnum("action").notNull(),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_logs_record_idx").on(table.tableName, table.recordId),
    index("audit_logs_business_idx").on(table.businessId),
  ],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const businessesRelations = relations(businesses, ({ many }) => ({
  users: many(users),
  routes: many(routes),
  customers: many(customers),
}));

export const usersRelations = relations(users, ({ one }) => ({
  business: one(businesses, {
    fields: [users.businessId],
    references: [businesses.id],
  }),
}));

export const routesRelations = relations(routes, ({ one, many }) => ({
  business: one(businesses, {
    fields: [routes.businessId],
    references: [businesses.id],
  }),
  customers: many(customers),
  collectionSchedules: many(collectionSchedules),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  business: one(businesses, {
    fields: [customers.businessId],
    references: [businesses.id],
  }),
  route: one(routes, {
    fields: [customers.routeId],
    references: [routes.id],
  }),
  collectionSchedules: many(collectionSchedules),
  payments: many(payments),
  paymentPromises: many(paymentPromises),
  reminders: many(reminders),
  notes: many(customerNotes),
}));

export const collectionSchedulesRelations = relations(
  collectionSchedules,
  ({ one, many }) => ({
    customer: one(customers, {
      fields: [collectionSchedules.customerId],
      references: [customers.id],
    }),
    route: one(routes, {
      fields: [collectionSchedules.routeId],
      references: [routes.id],
    }),
    payments: many(payments),
    paymentPromises: many(paymentPromises),
  }),
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  customer: one(customers, {
    fields: [payments.customerId],
    references: [customers.id],
  }),
  collectionSchedule: one(collectionSchedules, {
    fields: [payments.collectionScheduleId],
    references: [collectionSchedules.id],
  }),
  createdBy: one(users, {
    fields: [payments.createdByUserId],
    references: [users.id],
  }),
}));

export const paymentPromisesRelations = relations(
  paymentPromises,
  ({ one, many }) => ({
    customer: one(customers, {
      fields: [paymentPromises.customerId],
      references: [customers.id],
    }),
    collectionSchedule: one(collectionSchedules, {
      fields: [paymentPromises.collectionScheduleId],
      references: [collectionSchedules.id],
    }),
    reminders: many(reminders),
  }),
);

export const remindersRelations = relations(reminders, ({ one }) => ({
  customer: one(customers, {
    fields: [reminders.customerId],
    references: [customers.id],
  }),
  paymentPromise: one(paymentPromises, {
    fields: [reminders.paymentPromiseId],
    references: [paymentPromises.id],
  }),
}));

export const customerNotesRelations = relations(customerNotes, ({ one }) => ({
  customer: one(customers, {
    fields: [customerNotes.customerId],
    references: [customers.id],
  }),
  createdBy: one(users, {
    fields: [customerNotes.createdByUserId],
    references: [users.id],
  }),
}));
