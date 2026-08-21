CREATE SEQUENCE IF NOT EXISTS reminders_notification_id_seq OWNED BY "reminders"."notification_id";
--> statement-breakpoint
ALTER TABLE "reminders" ALTER COLUMN "notification_id" SET DEFAULT nextval('reminders_notification_id_seq');
--> statement-breakpoint
SELECT setval('reminders_notification_id_seq', COALESCE((SELECT MAX("notification_id") FROM "reminders"), 0) + 1, false);
