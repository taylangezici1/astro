/**
 * @synastry/api-types — wire-format types shared between the NestJS API and
 * any client (currently the Expo mobile app).
 *
 * Rules of the road for this file:
 *   1. Pure TypeScript declarations. No runtime code, no transitive deps.
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

/** A Phase 2 candidate row from the GlobalSky table, scored. */
export interface SkyMatch extends PlanetaryChart {
  id: number;
  /** ISO-8601 UTC timestamp string. */
  timestamp: string;
  score: number;
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

export interface RefinementHit {
  /** ISO-8601 UTC timestamp string. */
  timestamp: string;
  natal: PlanetaryChart;
  district: District;
  score: number;
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
  /** Top hit overall — the Phase 3 "soulmate profile". May be null. */
  best: RefinementHit | null;
  /** Top N hits, sorted by score desc. */
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
