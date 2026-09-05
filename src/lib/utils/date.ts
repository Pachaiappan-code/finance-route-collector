import { formatInTimeZone } from "date-fns-tz";
import { BUSINESS_TIMEZONE } from "@/lib/calculations/cycle";

/** Formats a date (Date, or a `date`-column string like "2026-08-05") as DD/MM/YYYY for display. */
export function formatDisplayDate(value: string | Date | null | undefined): string {
  if (!value) return "—";

  if (typeof value === "string") {
    // Plain "YYYY-MM-DD" from a Postgres date column — format directly,
    // no Date object involved, so there is no timezone-shift risk at all.
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      return `${d}/${m}/${y}`;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return formatInTimeZone(parsed, BUSINESS_TIMEZONE, "dd/MM/yyyy");
  }

  return formatInTimeZone(value, BUSINESS_TIMEZONE, "dd/MM/yyyy");
}

/** Formats a date + display time together, e.g. "05/09/2026 5:00 PM". */
export function formatDisplayDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  return formatInTimeZone(date, BUSINESS_TIMEZONE, "dd/MM/yyyy h:mm a");
}

/** Formats a "HH:mm:ss" or "HH:mm" time-column string as "5:00 PM". */
export function formatDisplayTime(value: string | null | undefined): string {
  if (!value) return "—";
  const [h, m] = value.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

/** Formats a Date as YYYY-MM-01 (first of month), matching a `date` column. */
export function firstOfMonth(date: Date): string {
  return formatInTimeZone(date, BUSINESS_TIMEZONE, "yyyy-MM-01");
}

/** Formats a Date as "September 2026" for section headings. */
export function formatMonthLabel(value: string | Date): string {
  const date = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;
  return formatInTimeZone(date, BUSINESS_TIMEZONE, "MMMM yyyy");
}
