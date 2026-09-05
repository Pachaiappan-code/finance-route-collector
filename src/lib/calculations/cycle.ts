import { addDays } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

export const BUSINESS_TIMEZONE = "Asia/Kolkata";

/**
 * Computes the next collection date given the current scheduled date and the
 * customer's cycle length in days. Cycles are calculated using real calendar
 * dates (not weekday arithmetic), so a 7-day cycle from any date lands on the
 * same weekday, a 5-day cycle drifts across weekdays, etc.
 */
export function calculateNextCollectionDate(
  currentDate: Date,
  cycleDays: number,
): Date {
  if (!Number.isFinite(cycleDays) || cycleDays <= 0) {
    throw new Error(`cycleDays must be a positive integer, received ${cycleDays}`);
  }
  const zoned = toZonedTime(currentDate, BUSINESS_TIMEZONE);
  return addDays(zoned, cycleDays);
}

/** Formats a Date as a YYYY-MM-DD calendar date string in business timezone. */
export function toCalendarDate(date: Date): string {
  return formatInTimeZone(date, BUSINESS_TIMEZONE, "yyyy-MM-dd");
}

/** 0 = Sunday .. 6 = Saturday, evaluated in business timezone. */
export function getDayOfWeek(date: Date): number {
  const dayName = formatInTimeZone(date, BUSINESS_TIMEZONE, "i");
  // date-fns "i" (ISO day) is 1=Monday..7=Sunday; convert to 0=Sunday..6=Saturday
  const iso = Number(dayName);
  return iso === 7 ? 0 : iso;
}

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function dayOfWeekName(dayOfWeek: number): string {
  if (dayOfWeek < 0 || dayOfWeek > 6) {
    throw new Error(`dayOfWeek must be 0-6, received ${dayOfWeek}`);
  }
  return DAY_NAMES[dayOfWeek];
}

/** The current calendar month as a "YYYY-MM-01" date string, in business timezone. */
export function currentCycleMonth(): string {
  return `${toCalendarDate(new Date()).slice(0, 7)}-01`;
}

/**
 * Which monthly collection_cycles row a new (or re-)loan's first cycle
 * belongs to: the current month, unless the loan's start date is in a
 * future month, in which case collection begins that month instead.
 * Plain string comparison — no Date/timezone arithmetic, no shift risk.
 */
export function resolveInitialCycleMonth(startDate: string): string {
  const startMonth = startDate.slice(0, 7);
  const todayMonth = toCalendarDate(new Date()).slice(0, 7);
  return `${startMonth > todayMonth ? startMonth : todayMonth}-01`;
}
