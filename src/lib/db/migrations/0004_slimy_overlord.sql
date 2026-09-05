ALTER TABLE "loans" ADD COLUMN "number_of_months" integer;--> statement-breakpoint
UPDATE "loans"
SET "number_of_months" = GREATEST(ROUND("total_payable_amount" / NULLIF("monthly_amount", 0))::int, 1)
WHERE "number_of_months" IS NULL AND "monthly_amount" > 0;