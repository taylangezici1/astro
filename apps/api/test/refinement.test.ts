import { describe, expect, it } from "vitest";
import type {
  HouseRule,
  PlanetaryChart,
} from "@synastry/api-types";
import type { HouseCusps } from "@synastry/ephemeris";

import { scorePair } from "../src/refinement/refinement.service";

// Hand-built fixtures: 12 evenly-spaced house cusps every 30° starting at 0°.
// House 1 spans [0, 30), house 2 spans [30, 60), … house 12 spans [330, 360).
const EVEN_HOUSES_FROM_0: HouseCusps = [
  0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330,
];

// Same shape but rotated by 15° so we exercise non-zero ascendants too.
const EVEN_HOUSES_FROM_15: HouseCusps = [
  15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345,
];

// Convenience natal charts where every planet sits on a different cusp so
// we can predict which house each falls into deterministically.
const NATAL_A: PlanetaryChart = {
  sun: 5, // house 1
  moon: 35, // house 2
  mercury: 65, // house 3
  venus: 95, // house 4
  mars: 125, // house 5
  jupiter: 155, // house 6
  saturn: 185, // house 7
};

const NATAL_B: PlanetaryChart = {
  sun: 195, // house 7
  moon: 5, // house 1
  mercury: 215, // house 8
  venus: 245, // house 9
  mars: 275, // house 10
  jupiter: 305, // house 11
  saturn: 335, // house 12
};

describe("scorePair", () => {
  it("returns score 0 when no rules are satisfied", () => {
    const rules: HouseRule[] = [
      // user's sun is at 5° → house 1 of self, not house 7.
      { planetOf: "self", planet: "sun", houseOf: "self", house: 7 },
    ];
    const result = scorePair({
      rules,
      selfNatal: NATAL_A,
      otherNatal: NATAL_B,
      selfHouses: EVEN_HOUSES_FROM_0,
      otherHouses: EVEN_HOUSES_FROM_0,
    });
    expect(result.score).toBe(0);
    expect(result.satisfied).toEqual([]);
  });

  it("scores 1 when one rule is satisfied", () => {
    const rules: HouseRule[] = [
      // self.saturn = 185 → falls in self's house 7 ([180, 210)).
      { planetOf: "self", planet: "saturn", houseOf: "self", house: 7 },
    ];
    const result = scorePair({
      rules,
      selfNatal: NATAL_A,
      otherNatal: NATAL_B,
      selfHouses: EVEN_HOUSES_FROM_0,
      otherHouses: EVEN_HOUSES_FROM_0,
    });
    expect(result.score).toBe(1);
    expect(result.satisfied).toHaveLength(1);
  });

  it("looks up the right party's planet and house system", () => {
    // Rule: partner's Venus (245) in self's 9th house ([240, 270)). True.
    const ruleTrue: HouseRule = {
      planetOf: "other",
      planet: "venus",
      houseOf: "self",
      house: 9,
    };
    // Same Venus longitude in the *other's* house system would land in
    // partner's 9th too, since both house systems are identical here.
    const ruleAlsoTrue: HouseRule = {
      planetOf: "other",
      planet: "venus",
      houseOf: "other",
      house: 9,
    };
    const result = scorePair({
      rules: [ruleTrue, ruleAlsoTrue],
      selfNatal: NATAL_A,
      otherNatal: NATAL_B,
      selfHouses: EVEN_HOUSES_FROM_0,
      otherHouses: EVEN_HOUSES_FROM_0,
    });
    expect(result.score).toBe(2);
  });

  it("uses the rotated cusp set when houses are different", () => {
    // self.sun = 5° with EVEN_HOUSES_FROM_15:
    //   house 12 spans [345, 360) ∪ [0, 15), so 5° → house 12.
    const result = scorePair({
      rules: [{ planetOf: "self", planet: "sun", houseOf: "self", house: 12 }],
      selfNatal: NATAL_A,
      otherNatal: NATAL_B,
      selfHouses: EVEN_HOUSES_FROM_15,
      otherHouses: EVEN_HOUSES_FROM_0,
    });
    expect(result.score).toBe(1);
  });

  it("returns the actual matched rule references in `satisfied`", () => {
    const matchingRule: HouseRule = {
      planetOf: "self",
      planet: "saturn",
      houseOf: "self",
      house: 7,
    };
    const failingRule: HouseRule = {
      planetOf: "self",
      planet: "sun",
      houseOf: "self",
      house: 12,
    };
    const result = scorePair({
      rules: [matchingRule, failingRule],
      selfNatal: NATAL_A,
      otherNatal: NATAL_B,
      selfHouses: EVEN_HOUSES_FROM_0,
      otherHouses: EVEN_HOUSES_FROM_0,
    });
    expect(result.satisfied).toEqual([matchingRule]);
  });
});
