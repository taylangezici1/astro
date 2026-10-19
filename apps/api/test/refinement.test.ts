import { describe, expect, it } from "vitest";
import type { District, HouseRule, PlanetaryChart } from "@synastry/api-types";
import { calcChart, calcHouses } from "@synastry/ephemeris";

import { scoreHouses } from "../src/matching/scoring";
import type { DistrictsService } from "../src/districts/districts.service";
import { TimezoneService } from "../src/timezone/timezone.service";
import {
  RefinementService,
  bestDistrict,
  type RefinementCandidate,
} from "../src/refinement/refinement.service";

const DISTRICTS: District[] = [
  { id: "edirne-merkez", name: "Merkez", province: "Edirne", latitude: 41.68, longitude: 26.56 },
  { id: "izmir-konak", name: "Konak", province: "İzmir", latitude: 38.42, longitude: 27.13 },
  { id: "ankara-cankaya", name: "Çankaya", province: "Ankara", latitude: 39.92, longitude: 32.85 },
  { id: "van-ipekyolu", name: "İpekyolu", province: "Van", latitude: 38.5, longitude: 43.38 },
  { id: "hakkari-merkez", name: "Merkez", province: "Hakkari", latitude: 37.58, longitude: 43.74 },
  // tz-lookup puts Hopa in Asia/Tbilisi; it must still report Türkiye's zone.
  { id: "artvin-hopa", name: "Hopa", province: "Artvin", latitude: 41.39, longitude: 41.42 },
];

const fakeDistricts = { all: () => DISTRICTS } as unknown as DistrictsService;

const USER_BIRTH = new Date("1994-10-12T14:15:00Z");
const USER_NATAL: PlanetaryChart = calcChart(USER_BIRTH);
const USER_LAT = 38.42;
const USER_LNG = 27.13; // İzmir

function candidate(iso: string, aspectFit: number): RefinementCandidate {
  const timestamp = new Date(iso);
  return { timestamp, natal: calcChart(timestamp), aspectFit, aspects: [] };
}

async function refine(candidates: RefinementCandidate[], rules: HouseRule[]) {
  return new RefinementService(fakeDistricts, new TimezoneService()).refine({
    selfNatal: USER_NATAL,
    selfBirthTimestamp: USER_BIRTH,
    selfLatitude: USER_LAT,
    selfLongitude: USER_LNG,
    candidates,
    rules,
  });
}

// Depends only on the user's houses, so every district scores the same.
const SELF_ONLY: HouseRule[] = [{ planetOf: "other", planet: "venus", houseOf: "self", house: 7 }];

// Depends on the partner's houses, so the district matters.
const PARTNER_HOUSES: HouseRule[] = [
  { planetOf: "self", planet: "sun", houseOf: "other", house: 7 },
  { planetOf: "other", planet: "moon", houseOf: "other", house: 1 },
];

describe("bestDistrict", () => {
  it("picks the district with the highest house fit", () => {
    const c = candidate("2001-03-04T09:30:00Z", 0.8);
    const selfHouses = calcHouses(USER_BIRTH, USER_LAT, USER_LNG);
    const best = bestDistrict(PARTNER_HOUSES, USER_NATAL, selfHouses, c, DISTRICTS);

    const fits = DISTRICTS.map(
      (d) =>
        scoreHouses({
          rules: PARTNER_HOUSES,
          selfNatal: USER_NATAL,
          otherNatal: c.natal,
          selfHouses,
          otherHouses: calcHouses(c.timestamp, d.latitude, d.longitude),
        }).houseFit,
    );
    expect(best?.score.houseFit).toBe(Math.max(...fits));
  });

  it("keeps the first district on a tie", () => {
    const c = candidate("2001-03-04T09:30:00Z", 0.8);
    const selfHouses = calcHouses(USER_BIRTH, USER_LAT, USER_LNG);
    const best = bestDistrict(SELF_ONLY, USER_NATAL, selfHouses, c, DISTRICTS);
    expect(best?.district.id).toBe(DISTRICTS[0].id);
  });
});

describe("RefinementService.refine", () => {
  it("returns one hit per candidate, best compatibility first", async () => {
    const result = await refine(
      [
        candidate("1990-01-01T00:00:00Z", 0.3),
        candidate("2000-06-15T12:00:00Z", 0.9),
        candidate("2010-11-20T06:45:00Z", 0.6),
      ],
      PARTNER_HOUSES,
    );

    expect(result.top).toHaveLength(3);
    expect(new Set(result.top.map((h) => h.timestamp)).size).toBe(3);
    const scores = result.top.map((h) => h.compatibility);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(result.best).toBe(result.top[0]);
  });

  it("breaks district ties by proximity to the user's birthplace", async () => {
    const result = await refine([candidate("2000-06-15T12:00:00Z", 0.9)], SELF_ONLY);
    expect(result.best?.district.id).toBe("izmir-konak");
    // Self-only rules don't need the district walk at all.
    expect(result.stats.districtsEvaluated).toBe(1);
  });

  it("walks every district when a rule uses the partner's houses", async () => {
    const result = await refine([candidate("2000-06-15T12:00:00Z", 0.9)], PARTNER_HOUSES);
    expect(result.stats.districtsEvaluated).toBe(DISTRICTS.length);
  });

  it("still returns a hit when no house rule is met", async () => {
    // Venus can't be in house 7 *and* house 1 at once; at most one is met.
    const impossible: HouseRule[] = [
      { planetOf: "other", planet: "venus", houseOf: "self", house: 7 },
      { planetOf: "other", planet: "venus", houseOf: "self", house: 1 },
    ];
    const result = await refine([candidate("2000-06-15T12:00:00Z", 0.9)], impossible);
    expect(result.best).not.toBeNull();
    expect(result.best!.houseFit).toBeLessThanOrEqual(0.5);
    expect(result.best!.compatibility).toBeGreaterThan(0);
  });

  it("reports the partner's local birth time in the district's timezone", async () => {
    // 2000-06-15 12:00 UTC is 15:00 in Türkiye (UTC+2, plus summer time).
    const result = await refine([candidate("2000-06-15T12:00:00Z", 0.9)], SELF_ONLY);
    expect(result.best?.timezone).toBe("Europe/Istanbul");
    expect(result.best?.localISO).toBe("2000-06-15T15:00:00");
  });

  it("uses Türkiye's timezone even where a coordinate lookup would not", async () => {
    const hopaOnly = { all: () => DISTRICTS.filter((d) => d.id === "artvin-hopa") };
    const service = new RefinementService(
      hopaOnly as unknown as DistrictsService,
      new TimezoneService(),
    );
    const result = await service.refine({
      selfNatal: USER_NATAL,
      selfBirthTimestamp: USER_BIRTH,
      selfLatitude: USER_LAT,
      selfLongitude: USER_LNG,
      candidates: [candidate("2020-06-15T12:00:00Z", 0.9)],
      rules: SELF_ONLY,
    });
    expect(result.best?.district.id).toBe("artvin-hopa");
    expect(result.best?.timezone).toBe("Europe/Istanbul");
    expect(result.best?.localISO).toBe("2020-06-15T15:00:00");
  });

  it("returns no hits when Phase 2 found no candidates", async () => {
    const result = await refine([], PARTNER_HOUSES);
    expect(result.best).toBeNull();
    expect(result.top).toEqual([]);
  });
});
