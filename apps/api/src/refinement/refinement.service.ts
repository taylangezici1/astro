/**
 * Phase 3 — Local Refinement (workflow.md §4 Phase 3).
 *
 * For every Phase 2 candidate timestamp, walk Türkiye's districts, compute
 * the partner's Placidus houses for each (timestamp, district) pair, and
 * score how many of the supplied house rules are satisfied. Return the top
 * (timestamp, district) result as the "Soulmate Profile".
 *
 * Compute budget: candidates × districts house calls + per-rule scoring.
 * With the demo dataset (~40 districts) and a Phase 2 cap of 100 candidates
 * that's ~4 000 sweph.houses_ex2 calls, well under a second.
 */

import { Injectable, Logger } from "@nestjs/common";
import {
  calcHouses,
  houseOf,
  type HouseCusps,
} from "@synastry/ephemeris";
import type {
  District,
  HouseRule,
  PlanetaryChart,
  PlanetKey,
  RefinementHit,
  RefinementResult,
} from "@synastry/api-types";

import { DistrictsService } from "../districts/districts.service";
import { DEFAULT_HOUSE_RULES } from "./house-rules";

// Re-export so existing imports from this module keep compiling.
export type { District, RefinementHit, RefinementResult };

export interface RefinementInput {
  /** User's natal chart (already computed in Phase 2). */
  selfNatal: PlanetaryChart;
  /** User's birth instant — needed to compute the user's own house cusps. */
  selfBirthTimestamp: Date;
  /** User's birth location (for the user's own houses). */
  selfLatitude: number;
  selfLongitude: number;
  /** Candidate timestamps + their natal charts from Phase 2. */
  candidates: readonly RefinementCandidate[];
  /** Optional rule override. */
  rules?: readonly HouseRule[];
}

/**
 * Internal candidate shape used by the matching service. We accept Date here
 * because Phase 2 hands us GlobalSky rows that have native Date timestamps;
 * the wire-format conversion to ISO string happens just before we build the
 * RefinementHit on the way out.
 */
export interface RefinementCandidate {
  timestamp: Date;
  natal: PlanetaryChart;
}

const TOP_N = 10;

@Injectable()
export class RefinementService {
  private readonly logger = new Logger(RefinementService.name);

  constructor(private readonly districtsService: DistrictsService) {}

  refine(input: RefinementInput): RefinementResult {
    const rules = input.rules ?? DEFAULT_HOUSE_RULES;
    const districts = this.districtsService.all();
    const t0 = Date.now();

    // Self houses are fixed per request — compute once.
    // selfNatal is recomputable but we already have it from Phase 2.
    const selfHouses = calcHouses(
      // We don't have the user's birth instant in this scope as a Date — it
      // was used to derive selfNatal already, but we need it again here for
      // their own house cusps. Caller passes it via the candidate-shaped
      // wrapper below; see MatchingService for the call site.
      input.selfBirthTimestamp,
      input.selfLatitude,
      input.selfLongitude,
    );

    const hits: RefinementHit[] = [];

    for (const candidate of input.candidates) {
      for (const district of districts) {
        const otherHouses = calcHouses(
          candidate.timestamp,
          district.latitude,
          district.longitude,
        );

        const { score, satisfied } = scorePair({
          rules,
          selfNatal: input.selfNatal,
          otherNatal: candidate.natal,
          selfHouses,
          otherHouses,
        });

        if (score > 0) {
          hits.push({
            // Convert Date → ISO string at the boundary so the wire-format
            // RefinementHit (defined in @synastry/api-types) is what we emit.
            timestamp: candidate.timestamp.toISOString(),
            natal: candidate.natal,
            district,
            score,
            // Emit structured rules; clients format the user-facing text in
            // their own language.
            satisfiedRules: satisfied,
          });
        }
      }
    }

    hits.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.district.name.localeCompare(b.district.name);
    });

    const top = hits.slice(0, TOP_N);
    const best = top[0] ?? null;
    const elapsedMs = Date.now() - t0;

    this.logger.debug(
      `Phase 3: ${input.candidates.length} candidates × ${districts.length} districts = ` +
        `${input.candidates.length * districts.length} pairs in ${elapsedMs}ms ` +
        `→ ${hits.length} hits`,
    );

    return {
      // The wire type is HouseRule[] (mutable); copy out of the readonly input.
      rules: [...rules],
      best,
      top,
      stats: {
        candidatesEvaluated: input.candidates.length,
        districtsEvaluated: districts.length,
        pairsEvaluated: input.candidates.length * districts.length,
        elapsedMs,
      },
    };
  }
}

// ---------- pair scoring ----------

/** Inputs for `scorePair`. Exported so unit tests can call it directly. */
export interface ScoreInput {
  rules: readonly HouseRule[];
  selfNatal: PlanetaryChart;
  otherNatal: PlanetaryChart;
  selfHouses: HouseCusps;
  otherHouses: HouseCusps;
}

/** Pure scoring function — exported for testing. */
export function scorePair(
  input: ScoreInput,
): { score: number; satisfied: HouseRule[] } {
  const satisfied: HouseRule[] = [];
  for (const rule of input.rules) {
    const planet = pickPlanet(rule.planetOf, rule.planet, input);
    const cusps = pickHouses(rule.houseOf, input);
    if (houseOf(planet, cusps) === rule.house) {
      satisfied.push(rule);
    }
  }
  return { score: satisfied.length, satisfied };
}

function pickPlanet(party: "self" | "other", planet: PlanetKey, input: ScoreInput): number {
  return party === "self" ? input.selfNatal[planet] : input.otherNatal[planet];
}

function pickHouses(party: "self" | "other", input: ScoreInput): HouseCusps {
  return party === "self" ? input.selfHouses : input.otherHouses;
}

