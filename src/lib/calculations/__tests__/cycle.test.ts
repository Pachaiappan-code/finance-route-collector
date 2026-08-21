import { describe, expect, it } from "vitest";
import {
  calculateNextCollectionDate,
  dayOfWeekName,
  getDayOfWeek,
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
