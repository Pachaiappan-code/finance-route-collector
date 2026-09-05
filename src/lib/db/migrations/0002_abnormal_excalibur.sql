CREATE TYPE "public"."cycle_status" AS ENUM('unpaid', 'partial', 'paid');--> statement-breakpoint
CREATE TYPE "public"."loan_status" AS ENUM('active', 'completed');--> statement-breakpoint
ALTER TYPE "public"."payment_method" ADD VALUE 'gpay';--> statement-breakpoint
CREATE TABLE "collection_cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loan_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"route_id" uuid NOT NULL,
	"cycle_month" date NOT NULL,
	"expected_amount" numeric(12, 2) NOT NULL,
	"paid_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"status" "cycle_status" DEFAULT 'unpaid' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"principal_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"interest_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_payable_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"monthly_amount" numeric(12, 2) NOT NULL,
	"start_date" date NOT NULL,
	"status" "loan_status" DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_promises" ALTER COLUMN "collection_schedule_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "collection_schedule_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_promises" ADD COLUMN "collection_cycle_id" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "collection_cycle_id" uuid;--> statement-breakpoint
ALTER TABLE "collection_cycles" ADD CONSTRAINT "collection_cycles_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_cycles" ADD CONSTRAINT "collection_cycles_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_cycles" ADD CONSTRAINT "collection_cycles_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "collection_cycles_loan_month_idx" ON "collection_cycles" USING btree ("loan_id","cycle_month");--> statement-breakpoint
CREATE INDEX "collection_cycles_customer_idx" ON "collection_cycles" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "collection_cycles_route_idx" ON "collection_cycles" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX "collection_cycles_month_idx" ON "collection_cycles" USING btree ("cycle_month");--> statement-breakpoint
CREATE INDEX "collection_cycles_status_idx" ON "collection_cycles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "loans_customer_idx" ON "loans" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "loans_status_idx" ON "loans" USING btree ("status");--> statement-breakpoint
ALTER TABLE "payment_promises" ADD CONSTRAINT "payment_promises_collection_cycle_id_collection_cycles_id_fk" FOREIGN KEY ("collection_cycle_id") REFERENCES "public"."collection_cycles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_collection_cycle_id_collection_cycles_id_fk" FOREIGN KEY ("collection_cycle_id") REFERENCES "public"."collection_cycles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_promises_cycle_idx" ON "payment_promises" USING btree ("collection_cycle_id");--> statement-breakpoint
CREATE INDEX "payments_cycle_idx" ON "payments" USING btree ("collection_cycle_id");