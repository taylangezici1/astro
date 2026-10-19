import { describe, expect, it } from "vitest";
import { houseOf, housePosition, type HouseCusps } from "../src/index";

const EVENLY_SPACED: HouseCusps = [
  0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330,
];

const ROTATED_15: HouseCusps = [
  15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345,
];

describe("houseOf", () => {
  it("places a longitude in the correct house for evenly-spaced cusps", () => {
    expect(houseOf(0, EVENLY_SPACED)).toBe(1);
    expect(houseOf(15, EVENLY_SPACED)).toBe(1);
    expect(houseOf(30, EVENLY_SPACED)).toBe(2);
    expect(houseOf(125, EVENLY_SPACED)).toBe(5);
    expect(houseOf(359.999, EVENLY_SPACED)).toBe(12);
  });

  it("includes the start cusp and excludes the next cusp", () => {
    // House 5 spans [120, 150).
    expect(houseOf(120, EVENLY_SPACED)).toBe(5);
    expect(houseOf(149.999, EVENLY_SPACED)).toBe(5);
    expect(houseOf(150, EVENLY_SPACED)).toBe(6);
  });

  it("handles wraparound when house 12 crosses 0°", () => {
    // ROTATED_15: house 12 starts at 345, wraps through 0, ends at 15.
    expect(houseOf(350, ROTATED_15)).toBe(12);
    expect(houseOf(355, ROTATED_15)).toBe(12);
    expect(houseOf(0, ROTATED_15)).toBe(12);
    expect(houseOf(10, ROTATED_15)).toBe(12);
    expect(houseOf(14.99, ROTATED_15)).toBe(12);
    expect(houseOf(15, ROTATED_15)).toBe(1);
  });

  it("normalises out-of-range longitudes into [0, 360)", () => {
    expect(houseOf(370, EVENLY_SPACED)).toBe(houseOf(10, EVENLY_SPACED));
    expect(houseOf(-5, EVENLY_SPACED)).toBe(houseOf(355, EVENLY_SPACED));
  });
});

describe("housePosition", () => {
  it("reports how far through the house a longitude sits", () => {
    expect(housePosition(120, EVENLY_SPACED)).toEqual({ house: 5, fraction: 0 });
    expect(housePosition(135, EVENLY_SPACED)).toEqual({ house: 5, fraction: 0.5 });
    expect(housePosition(147, EVENLY_SPACED).fraction).toBeCloseTo(0.9, 10);
  });

  it("measures the fraction across the 0° wraparound", () => {
    // ROTATED_15 house 12 spans [345, 15): 0° is halfway through it.
    expect(housePosition(0, ROTATED_15)).toEqual({ house: 12, fraction: 0.5 });
    expect(housePosition(350, ROTATED_15).fraction).toBeCloseTo(5 / 30, 10);
  });

  it("handles unequal house widths", () => {
    // Placidus houses are rarely 30° wide. House 1 here spans [10, 50).
    const uneven: HouseCusps = [10, 50, 70, 95, 130, 165, 190, 230, 250, 275, 310, 345];
    expect(housePosition(30, uneven)).toEqual({ house: 1, fraction: 0.5 });
    expect(housePosition(60, uneven)).toEqual({ house: 2, fraction: 0.5 });
  });
});
