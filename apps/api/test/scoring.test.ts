import { describe, expect, it } from "vitest";
import {
  ASPECT_WEIGHT,
  HOUSE_WEIGHT,
  type HouseRule,
  type PlanetaryChart,
} from "@synastry/api-types";
import type { HouseCusps } from "@synastry/ephemeris";

import {
  angularDistance,
  aspectCredit,
  compatibility,
  houseCredit,
  mean,
  scoreHouses,
} from "../src/matching/scoring";

// House 1 spans [0, 30), house 2 spans [30, 60), … house 12 spans [330, 360).
const EVEN_HOUSES_FROM_0: HouseCusps = [
  0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330,
];

// Same shape rotated by 15°: house 12 spans [345, 15) across 0°.
const EVEN_HOUSES_FROM_15: HouseCusps = [
  15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345,
];

// Every planet 5° into a different house of EVEN_HOUSES_FROM_0.
const NATAL_A: PlanetaryChart = {
  sun: 5, // house 1
  moon: 35, // house 2
  mercury: 65, // house 3
  venus: 95, // house 4
  mars: 125, // house 5
  jupiter: 155, // house 6
  saturn: 195, // house 7, exactly mid-house
};

const NATAL_B: PlanetaryChart = {
  sun: 195, // house 7
  moon: 5, // house 1
  mercury: 215, // house 8
  venus: 255, // house 9, exactly mid-house
  mars: 275, // house 10
  jupiter: 305, // house 11
  saturn: 335, // house 12
};

describe("angularDistance", () => {
  it("returns the short way round the circle", () => {
    expect(angularDistance(10, 350)).toBe(20);
    expect(angularDistance(350, 10)).toBe(20);
    expect(angularDistance(0, 180)).toBe(180);
    expect(angularDistance(90, 90)).toBe(0);
  });
});

describe("aspectCredit", () => {
  it("is 1 for an exact aspect and 0.5 at the edge of the orb", () => {
    expect(aspectCredit(0, 3)).toBe(1);
    expect(aspectCredit(3, 3)).toBe(0.5);
    expect(aspectCredit(1.5, 3)).toBe(0.75);
  });

  it("is 0 outside the orb", () => {
    expect(aspectCredit(3.01, 3)).toBe(0);
    expect(aspectCredit(90, 3)).toBe(0);
  });

  it("ranks four loose hits above one exact hit", () => {
    const fourLoose = mean([2.5, 2.5, 2.5, 2.5].map((d) => aspectCredit(d, 3)));
    const oneExact = mean([0, 90, 90, 90].map((d) => aspectCredit(d, 3)));
    expect(fourLoose).toBeGreaterThan(oneExact);
  });
});

describe("houseCredit", () => {
  it("is 0 when the planet is in another house", () => {
    expect(houseCredit(5, EVEN_HOUSES_FROM_0, 7)).toBe(0);
  });

  it("is 0.5 on the cusp and 1 mid-house", () => {
    expect(houseCredit(180, EVEN_HOUSES_FROM_0, 7)).toBe(0.5);
    expect(houseCredit(195, EVEN_HOUSES_FROM_0, 7)).toBe(1);
  });

  it("works for a house that wraps across 0°", () => {
    expect(houseCredit(0, EVEN_HOUSES_FROM_15, 12)).toBe(1);
  });
});

describe("compatibility", () => {
  it("blends the two fits with weights that sum to 1", () => {
    expect(ASPECT_WEIGHT + HOUSE_WEIGHT).toBeCloseTo(1, 10);
    expect(compatibility(1, 1)).toBeCloseTo(1, 10);
    expect(compatibility(1, 0)).toBeCloseTo(ASPECT_WEIGHT, 10);
  });
});

describe("scoreHouses", () => {
  const base = {
    selfNatal: NATAL_A,
    otherNatal: NATAL_B,
    selfHouses: EVEN_HOUSES_FROM_0,
    otherHouses: EVEN_HOUSES_FROM_0,
  };

  it("scores 0 when no rule is satisfied", () => {
    // User's Sun is at 5° → house 1, not house 7.
    const result = scoreHouses({
      ...base,
      rules: [{ planetOf: "self", planet: "sun", houseOf: "self", house: 7 }],
    });
    expect(result.houseFit).toBe(0);
    expect(result.satisfied).toEqual([]);
  });

  it("gives full credit to a mid-house placement", () => {
    // User's Saturn = 195 → middle of house 7.
    const result = scoreHouses({
      ...base,
      rules: [{ planetOf: "self", planet: "saturn", houseOf: "self", house: 7 }],
    });
    expect(result.houseFit).toBe(1);
    expect(result.satisfied).toHaveLength(1);
  });

  it("looks up the right party's planet and house system", () => {
    // Partner's Venus (255) sits mid-house 9 of the user's houses, and of
    // the partner's own houses only when those are the same cusps.
    const inSelf: HouseRule = { planetOf: "other", planet: "venus", houseOf: "self", house: 9 };
    const inOther: HouseRule = { planetOf: "other", planet: "venus", houseOf: "other", house: 9 };

    expect(scoreHouses({ ...base, rules: [inSelf, inOther] }).satisfied).toHaveLength(2);

    const rotated = scoreHouses({
      ...base,
      otherHouses: EVEN_HOUSES_FROM_15,
      rules: [inSelf, inOther],
    });
    // 255 is still house 9 of the rotated set ([255, 285)) but on its cusp.
    expect(rotated.satisfied).toHaveLength(2);
    expect(rotated.houseFit).toBe(mean([1, 0.5]));
  });

  it("averages credit over every rule, met or not", () => {
    const met: HouseRule = { planetOf: "self", planet: "saturn", houseOf: "self", house: 7 };
    const missed: HouseRule = { planetOf: "self", planet: "sun", houseOf: "self", house: 12 };
    const result = scoreHouses({ ...base, rules: [met, missed] });
    expect(result.satisfied).toEqual([met]);
    expect(result.houseFit).toBe(0.5);
  });
});
