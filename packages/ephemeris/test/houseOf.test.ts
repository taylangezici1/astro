import { describe, expect, it } from "vitest";
import { houseOf, type HouseCusps } from "../src/index";

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
