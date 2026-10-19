import { describe, expect, it } from "vitest";
import { dateToJulianDayUT } from "../src/index";

describe("dateToJulianDayUT", () => {
  it("returns the canonical JD for the J2000.0 epoch", () => {
    // J2000.0 = 2000-01-01 12:00 UT → JD 2451545.0 (well-known reference).
    const jd = dateToJulianDayUT(new Date(Date.UTC(2000, 0, 1, 12, 0, 0)));
    expect(jd).toBeCloseTo(2451545.0, 6);
  });

  it("treats the input as UTC, not local time", () => {
    // Two dates representing the same instant should produce identical JDs.
    const a = new Date(Date.UTC(2024, 5, 15, 6, 0, 0));
    const b = new Date(a.toISOString());
    expect(dateToJulianDayUT(a)).toBe(dateToJulianDayUT(b));
  });

  it("advances JD by 1 per civil day", () => {
    const day1 = dateToJulianDayUT(new Date(Date.UTC(2024, 0, 1, 0, 0, 0)));
    const day2 = dateToJulianDayUT(new Date(Date.UTC(2024, 0, 2, 0, 0, 0)));
    expect(day2 - day1).toBeCloseTo(1, 9);
  });

  it("advances JD by 1/24 per hour", () => {
    const t0 = dateToJulianDayUT(new Date(Date.UTC(2024, 5, 15, 0, 0, 0)));
    const t1 = dateToJulianDayUT(new Date(Date.UTC(2024, 5, 15, 1, 0, 0)));
    expect(t1 - t0).toBeCloseTo(1 / 24, 9);
  });
});
