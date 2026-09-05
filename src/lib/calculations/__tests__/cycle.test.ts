import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  calculateNextCollectionDate,
  currentCycleMonth,
  dayOfWeekName,
  getDayOfWeek,
  resolveInitialCycleMonth,
  toCalendarDate,
} from "../cycle";

describe("calculateNextCollectionDate", () => {
  it("advances 7 days and lands on the same weekday", () => {
    const sunday = new Date("2026-08-23T12:00:00+05:30"); // a Sunday, IST
    const next = calculateNextCollectionDate(sunday, 7);
    expect(toCalendarDate(next)).toBe("2026-08-30");
    expect(getDayOfWeek(next)).toBe(0); // Sunday
  });

  it("advances 5 days and drifts to a different weekday", () => {
    const sunday = new Date("2026-08-23T12:00:00+05:30");
    const next = calculateNextCollectionDate(sunday, 5);
    expect(toCalendarDate(next)).toBe("2026-08-28"); // Friday
    expect(getDayOfWeek(next)).toBe(5);
  });

  it("advances 10 days across a month boundary", () => {
    const date = new Date("2026-08-23T12:00:00+05:30");
    const next = calculateNextCollectionDate(date, 10);
    expect(toCalendarDate(next)).toBe("2026-09-02");
  });

  it("supports an arbitrary custom cycle length", () => {
    const date = new Date("2026-08-23T12:00:00+05:30");
    const next = calculateNextCollectionDate(date, 13);
    expect(toCalendarDate(next)).toBe("2026-09-05");
  });

  it("rejects non-positive cycle lengths", () => {
    const date = new Date("2026-08-23T12:00:00+05:30");
    expect(() => calculateNextCollectionDate(date, 0)).toThrow();
    expect(() => calculateNextCollectionDate(date, -3)).toThrow();
  });
});

describe("getDayOfWeek / dayOfWeekName", () => {
  it("maps known dates to the correct weekday index and name", () => {
    const sunday = new Date("2026-08-23T12:00:00+05:30");
    const monday = new Date("2026-08-24T12:00:00+05:30");
    const saturday = new Date("2026-08-29T12:00:00+05:30");

    expect(getDayOfWeek(sunday)).toBe(0);
    expect(getDayOfWeek(monday)).toBe(1);
    expect(getDayOfWeek(saturday)).toBe(6);

    expect(dayOfWeekName(0)).toBe("Sunday");
    expect(dayOfWeekName(1)).toBe("Monday");
    expect(dayOfWeekName(6)).toBe("Saturday");
  });

  it("rejects out-of-range day indices", () => {
    expect(() => dayOfWeekName(7)).toThrow();
    expect(() => dayOfWeekName(-1)).toThrow();
  });
});

describe("monthly collection cycle helpers", () => {
  beforeEach(() => {
    // 5 September 2026, 10:00 IST
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-05T04:30:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("currentCycleMonth returns the first of the current calendar month", () => {
    expect(currentCycleMonth()).toBe("2026-09-01");
  });

  it("resolveInitialCycleMonth uses the current month when the loan starts today or in the past", () => {
    expect(resolveInitialCycleMonth("2026-09-05")).toBe("2026-09-01");
    expect(resolveInitialCycleMonth("2026-08-15")).toBe("2026-09-01");
  });

  it("resolveInitialCycleMonth uses the loan's start month when it is in the future", () => {
    expect(resolveInitialCycleMonth("2026-10-01")).toBe("2026-10-01");
    expect(resolveInitialCycleMonth("2027-01-20")).toBe("2027-01-01");
  });
});
