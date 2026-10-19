import { describe, expect, it } from "vitest";
import type { PlanetaryChart } from "@synastry/api-types";

import {
  ASPECTS,
  bandDistance,
  buildSkySearchSql,
  computeGoldenDegrees,
  computeTargets,
  rangeConditions,
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

describe("rangeConditions", () => {
  const ORB = 3;

  it("emits one range for a target away from 0°", () => {
    expect(rangeConditions("mars", [228], ORB)).toHaveLength(1);
  });

  it("emits two ranges when a target sits near 0° (wraparound below)", () => {
    // 2 ± 3 = [-1, 5] → [359, 360] ∪ [0, 5]
    const [high, low] = rangeConditions("mars", [2], ORB);
    expect(high.values).toEqual([359]);
    expect(low.values).toEqual([5]);
  });

  it("emits two ranges when a target sits near 360° (wraparound above)", () => {
    // 358 ± 3 = [355, 361] → [355, 360] ∪ [0, 1]
    const [high, low] = rangeConditions("mars", [358], ORB);
    expect(high.values).toEqual([355]);
    expect(low.values).toEqual([1]);
  });

  it("keys every condition on the partner-planet column", () => {
    for (const cond of rangeConditions("venus", [100, 200], ORB)) {
      expect(cond.sql).toContain('"venus"');
    }
  });

  it("refuses columns that are not planets", () => {
    expect(() =>
      rangeConditions('sun"; DROP TABLE "User' as never, [10], ORB),
    ).toThrow(/Unknown planet column/);
  });
});

describe("bandDistance", () => {
  it("measures to the nearest target, across 0°", () => {
    const band = { rule: { self: "sun", aspect: "trine", other: "moon" } as const, targets: [1, 241] };
    expect(bandDistance(band, { ...NATAL, moon: 359 })).toBeCloseTo(2, 10);
    expect(bandDistance(band, { ...NATAL, moon: 236 })).toBeCloseTo(5, 10);
  });
});

describe("buildSkySearchSql", () => {
  const bands = computeGoldenDegrees(
    [
      { self: "venus", aspect: "trine", other: "mars" },
      { self: "sun", aspect: "trine", other: "moon" },
    ],
    NATAL,
  );

  it("keeps rows meeting any rule, scores them, and keeps one per day", () => {
    const query = buildSkySearchSql(bands, 3, 50);
    expect(query.sql).toMatch(/WHERE[\s\S]+ OR /);
    expect(query.sql).toContain("DISTINCT ON (date_trunc('day', \"timestamp\"))");
    expect(query.sql).toContain('"mars"');
    expect(query.sql).toContain('"moon"');
    expect(query.values.at(-1)).toBe(50);
  });

  it("passes every number as a bound parameter", () => {
    const query = buildSkySearchSql(bands, 3, 50);
    expect(query.sql).not.toMatch(/\d{3}\.\d/);
    expect(query.values).toContain(3);
  });

  it("requires at least one rule", () => {
    expect(() => buildSkySearchSql([], 3, 50)).toThrow();
  });
});
