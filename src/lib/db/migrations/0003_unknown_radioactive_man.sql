ALTER TABLE "loans" ADD COLUMN "final_outstanding_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "customer_rating" integer;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "closed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_customer_rating_range" CHECK ("loans"."customer_rating" between 1 and 5);