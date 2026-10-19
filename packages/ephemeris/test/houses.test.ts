import { describe, expect, it } from "vitest";
import { houses_ex2, julday, constants } from "sweph";

import { calcHouses } from "../src/index";

describe("calcHouses", () => {
  const birth = new Date("1994-10-12T14:15:00Z");

  it("returns 12 Placidus cusps for a normal latitude", () => {
    const cusps = calcHouses(birth, 38.42, 27.13);
    expect(cusps).toHaveLength(12);
    for (const c of cusps) expect(c).toBeGreaterThanOrEqual(0);
  });

  it("falls back to Porphyry inside the polar circles instead of throwing", () => {
    const jd = julday(1994, 10, 12, 14.25, constants.SE_GREG_CAL);
    const porphyry = houses_ex2(jd, 0, 69.65, 18.96, "O").data.houses; // Tromsø
    expect(calcHouses(birth, 69.65, 18.96)).toEqual(porphyry);
    expect(() => calcHouses(birth, -70, 0)).not.toThrow();
  });
});
