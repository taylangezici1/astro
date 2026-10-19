import { describe, expect, it } from "vitest";
import type { PlanetaryChart } from "@synastry/api-types";

import {
  ASPECTS,
  buildSkyWhereClause,
  computeGoldenDegrees,
  computeTargets,
} from "../src/matching/golden-degree";

const NATAL: PlanetaryChart = {
  sun: 199,
  moon: 298,
  mercury: 215,
  venus: 228,
  mars: 124,
  jupiter: 227,
  saturn: 336,
};

describe("computeTargets", () => {
  it("returns a single target for a conjunction", () => {
    const targets = computeTargets(
      { self: "venus", aspect: "conjunction", other: "mars" },
      NATAL,
    );
    expect(targets).toEqual([NATAL.venus]);
  });

  it("returns a single (collapsed) target for an opposition", () => {
    // +180 ≡ −180 (mod 360), so we expect exactly one wrapped degree.
    const targets = computeTargets(
      { self: "sun", aspect: "opposition", other: "moon" },
      NATAL,
    );
    expect(targets).toHaveLength(1);
    expect(targets[0]).toBeCloseTo((NATAL.sun + 180) % 360, 10);
  });

  it("returns two targets for a trine (±120°)", () => {
    const targets = computeTargets(
      { self: "venus", aspect: "trine", other: "mars" },
      NATAL,
    );
    expect(targets).toHaveLength(2);
    // Venus 228 → 348 and 108
    expect(targets).toContainEqual(348);
    expect(targets).toContainEqual(108);
  });

  it("wraps negative results back into [0, 360)", () => {
    // Mars 124 minus a sextile (60) = 64 (positive); plus 60 = 184. Use mars
    // with a square at 90° to force a near-zero crossing instead.
    const small: PlanetaryChart = { ...NATAL, mars: 30 };
    const targets = computeTargets(
      { self: "mars", aspect: "trine", other: "venus" },
      small,
    );
    // 30 - 120 = -90 → 270; 30 + 120 = 150
    expect(targets).toContainEqual(270);
    expect(targets).toContainEqual(150);
  });

  it("wraps results above 360 back into [0, 360)", () => {
    const big: PlanetaryChart = { ...NATAL, sun: 350 };
    const targets = computeTargets(
      { self: "sun", aspect: "trine", other: "moon" },
      big,
    );
    // 350 + 120 = 470 → 110; 350 - 120 = 230
    expect(targets).toContainEqual(110);
    expect(targets).toContainEqual(230);
  });
});

describe("ASPECTS table", () => {
  it("contains every aspect name with the right offset", () => {
    expect(ASPECTS.conjunction).toBe(0);
    expect(ASPECTS.sextile).toBe(60);
    expect(ASPECTS.square).toBe(90);
    expect(ASPECTS.trine).toBe(120);
    expect(ASPECTS.opposition).toBe(180);
  });
});

describe("buildSkyWhereClause", () => {
  const ORB = 3;

  it("emits a single AND-of-OR clause for one rule", () => {
    const bands = computeGoldenDegrees(
      [{ self: "venus", aspect: "conjunction", other: "mars" }],
      NATAL,
    );
    const where = buildSkyWhereClause(bands, ORB);
    expect(where.AND).toHaveLength(1);
    const inner = (where.AND as Array<{ OR: unknown[] }>)[0].OR;
    // Conjunction → 1 target, no wraparound at venus=228 → 1 condition.
    expect(inner).toHaveLength(1);
  });

  it("emits two ranges when a target sits near 0° (wraparound below)", () => {
    const small: PlanetaryChart = { ...NATAL, venus: 2 };
    const bands = computeGoldenDegrees(
      [{ self: "venus", aspect: "conjunction", other: "mars" }],
      small,
    );
    const where = buildSkyWhereClause(bands, ORB);
    const inner = (where.AND as Array<{ OR: unknown[] }>)[0].OR;
    // 2 ± 3 = [-1, 5] → wraps to [359, 360] ∪ [0, 5] → 2 conditions.
    expect(inner).toHaveLength(2);
  });

  it("emits two ranges when a target sits near 360° (wraparound above)", () => {
    const big: PlanetaryChart = { ...NATAL, venus: 358 };
    const bands = computeGoldenDegrees(
      [{ self: "venus", aspect: "conjunction", other: "mars" }],
      big,
    );
    const where = buildSkyWhereClause(bands, ORB);
    const inner = (where.AND as Array<{ OR: unknown[] }>)[0].OR;
    // 358 ± 3 = [355, 361] → [355, 360] ∪ [0, 1] → 2 conditions.
    expect(inner).toHaveLength(2);
  });

  it("ANDs multiple rules together", () => {
    const bands = computeGoldenDegrees(
      [
        { self: "venus", aspect: "trine", other: "mars" },
        { self: "sun", aspect: "trine", other: "moon" },
      ],
      NATAL,
    );
    const where = buildSkyWhereClause(bands, ORB);
    expect(where.AND).toHaveLength(2);
    // Each trine = 2 targets, no wraparound for mid-range natal → 2 conditions each.
    const arr = where.AND as Array<{ OR: unknown[] }>;
    expect(arr[0].OR.length).toBeGreaterThanOrEqual(2);
    expect(arr[1].OR.length).toBeGreaterThanOrEqual(2);
  });

  it("targets the correct partner-planet column", () => {
    const bands = computeGoldenDegrees(
      [{ self: "venus", aspect: "trine", other: "mars" }],
      NATAL,
    );
    const where = buildSkyWhereClause(bands, ORB);
    const inner = (where.AND as Array<{ OR: Record<string, unknown>[] }>)[0].OR;
    // Every emitted condition should key on `mars` (the partner planet).
    for (const cond of inner) {
      expect(Object.keys(cond)).toEqual(["mars"]);
    }
  });
});
