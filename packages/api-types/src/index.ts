/**
 * @synastry/api-types — wire-format types shared between the NestJS API and
 * any client (currently the Expo mobile app).
 *
 * Rules of the road for this file:
 *   1. Zero dependencies. Types, plus small constant tables that both sides
 *      must agree on (the default rule sets) — nothing that pulls in Node or
 *      React Native APIs, so the mobile bundle can import it safely.
 *   2. Timestamps over the wire are ISO-8601 strings, never Date objects.
 *      Servers serialize Date → string at the boundary.
 *   3. If a type lives here, both sides must use it. No drift.
 */

// ---------- domain primitives ----------

/** The seven visible planets used everywhere in the matching engine. */
export type PlanetKey =
  | "sun"
  | "moon"
  | "mercury"
  | "venus"
  | "mars"
  | "jupiter"
  | "saturn";

/** Ecliptic longitude (0–360°) for each planet. */
export type PlanetaryChart = Record<PlanetKey, number>;

/** Harmonious + hard aspects we currently support in Phase 2. */
export type AspectName =
  | "conjunction"
  | "sextile"
  | "square"
  | "trine"
  | "opposition";

/** A house number 1..12 (Placidus). */
export type HouseNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

// ---------- Phase 2 (Golden Degree filter) ----------

/** A single aspect rule: my <self> planet vs their <other> planet, by <aspect>. */
export interface SynastryRule {
  self: PlanetKey;
  aspect: AspectName;
  other: PlanetKey;
}

/** A rule resolved against a natal chart — the partner-planet target longitudes. */
export interface GoldenDegreeBand {
  rule: SynastryRule;
  /** Centre longitudes (0–360) the partner's planet should sit on. */
  targets: number[];
}

/** How closely one synastry rule is met by a candidate chart. */
export interface AspectHit {
  rule: SynastryRule;
  /** Degrees away from the exact aspect (0 = exact). */
  distance: number;
  /** True when `distance` is within the requested orb. */
  inOrb: boolean;
}

/**
 * A Phase 2 candidate: the best-scoring 15-minute tick of one UTC day.
 *
 * `aspectFit` is 0..1. Each rule earns 0 outside the orb, and between 0.5
 * (at the edge of the orb) and 1 (exact) inside it; the fit is the average.
 */
export interface SkyMatch extends PlanetaryChart {
  id: number;
  /** ISO-8601 UTC timestamp string. */
  timestamp: string;
  aspectFit: number;
  /** How many of the rules fall within the orb. */
  aspectsInOrb: number;
}

// ---------- Phase 3 (Local Refinement) ----------

/** "self" = the user, "other" = the candidate partner. */
export type Party = "self" | "other";

export interface HouseRule {
  /** Whose planet are we projecting? */
  planetOf: Party;
  planet: PlanetKey;
  /** Whose house system do we project it onto? */
  houseOf: Party;
  /** 1..12. */
  house: number;
}

export interface District {
  id: string;
  name: string;
  province: string;
  latitude: number;
  longitude: number;
}

/**
 * One theoretical partner: a candidate birth moment from Phase 2, placed in
 * the district where their houses fit the user best.
 */
export interface RefinementHit {
  /** ISO-8601 UTC timestamp string. */
  timestamp: string;
  natal: PlanetaryChart;
  district: District;
  /**
   * 0..1 overall score shown to users as "% match":
   * `ASPECT_WEIGHT * aspectFit + HOUSE_WEIGHT * houseFit`.
   */
  compatibility: number;
  /** 0..1, see `SkyMatch.aspectFit`. */
  aspectFit: number;
  /**
   * 0..1. Each house rule earns 0 when missed, and between 0.5 (planet on the
   * edge of the house) and 1 (planet in the middle of it) when met.
   */
  houseFit: number;
  /** Per-rule aspect detail, in request order. */
  aspects: AspectHit[];
  /**
   * The structured rules this hit satisfied. Clients format the user-facing
   * text in their own language; the server only ships the data.
   */
  satisfiedRules: HouseRule[];
}

export interface RefinementStats {
  candidatesEvaluated: number;
  districtsEvaluated: number;
  pairsEvaluated: number;
  elapsedMs: number;
}

export interface RefinementResult {
  rules: HouseRule[];
  /**
   * Top hit overall — the Phase 3 "soulmate profile". Null only when Phase 2
   * found no candidate at all.
   */
  best: RefinementHit | null;
  /** Top N hits — one per distinct birth day — sorted by compatibility desc. */
  top: RefinementHit[];
  stats: RefinementStats;
}

// ---------- auth ----------

/**
 * The public-facing shape of a User. Never contains the password hash. The
 * server hydrates `district` from the relation when one is set; clients can
 * render the birth location even though the user only types it once at signup.
 */
export interface User {
  id: string;
  email: string;
  birthLocalDate: string;
  birthLocalTime: string;
  birthTimezone: string;
  birthUtcISO: string;
  latitude: number;
  longitude: number;
  district: District | null;
  natal: PlanetaryChart;
}

export interface SignupRequest {
  email: string;
  password: string;
  birthLocalDate: string;
  birthLocalTime: string;
  latitude: number;
  longitude: number;
  /** Optional FK into the District catalogue when picked from the picker. */
  districtId?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ---------- /match request + response ----------

/**
 * Birth data is no longer in the body — the matching engine reads it from
 * the authenticated user. Only matching tunables remain optional.
 */
export interface MatchRequest {
  rules?: SynastryRule[];
  orb?: number;
  limit?: number;
  houseRules?: HouseRule[];
}

/** Server-resolved birth instant + IANA timezone, echoed for transparency. */
export interface ResolvedBirth {
  localISO: string;
  utcISO: string;
  timezone: string;
}

export interface MatchResult {
  birth: ResolvedBirth;
  natal: PlanetaryChart;
  bands: GoldenDegreeBand[];
  orb: number;
  matches: SkyMatch[];
  refinement: RefinementResult;
}

// ---------- /districts response ----------

export interface DistrictsResponse {
  districts: District[];
}

// ---------- matching defaults ----------
//
// The server applies these when a /match request omits a field, and the
// mobile app shows them as the starting values of its advanced controls.

/** Orb tolerance in degrees (workflow.md §3). */
export const DEFAULT_ORB = 3;

/** The classic four-rule synastry set (workflow.md §3–4). */
export const DEFAULT_SYNASTRY_RULES: readonly SynastryRule[] = [
  { self: "sun", aspect: "trine", other: "moon" },
  { self: "venus", aspect: "trine", other: "mars" },
  { self: "mars", aspect: "trine", other: "venus" },
  { self: "moon", aspect: "sextile", other: "venus" },
];

/**
 * Default Phase 3 house rules — classic synastry "soulmate" placements:
 *   - Partner's Venus in the user's 7th house (partnership).
 *   - User's Sun in the partner's 7th house.
 *   - Partner's Moon in the user's 1st house (identity).
 */
export const DEFAULT_HOUSE_RULES: readonly HouseRule[] = [
  { planetOf: "other", planet: "venus", houseOf: "self", house: 7 },
  { planetOf: "self", planet: "sun", houseOf: "other", house: 7 },
  { planetOf: "other", planet: "moon", houseOf: "self", house: 1 },
];

/** Weights of the two halves of `RefinementHit.compatibility`. */
export const ASPECT_WEIGHT = 0.6;
export const HOUSE_WEIGHT = 0.4;
